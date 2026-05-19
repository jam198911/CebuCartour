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

router.put('/:id', async (req, res) => {
  try {
    const {
      status, vendorStatus, paid,
      date, returnDate, pickTime, dropTime, pickup, dropoff,
      name, email, phone, guests, total,
      notes, paymentMethod,
    } = req.body;

    const fields = [];
    const values = [];

    const add = (col, val) => { fields.push(`\`${col}\` = ?`); values.push(val); };

    if (status        !== undefined) add('status',        status);
    if (vendorStatus  !== undefined) add('vendorStatus',  vendorStatus);
    if (paid          !== undefined) add('paid',          paid);
    if (date          !== undefined) add('date',          date);
    if (returnDate    !== undefined) add('returnDate',    returnDate);
    if (pickTime      !== undefined) add('pickTime',      pickTime);
    if (dropTime      !== undefined) add('dropTime',      dropTime);
    if (pickup        !== undefined) add('pickup',        pickup);
    if (dropoff       !== undefined) add('dropoff',       dropoff);
    if (name          !== undefined) add('name',          name);
    if (email         !== undefined) add('email',         email);
    if (phone         !== undefined) add('phone',         phone);
    if (guests        !== undefined) add('guests',        guests);
    if (total         !== undefined) add('total',         total);
    if (notes         !== undefined) add('notes',         notes);
    if (paymentMethod        !== undefined) add('paymentMethod', paymentMethod);
    if (req.body.rating     !== undefined) add('rating',        req.body.rating);
    if (req.body.ratingNote !== undefined) add('ratingNote',    req.body.ratingNote);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (status !== undefined) sendBookingStatusUpdate(rows[0], status);
    res.json(rows[0]);
  } catch (err) {
    console.error('update booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
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
