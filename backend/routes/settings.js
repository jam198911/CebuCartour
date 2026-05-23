/**
 * routes/settings.js — App-level settings endpoints.
 * Mounted at /api/settings in server.js.
 */

const express = require('express');
const pool    = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /service-fee ────────────────────────────────────────────────────────

router.get('/service-fee', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM app_settings WHERE name = 'serviceFee'"
    );

    if (rows.length === 0) {
      return res.json({ fee: 0 });
    }

    res.json({ fee: Number(rows[0].value) });
  } catch (err) {
    console.error('get service-fee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /service-fee ────────────────────────────────────────────────────────

router.put('/service-fee', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fee } = req.body;

    if (fee === undefined || fee === null) {
      return res.status(400).json({ error: 'fee is required' });
    }

    const numFee = Number(fee);
    if (isNaN(numFee) || numFee < 0) {
      return res.status(400).json({ error: 'fee must be a non-negative number' });
    }

    await pool.query(
      `INSERT INTO app_settings (name, value)
         VALUES ('serviceFee', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [String(numFee)]
    );

    res.json({ fee: numFee });
  } catch (err) {
    console.error('update service-fee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /hero-slides ────────────────────────────────────────────────────────

router.get('/hero-slides', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM app_settings WHERE name = 'heroSlides'"
    );
    if (rows.length === 0) return res.json({ slides: [] });
    res.json({ slides: JSON.parse(rows[0].value) });
  } catch (err) {
    console.error('get hero-slides error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /hero-slides ────────────────────────────────────────────────────────

router.put('/hero-slides', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { slides } = req.body;
    if (!Array.isArray(slides) || slides.length !== 5) {
      return res.status(400).json({ error: 'slides must be an array of 5 items' });
    }
    await pool.query(
      `INSERT INTO app_settings (name, value)
         VALUES ('heroSlides', ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [JSON.stringify(slides)]
    );
    res.json({ slides });
  } catch (err) {
    console.error('update hero-slides error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
