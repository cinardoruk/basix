import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

/**
 * Example API endpoint
 * GET /api/examples
 */
router.get('/examples', (req, res) => {
  try {
    const db = getDatabase();
    const examples = db.prepare('SELECT * FROM examples ORDER BY created_at DESC').all();
    res.json({ data: examples });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Example API endpoint
 * POST /api/examples
 */
router.post('/examples', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO examples (name, description) VALUES (?, ?)');
    const result = stmt.run(name, description || null);

    const example = db.prepare('SELECT * FROM examples WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ data: example });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
