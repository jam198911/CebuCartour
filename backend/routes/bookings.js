/**
 * routes/bookings.js — Full CRUD for bookings.
 * Mounted at /api/bookings in server.js.
 */

const express              = require('express');
const { randomUUID }       = require('crypto');
const pool                 = require('../db');
const { verifyToken } = require('../middleware/auth');
const { sendBookingCreated, sendBookingStatusUpdate } = require('../utils/email');

const router = express.Router();

// ─── GET / ───────────────────────────────────────────────────────────────────

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 500);
    const offset = req.query.offset !== undefined
      ? Math.max(parseInt(req.query.offset) || 0, 0)
      : (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    // Scope bookings by role: customers see only their own; vendors see only theirs
    let where  = '';
    let params = [];
    if (req.user.role === 'customer') {
      where  = 'WHERE userId = ?';
      params = [req.user.userId];
    } else if (req.user.role === 'vendor') {
      where  = 'WHERE vendorId = ?';
      params = [req.user.userId];
    }

    const [[countRows], [rows]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM bookings ${where}`, params),
      pool.query(`SELECT * FROM bookings ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
    ]);

    const total = countRows[0].total;
    res.json({ data: rows, total, page: Math.floor(offset / limit) + 1, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('get bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('get booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      userId, vendorId, itemId, type,
      date = '', returnDate = '', pickTime = '', dropTime = '',
      pickup = '', dropoff = '',
      name = '', email = '', phone = '', guests = 1,
      total, notes = '', paymentMethod = '', paid = false,
    } = req.body;

    if (!type || total === undefined) {
      return res.status(400).json({ error: 'type and total are required' });
    }

    // ── Availability check ──────────────────────────────────────────────────
    if (itemId && date) {
      // Treat an empty returnDate as a single-day booking (end = start)
      const effectiveEnd = (returnDate && returnDate.trim()) ? returnDate.trim() : date;

      if (type === 'car') {
        // A car is a single physical unit — any date-range overlap is a conflict.
        // Overlap condition: existing.start <= new.end  AND  existing.end >= new.start
        const [conflicts] = await pool.query(
          `SELECT id FROM bookings
           WHERE itemId = ? AND type = 'car'
             AND status NOT IN ('cancelled')
             AND date <= ?
             AND COALESCE(NULLIF(returnDate, ''), date) >= ?
           LIMIT 1`,
          [itemId, effectiveEnd, date]
        );
        if (conflicts.length > 0) {
          return res.status(409).json({
            error: 'This car is already booked for the selected dates. Please choose different dates.',
            conflictBookingId: conflicts[0].id,
          });
        }

      } else if (type === 'tour') {
        // Tours allow multiple bookings up to the tour's groupSize capacity.
        const [[tourRows], [sumRows]] = await Promise.all([
          pool.query('SELECT groupSize FROM tours WHERE id = ? LIMIT 1', [itemId]),
          pool.query(
            `SELECT COALESCE(SUM(guests), 0) AS booked
             FROM bookings
             WHERE itemId = ? AND type = 'tour' AND date = ?
               AND status NOT IN ('cancelled')`,
            [itemId, date]
          ),
        ]);
        const groupSize = Number(tourRows[0]?.groupSize) || 0;
        const booked    = Number(sumRows[0].booked);
        const incoming  = Number(guests) || 1;
        if (groupSize > 0 && booked + incoming > groupSize) {
          const remaining = groupSize - booked;
          return res.status(409).json({
            error: remaining > 0
              ? `Not enough spots — only ${remaining} spot${remaining === 1 ? '' : 's'} left for this tour on ${date}.`
              : `This tour is fully booked for ${date}.`,
          });
        }
      }
    }

    const bookingId = 'BK-' + randomUUID().slice(0, 8).toUpperCase();

    await pool.query(
      `INSERT INTO bookings
         (id, userId, vendorId, itemId, type, status, vendorStatus,
          date, returnDate, pickTime, dropTime, pickup, dropoff,
          name, email, phone, guests, total, notes, paymentMethod, paid)
       VALUES (?, ?, ?, ?, ?, 'pending', 'pending',
               ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        userId   || 0,
        vendorId || 0,
        itemId   || 0,
        type,
        date, returnDate, pickTime, dropTime, pickup, dropoff,
        name, email, phone, guests, total,
        notes, paymentMethod, paid,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    sendBookingCreated(rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id ────────────────────────────────────────────────────────────────

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = existing[0];
    const { role, userId } = req.user;

    // Ownership check for non-admins
    if (role === 'customer' && String(booking.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (role === 'vendor' && String(booking.vendorId) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = req.body;
    const fields = [];
    const values = [];
    const add = (col, val) => { fields.push(`\`${col}\` = ?`); values.push(val); };

    if (role === 'admin') {
      // Admin can update any field
      if (body.status        !== undefined) add('status',        body.status);
      if (body.vendorStatus  !== undefined) add('vendorStatus',  body.vendorStatus);
      if (body.paid          !== undefined) add('paid',          body.paid);
      if (body.date          !== undefined) add('date',          body.date);
      if (body.returnDate    !== undefined) add('returnDate',    body.returnDate);
      if (body.pickTime      !== undefined) add('pickTime',      body.pickTime);
      if (body.dropTime      !== undefined) add('dropTime',      body.dropTime);
      if (body.pickup        !== undefined) add('pickup',        body.pickup);
      if (body.dropoff       !== undefined) add('dropoff',       body.dropoff);
      if (body.name          !== undefined) add('name',          body.name);
      if (body.email         !== undefined) add('email',         body.email);
      if (body.phone         !== undefined) add('phone',         body.phone);
      if (body.guests        !== undefined) add('guests',        body.guests);
      if (body.total         !== undefined) add('total',         body.total);
      if (body.notes         !== undefined) add('notes',         body.notes);
      if (body.paymentMethod !== undefined) add('paymentMethod', body.paymentMethod);
      if (body.rating        !== undefined) add('rating',        body.rating);
      if (body.ratingNote    !== undefined) add('ratingNote',    body.ratingNote);
    } else if (role === 'vendor') {
      // Vendors can only update their side of the booking
      if (body.vendorStatus !== undefined) add('vendorStatus', body.vendorStatus);
      if (body.dropTime     !== undefined) add('dropTime',     body.dropTime);
      if (body.dropoff      !== undefined) add('dropoff',      body.dropoff);
    } else if (role === 'customer') {
      // Customers can cancel their own booking, edit contact details, and leave a rating
      if (body.status !== undefined) {
        if (body.status !== 'cancelled') {
          return res.status(403).json({ error: 'Customers can only cancel bookings' });
        }
        add('status', body.status);
      }
      if (body.notes      !== undefined) add('notes',      body.notes);
      if (body.name       !== undefined) add('name',       body.name);
      if (body.email      !== undefined) add('email',      body.email);
      if (body.phone      !== undefined) add('phone',      body.phone);
      if (body.pickup     !== undefined) add('pickup',     body.pickup);
      if (body.rating     !== undefined) add('rating',     body.rating);
      if (body.ratingNote !== undefined) add('ratingNote', body.ratingNote);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (body.status !== undefined) sendBookingStatusUpdate(rows[0], body.status);
    res.json(rows[0]);
  } catch (err) {
    console.error('update booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Only admins can hard-delete bookings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('delete booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
