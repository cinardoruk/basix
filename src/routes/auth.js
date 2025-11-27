import express from 'express';
import { getDatabase } from '../db/database.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Show login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { error: req.query.error });
});

// Show register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', { error: req.query.error });
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=Server+error');
  }
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const db = getDatabase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.redirect('/register?error=Email+already+registered');
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);

    // Set session
    req.session.userId = result.lastInsertRowid;
    req.session.username = username;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/register?error=Server+error');
  }
});

// Handle logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

export default router;
