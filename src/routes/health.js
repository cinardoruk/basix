import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

/**
 * Health check endpoint
 * Returns server status and database connectivity
 */
router.get('/', (req, res) => {
  try {
    // Test database connectivity
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as healthy').get();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: result.healthy === 1 ? 'connected' : 'error',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

export default router;
