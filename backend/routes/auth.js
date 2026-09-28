const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, seedSampleNotes } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const createdAt = new Date().toISOString();
    const displayName = name ? name.trim() : trimmedEmail.split('@')[0];

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?)
    `).run(trimmedEmail, passwordHash, displayName, createdAt);

    const userId = Number(result.lastInsertRowid);

    // Seed sample notes for a warm first-time experience
    try {
      seedSampleNotes(userId);
    } catch (seedErr) {
      console.error('Note seeding warning:', seedErr);
    }

    const token = jwt.sign(
      { id: userId, email: trimmedEmail, name: displayName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        email: trimmedEmail,
        name: displayName,
        created_at: createdAt
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error while creating account.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error while logging in.' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const noteStats = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ?').get(req.user.id);

    return res.json({
      user: {
        ...user,
        notesCount: noteStats ? noteStats.count : 0
      }
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
