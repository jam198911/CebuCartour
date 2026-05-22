/**
 * routes/destinations.js — Full CRUD for destinations.
 * Mounted at /api/destinations in server.js.
 */

const express = require('express');
const pool    = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── helper ──────────────────────────────────────────────────────────────────

function parseJson(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

function formatDestination(d) {
  if (!d) return null;
  return { ...d, highlights: parseJson(d.highlights) };
}

// ─── GET / ───────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit) || 200, 1), 500);
    const offset = req.query.offset !== undefined
      ? Math.max(parseInt(req.query.offset) || 0, 0)
      : (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    const [[countRows], [rows]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM destinations'),
      pool.query('SELECT * FROM destinations ORDER BY id ASC LIMIT ? OFFSET ?', [limit, offset]),
    ]);

    const total = countRows[0].total;
    res.json({ data: rows.map(formatDestination), total, page: Math.floor(offset / limit) + 1, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('get destinations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM destinations WHERE id = ?', [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    res.json(formatDestination(rows[0]));
  } catch (err) {
    console.error('get destination error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, tag = '', tagColor = '', img = '', location = '',
      bestTime = '', duration = '', difficulty = '', distance = '',
      description = '', highlights = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO destinations
         (name, tag, tagColor, img, location, bestTime, duration,
          difficulty, distance, description, highlights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, tag, tagColor, img, location, bestTime, duration,
        difficulty, distance, description, JSON.stringify(highlights),
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM destinations WHERE id = ?', [result.insertId]
    );
    res.status(201).json(formatDestination(rows[0]));
  } catch (err) {
    console.error('create destination error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id ────────────────────────────────────────────────────────────────

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, tag, tagColor, img, location, bestTime,
      duration, difficulty, distance, description, highlights,
    } = req.body;

    const fields = [];
    const values = [];

    const add = (col, val) => { fields.push(`\`${col}\` = ?`); values.push(val); };

    if (name        !== undefined) add('name',        name);
    if (tag         !== undefined) add('tag',         tag);
    if (tagColor    !== undefined) add('tagColor',    tagColor);
    if (img         !== undefined) add('img',         img);
    if (location    !== undefined) add('location',    location);
    if (bestTime    !== undefined) add('bestTime',    bestTime);
    if (duration    !== undefined) add('duration',    duration);
    if (difficulty  !== undefined) add('difficulty',  difficulty);
    if (distance    !== undefined) add('distance',    distance);
    if (description !== undefined) add('description', description);
    if (highlights  !== undefined) add('highlights',  JSON.stringify(highlights));

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE destinations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM destinations WHERE id = ?', [req.params.id]
    );
    res.json(formatDestination(rows[0]));
  } catch (err) {
    console.error('update destination error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM destinations WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (err) {
    console.error('delete destination error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
