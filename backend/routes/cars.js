/**
 * routes/cars.js — Full CRUD for car listings.
 * Mounted at /api/cars in server.js.
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

function formatCar(c) {
  if (!c) return null;
  return { ...c, features: parseJson(c.features), images: parseJson(c.images) };
}

// ─── GET / ───────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit) || 200, 1), 500);
    const offset = req.query.offset !== undefined
      ? Math.max(parseInt(req.query.offset) || 0, 0)
      : (Math.max(parseInt(req.query.page) || 1, 1) - 1) * limit;

    // Only show cars from approved+active vendors for public listing
    const vendorFilter = `JOIN users u ON c.vendorId = u.id
                          WHERE u.role = 'vendor' AND u.status = 'active' AND u.approvalStatus = 'approved'`;

    const [[countRows], [rows]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM cars c ${vendorFilter}`),
      pool.query(`SELECT c.* FROM cars c ${vendorFilter} ORDER BY c.id ASC LIMIT ? OFFSET ?`, [limit, offset]),
    ]);

    const total = countRows[0].total;
    res.json({ data: rows.map(formatCar), total, page: Math.floor(offset / limit) + 1, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('get cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(formatCar(rows[0]));
  } catch (err) {
    console.error('get car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      vendorId, name, type = '', location = '', fuel = '',
      transmission = '', image = '', price, seats = 4,
      mileage = 0, available = true, rating = 0, reviews = 0, description = '',
      color = '', year = null, withDriver = false,
      features = [], images = [],
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO cars
         (vendorId, name, type, location, fuel, transmission, image,
          price, seats, mileage, available, rating, reviews, description,
          color, year, withDriver, features, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId || 0, name, type, location, fuel, transmission,
        image, price, seats, mileage, available, rating, reviews, description,
        color, year, withDriver ? true : false,
        JSON.stringify(features), JSON.stringify(images),
      ]
    );

    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [result.insertId]);
    res.status(201).json(formatCar(rows[0]));
  } catch (err) {
    console.error('create car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /:id ────────────────────────────────────────────────────────────────

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT vendorId FROM cars WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (req.user.role !== 'admin' && String(existing[0].vendorId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      vendorId, name, type, location, fuel, transmission,
      image, price, seats, mileage, available, rating, reviews, description,
      color, year, withDriver, features, images,
    } = req.body;

    const fields = [];
    const values = [];

    const add = (col, val) => { fields.push(`\`${col}\` = ?`); values.push(val); };

    if (vendorId !== undefined && req.user.role === 'admin') add('vendorId', vendorId);
    if (name         !== undefined) add('name',         name);
    if (type         !== undefined) add('type',         type);
    if (location     !== undefined) add('location',     location);
    if (fuel         !== undefined) add('fuel',         fuel);
    if (transmission !== undefined) add('transmission', transmission);
    if (image        !== undefined) add('image',        image);
    if (price        !== undefined) add('price',        price);
    if (seats        !== undefined) add('seats',        seats);
    if (mileage      !== undefined) add('mileage',      mileage);
    if (available    !== undefined) add('available',    available);
    if (rating       !== undefined) add('rating',       rating);
    if (reviews      !== undefined) add('reviews',      reviews);
    if (description  !== undefined) add('description',  description);
    if (color        !== undefined) add('color',        color);
    if (year         !== undefined) add('year',         year);
    if (withDriver   !== undefined) add('withDriver',   withDriver ? 1 : 0);
    if (features     !== undefined) add('features',     JSON.stringify(features));
    if (images       !== undefined) add('images',       JSON.stringify(images));

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE cars SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    res.json(formatCar(rows[0]));
  } catch (err) {
    console.error('update car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id ─────────────────────────────────────────────────────────────

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT vendorId FROM cars WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (req.user.role !== 'admin' && String(existing[0].vendorId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [result] = await pool.query('DELETE FROM cars WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error('delete car error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
