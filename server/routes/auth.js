const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../storage/users.json');

// Load users from file
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Save users to file
function saveUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  if (username.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const users = loadUsers();

  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Username already taken.' });

  const passwordHash = await bcrypt.hash(password, 12);
  users.push({ username, passwordHash, createdAt: new Date().toISOString() });
  saveUsers(users);

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ message: 'Account created!', token });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  // Also check legacy admin from .env
  if (!user) {
    if (username === 'admin') {
      const isValid = await bcrypt.compare(password, process.env.PASSWORD_HASH);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ message: 'Login successful', token });
    }
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login successful', token });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.json({ valid: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;