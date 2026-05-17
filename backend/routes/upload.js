/**
 * routes/upload.js — File upload endpoint.
 * Mounted at /api/upload in server.js.
 * Files are saved to backend/uploads/ and served as static assets.
 *
 * Security layers:
 *  1. fileFilter  — rejects non-image MIME types declared by the client.
 *  2. Filename    — extension is derived from the *validated* MIME type, never
 *                   from the original filename, so shell.php → saved as .jpg.
 *  3. Magic bytes — reads the first 12 bytes of the saved file and rejects
 *                   anything whose signature doesn't match a real image format.
 *                   The file is deleted before the error response is sent.
 */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');

const router = express.Router();

// ─── Allowed MIME types → safe extension ─────────────────────────────────────

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/gif':  '.gif',
  'image/webp': '.webp',
};

// ─── Magic-byte signatures ────────────────────────────────────────────────────

const MAGIC_SIGS = [
  // JPEG: FF D8 FF
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  // PNG:  89 50 4E 47 0D 0A 1A 0A
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  // GIF:  47 49 46 38  ("GIF8")
  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: bytes 8–11 spell "WEBP" inside a RIFF container
  { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

function hasValidMagicBytes(filePath) {
  const fd  = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  return MAGIC_SIGS.some(({ offset, bytes }) =>
    bytes.every((b, i) => buf[offset + i] === b)
  );
}

// ─── Multer config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    // Extension comes from the validated MIME map — never from file.originalname.
    // This prevents a .php (or any executable) extension reaching the filesystem.
    const ext    = ALLOWED_MIME[file.mimetype.toLowerCase()] ?? '.jpg';
    const unique = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME[file.mimetype.toLowerCase()]) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Magic-bytes check — validates actual file content, not just the declared MIME.
  if (!hasValidMagicBytes(req.file.path)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'File content does not match an allowed image format' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// ─── Multer error handler ─────────────────────────────────────────────────────

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
