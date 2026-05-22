/**
 * routes/users.js
 *
 * Handles both authentication endpoints (/register, /login, /me)
 * and user-management endpoints (/, /:id, /:id/approve, etc.).
 *
 * Mounted twice in server.js:
 *   app.use('/api/auth',  usersRouter)
 *   app.use('/api/users', usersRouter)
 */

const express      = require('express');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const pool         = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendVendorDecision, sendSetPasswordEmail, sendAdminNewRegistration, sendPasswordReset } = require('../utils/email');

const router = express.Router();
const SALT_ROUNDS    = 10;
const MIN_PW_LEN     = 8;

// ─── helpers ────────────────────────────────────────────────────────────────

/** Remove password from a user row and safely parse JSON columns. */
function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;           // strip password
  rest.services = parseJson(rest.services);  // ensure array
  return rest;
}

/** Parse a value that may already be an object/array or may be a JSON string. */
function parseJson(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

/** Build the SET clause and value array for partial updates. */
function buildUpdate(fields, body) {
  const sets   = [];
  const values = [];
  for (const field of fields) {
    if (body[field] !== undefined) {
      sets.push(`\`${field}\` = ?`);
      values.push(body[field]);
    }
  }
  return { sets, values };
}

// ─── POST /register ──────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, role = 'customer',
      company = '', phone = '', address = '',
      idType = '', idNumber = '', services = [], bio = '', joined = '',
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // All registrations start pending — admin approves, then user sets password via email link
    const joinedDate = joined || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO users
         (name, email, password, role, status, approvalStatus, approved,
          company, phone, address, idType, idNumber, services, bio, joined)
       VALUES (?, ?, '$UNSET$', ?, 'inactive', 'pending', FALSE, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, email, role,
        company, phone, address, idType, idNumber,
        JSON.stringify(Array.isArray(services) ? services : []),
        bio, joinedDate,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    sendAdminNewRegistration(rows[0]);
    res.status(201).json({
      message: 'Registration submitted. You will receive an email with a link to set your password once your account is approved.',
      user: safeUser(rows[0]),
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /login ─────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userRow = rows[0];

    if (userRow.approvalStatus === 'pending') {
      return res.status(403).json({ error: 'Your registration is pending admin approval. You will receive an email once approved.' });
    }

    if (userRow.password === '$UNSET$') {
      return res.status(403).json({ error: 'Your account is approved. Please check your email for a link to set your password.' });
    }

    const match = await bcrypt.compare(password, userRow.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (userRow.status === 'inactive' || userRow.status === 'suspended') {
      return res.status(403).json({ error: 'Account is suspended. Please contact support.' });
    }

    const user  = safeUser(userRow);
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /me ─────────────────────────────────────────────────────────────────

router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET / ───────────────────────────────────────────────────────────────────

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const offset = req.query.offset !== undefined
      ? Math.max(parseInt(req.query.offset) || 0, 0)
      : (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    // Optional filters: role, status, search (name/email prefix)
    const conditions = [];
    const params     = [];
    if (req.query.role)   { conditions.push('role = ?');                      params.push(req.query.role); }
    if (req.query.status) { conditions.push('status = ?');                    params.push(req.query.status); }
    if (req.query.search) { conditions.push('(name LIKE ? OR email LIKE ?)'); const s = `%${req.query.search}%`; params.push(s, s); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[countRows], [rows]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params),
      pool.query(`SELECT * FROM users ${where} ORDER BY id ASC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    ]);

    const total = countRows[0].total;
    res.json({ data: rows.map(safeUser), total, page: Math.floor(offset / limit) + 1, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id ────────────────────────────────────────────────────────────────

router.put('/:id', verifyToken, async (req, res) => {
  if (String(req.user.userId) !== String(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const allowedFields = [
      'name', 'email', 'company', 'phone', 'address',
      'idType', 'idNumber', 'bio', 'dob', 'country', 'city', 'postalCode',
      'profilePhoto',
      'gcashNumber', 'gcashName',
      'bankNumber', 'bankName', 'bankProvider',
    ];

    const { sets, values } = buildUpdate(allowedFields, req.body);
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/password ───────────────────────────────────────────────────────

router.put('/:id/password', verifyToken, async (req, res) => {
  if (String(req.user.userId) !== String(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { current, newPw } = req.body;
    if (!current || !newPw) {
      return res.status(400).json({ error: 'current and newPw are required' });
    }
    if (newPw.length < MIN_PW_LEN) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PW_LEN} characters` });
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(current, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPw, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/set-password ───────────────────────────────────────────────────

router.put('/:id/set-password', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && String(req.user.userId) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { newPw } = req.body;
    if (!newPw) {
      return res.status(400).json({ error: 'newPw is required' });
    }
    if (newPw.length < MIN_PW_LEN) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PW_LEN} characters` });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = await bcrypt.hash(newPw, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);

    res.json({ message: 'Password set successfully' });
  } catch (err) {
    console.error('set password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cascade-delete vendor's listings
    await pool.query('DELETE FROM cars  WHERE vendorId = ?', [id]);
    await pool.query('DELETE FROM tours WHERE vendorId = ?', [id]);

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/approve ────────────────────────────────────────────────────────

router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE users
         SET approved = TRUE, status = 'active', approvalStatus = 'approved', rejectionReason = ''
       WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);

    // Generate a 24-hour set-password token and email it to the user
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [rows[0].email, token, expires]
    );
    const setUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?reset=${token}`;
    sendSetPasswordEmail(rows[0], setUrl);
    if (process.env.NODE_ENV !== 'production') console.log(`[approve] set-password link for ${rows[0].email}: ${setUrl}`);

    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('approve user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /:id/resend-invite ─────────────────────────────────────────────────

router.post('/:id/resend-invite', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    if (user.approvalStatus !== 'approved') {
      return res.status(400).json({ error: 'User is not approved yet' });
    }

    // Invalidate old tokens and generate a fresh 24-hour one
    await pool.query('DELETE FROM password_resets WHERE email = ?', [user.email]);
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [user.email, token, expires]
    );

    const setUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?reset=${token}`;
    sendSetPasswordEmail(user, setUrl);
    if (process.env.NODE_ENV !== 'production') console.log(`[resend-invite] set-password link for ${user.email}: ${setUrl}`);

    res.json({ message: 'Invite resent', setUrl });
  } catch (err) {
    console.error('resend-invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/reject ─────────────────────────────────────────────────────────

router.put('/:id/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const reason = req.body.reason || '';
    const [result] = await pool.query(
      `UPDATE users
         SET approved = FALSE, status = 'rejected', approvalStatus = 'rejected',
             rejectionReason = ?
       WHERE id = ?`,
      [reason, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    sendVendorDecision(rows[0], 'rejected', reason);
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('reject user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/suspend ────────────────────────────────────────────────────────

router.put('/:id/suspend', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT status FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isActive = rows[0].status === 'active';
    const newStatus         = isActive ? 'inactive'   : 'active';
    const newApprovalStatus = isActive ? 'suspended'  : 'approved';

    await pool.query(
      'UPDATE users SET status = ?, approvalStatus = ? WHERE id = ?',
      [newStatus, newApprovalStatus, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (isActive) sendVendorDecision(updated[0], 'suspended');
    res.json(safeUser(updated[0]));
  } catch (err) {
    console.error('suspend user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/deletion-request ───────────────────────────────────────────────

router.put('/:id/deletion-request', verifyToken, async (req, res) => {
  if (String(req.user.userId) !== String(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const reason = req.body.reason || '';
    const requestedAt = new Date().toISOString();

    const [result] = await pool.query(
      `UPDATE users
         SET deletionRequested = TRUE, deletionReason = ?, deletionRequestedAt = ?
       WHERE id = ?`,
      [reason, requestedAt, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('deletion-request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id/cancel-deletion ────────────────────────────────────────────────

router.put('/:id/cancel-deletion', verifyToken, async (req, res) => {
  if (String(req.user.userId) !== String(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE users
         SET deletionRequested = FALSE, deletionReason = '', deletionRequestedAt = ''
       WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(safeUser(rows[0]));
  } catch (err) {
    console.error('cancel-deletion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /forgot-password ───────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    // Always respond the same way to prevent email enumeration
    if (rows.length === 0) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any previous reset token for this address
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl    = `${frontendUrl}/?reset=${token}`;

    sendPasswordReset(email, resetUrl);
    if (process.env.NODE_ENV !== 'production') console.log(`[password-reset] link for ${email}: ${resetUrl}`);

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─── POST /reset-password ────────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < MIN_PW_LEN) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PW_LEN} characters.` });
  }

  try {
    const [rows] = await pool.query(
      'SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const { email } = rows[0];
    const hashed    = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);

    res.json({ message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


module.exports = router;
