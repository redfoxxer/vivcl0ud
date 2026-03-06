const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const { encryptFile, decryptFile } = require('../middleware/encrypt');
const { saveVersion, listVersions, getVersion } = require('../utils/versioning');

// ── Each user gets their own storage folder ──────────────────────────────
function getUserStorageDir(username) {
  const dir = path.join(__dirname, '../storage/users', username, 'files');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUserVersionsDir(username) {
  const dir = path.join(__dirname, '../storage/users', username, 'versions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Multer — memory storage for encryption before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// ── GET /api/files — List user's files ───────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  try {
    const storageDir = getUserStorageDir(req.user.username);
    const files = fs.readdirSync(storageDir)
      .filter(f => f.endsWith('.enc'))
      .map(f => {
        const stat = fs.statSync(path.join(storageDir, f));
        return {
          name: f.replace('.enc', ''),
          size: stat.size,
          uploadedAt: stat.mtime
        };
      });
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Could not list files.' });
  }
});

// ── POST /api/files/upload ────────────────────────────────────────────────
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided.' });

  try {
    const storageDir = getUserStorageDir(req.user.username);
    const versionsDir = getUserVersionsDir(req.user.username);
    const filename = req.file.originalname;
    const savePath = path.join(storageDir, filename + '.enc');
    const encrypted = encryptFile(req.file.buffer);

    // Save version backup if file already exists
    if (fs.existsSync(savePath)) {
      saveVersion(filename, fs.readFileSync(savePath), versionsDir);
    }

    fs.writeFileSync(savePath, encrypted);
    res.json({ message: `✅ "${filename}" uploaded and encrypted.`, name: filename, size: encrypted.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// ── GET /api/files/download/:filename ────────────────────────────────────
router.get('/download/:filename', authMiddleware, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(getUserStorageDir(req.user.username), filename + '.enc');

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: 'File not found.' });

  try {
    const decrypted = decryptFile(fs.readFileSync(filePath));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: 'Decryption failed.' });
  }
});

// ── DELETE /api/files/:filename ───────────────────────────────────────────
router.delete('/:filename', authMiddleware, (req, res) => {
  const filename = req.params.filename;
  const storageDir = getUserStorageDir(req.user.username);
  const versionsDir = getUserVersionsDir(req.user.username);
  const filePath = path.join(storageDir, filename + '.enc');

  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: 'File not found.' });

  saveVersion(filename, fs.readFileSync(filePath), versionsDir);
  fs.unlinkSync(filePath);
  res.json({ message: `🗑️ "${filename}" deleted. A backup version was saved.` });
});

// ── GET /api/files/versions/:filename ────────────────────────────────────
router.get('/versions/:filename', authMiddleware, (req, res) => {
  const versionsDir = getUserVersionsDir(req.user.username);
  const versions = listVersions(req.params.filename, versionsDir);
  res.json({ versions });
});

// ── POST /api/files/restore/:filename/:version ───────────────────────────
router.post('/restore/:filename/:version', authMiddleware, (req, res) => {
  const { filename, version } = req.params;
  const storageDir = getUserStorageDir(req.user.username);
  const versionsDir = getUserVersionsDir(req.user.username);

  try {
    const versionBuffer = getVersion(filename, version, versionsDir);
    const savePath = path.join(storageDir, filename + '.enc');
    if (fs.existsSync(savePath)) saveVersion(filename, fs.readFileSync(savePath), versionsDir);
    fs.writeFileSync(savePath, versionBuffer);
    res.json({ message: `✅ "${filename}" restored to version: ${version}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
