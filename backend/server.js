/**
 * server.js — CebuCarTour Express entry point.
 *
 * Start:
 *   node server.js          (production)
 *   npx nodemon server.js   (development)
 */

require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security headers ─────────────────────────────────────────────────────────

app.use(helmet({
  // The API is consumed by a separate Vite frontend — no server-rendered HTML,
  // so a strict CSP on the API itself adds no value and can break fetch preflight.
  contentSecurityPolicy: false,
  // Allow the Resend/upload CDN images to be embedded cross-origin.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── Rate limiters ───────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 1 hour.' },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in 1 hour.' },
});

// General API limiter — broad protection against enumeration on all /api/* routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

// Booking write limiter — tighter cap on booking creation/mutation
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many booking requests. Please try again in 15 minutes.' },
});

// Upload limiter — prevent upload abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests. Please try again in 15 minutes.' },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
if (process.env.NODE_ENV !== 'production') allowedOrigins.push('http://localhost:5173');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// /uploads served directly by Apache from public_html/uploads — no express.static needed

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// ─── Boot-time DB setup ───────────────────────────────────────────────────────

require('./db').query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(64)  NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('[startup] password_resets table error:', err.message));

// ─── Routes ───────────────────────────────────────────────────────────────────

const usersRouter = require('./routes/users');

// Auth endpoints:  /api/auth/register  /api/auth/login  /api/auth/me
app.use('/api/auth/login',           loginLimiter);
app.use('/api/auth/register',        registerLimiter);
app.use('/api/auth/forgot-password', forgotLimiter);
app.use('/api/auth', usersRouter);

// User-management: /api/users/  /api/users/:id  /api/users/:id/approve  …
app.use('/api/users', usersRouter);

app.use('/api', apiLimiter);

app.use('/api/upload',       uploadLimiter,  require('./routes/upload'));
app.use('/api/cars',                         require('./routes/cars'));
app.use('/api/tours',                        require('./routes/tours'));
app.use('/api/bookings',     bookingLimiter, require('./routes/bookings'));
app.use('/api/destinations',                 require('./routes/destinations'));
app.use('/api/settings',                     require('./routes/settings'));

// ─── Serve frontend (production) ─────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'public_html');
  app.use(express.static(frontendPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
