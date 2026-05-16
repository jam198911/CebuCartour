/**
 * routes/tours.js — Full CRUD for tour listings.
 * Mounted at /api/tours in server.js.
 */

const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── helper ──────────────────────────────────────────────────────────────────

function parseJson(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

function formatTour(t) {
  if (!t) return null;
  return { ...t, includes: parseJson(t.includes) };
}

// ─── GET / ───────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit) || 200, 1), 500);
    const offset = req.query.offset !== undefined
      ? Math.max(parseInt(req.query.offset) || 0, 0)
      : (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    const [[countRows], [rows]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM tours'),
      pool.query('SELECT * FROM tours ORDER BY id ASC LIMIT ? OFFSET ?', [limit, offset]),
    ]);

    const total = countRows[0].total;
    res.json({ data: rows.map(formatTour), total, page: Math.floor(offset / limit) + 1, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('get tours error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tours WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(formatTour(rows[0]));
  } catch (err) {
    console.error('get tour error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      vendorId, name, location, image = '', category = '',
      duration = '', groupSize = 0, price, available = true,
      rating = 0, reviews = 0, includes = [], description = '',
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO tours
         (vendorId, name, location, image, category, duration, groupSize,
          price, available, rating, reviews, includes, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId || 0, name, location || '', image, category,
        duration, groupSize, price, available,
        rating, reviews, JSON.stringify(includes), description,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM tours WHERE id = ?', [result.insertId]);
    res.status(201).json(formatTour(rows[0]));
  } catch (err) {
    console.error('create tour error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id ────────────────────────────────────────────────────────────────

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      vendorId, name, location, image, category, duration,
      groupSize, price, available, rating, reviews, includes, description,
    } = req.body;

    const fields = [];
    const values = [];

    const add = (col, val) => { fields.push(`\`${col}\` = ?`); values.push(val); };

    if (vendorId   !== undefined) add('vendorId',   vendorId);
    if (name       !== undefined) add('name',       name);
    if (location   !== undefined) add('location',   location);
    if (image      !== undefined) add('image',      image);
    if (category   !== undefined) add('category',   category);
    if (duration   !== undefined) add('duration',   duration);
    if (groupSize  !== undefined) add('groupSize',  groupSize);
    if (price      !== undefined) add('price',      price);
    if (available  !== undefined) add('available',  available);
    if (rating     !== undefined) add('rating',     rating);
    if (reviews    !== undefined) add('reviews',    reviews);
    if (includes   !== undefined) add('includes',   JSON.stringify(includes));
    if (description !== undefined) add('description', description);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE tours SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    const [rows] = await pool.query('SELECT * FROM tours WHERE id = ?', [req.params.id]);
    res.json(formatTour(rows[0]));
  } catch (err) {
    console.error('update tour error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tours WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json({ message: 'Tour deleted successfully' });
  } catch (err) {
    console.error('delete tour error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
