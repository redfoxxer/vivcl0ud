require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve React frontend in production ────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client/build')));

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '☁️ viviCL0UD is running!' });
});

// ─── Catch-all: serve React app ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// ─── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n☁️  viviCL0UD server running at http://localhost:${PORT}`);
  console.log(`🔐 Auth:  http://localhost:${PORT}/api/auth/login`);
  console.log(`📁 Files: http://localhost:${PORT}/api/files\n`);
});
