/**
 * routes/upload.js — File upload endpoint.
 * Mounted at /api/upload in server.js.
 * Files are uploaded to Cloudflare R2 and served via R2 public URL.
 *
 * Security layers:
 *  1. fileFilter  — rejects non-image MIME types declared by the client.
 *  2. Filename    — extension is derived from the *validated* MIME type, never
 *                   from the original filename, so shell.php → saved as .jpg.
 *  3. Magic bytes — reads the first 12 bytes and rejects anything whose
 *                   signature doesn't match a real image format.
 */

const express = require('express');
const multer  = require('multer');
const crypto  = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

// ─── R2 client ────────────────────────────────────────────────────────────────

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

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
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },                               // JPEG
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG
  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },                          // GIF
  { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },                          // WebP
];

function hasValidMagicBytes(buffer) {
  return MAGIC_SIGS.some(({ offset, bytes }) =>
    bytes.every((b, i) => buffer[offset + i] === b)
  );
}

// ─── Multer — memory storage (buffer sent directly to R2) ────────────────────

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME[file.mimetype.toLowerCase()]) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── POST / ──────────────────────────────────────────────────────────────────

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Magic-bytes check on the in-memory buffer
  if (!hasValidMagicBytes(req.file.buffer)) {
    return res.status(400).json({ error: 'File content does not match an allowed image format' });
  }

  const ext      = ALLOWED_MIME[req.file.mimetype.toLowerCase()] ?? '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;

  try {
    await r2.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET,
      Key:         filename,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`;
    res.json({ url, filename });
  } catch (err) {
    console.error('R2 upload error:', err);
    res.status(500).json({ error: 'Failed to upload image. Please try again.' });
  }
});

// ─── Multer error handler ─────────────────────────────────────────────────────

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
