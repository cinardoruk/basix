import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

/**
 * Initialize database connection and run schema
 */
export function initDatabase() {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const DATABASE_PATH = process.env.DATABASE_PATH || "./data/vestr.db";
  const dbPath = path.resolve(DATABASE_PATH);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL"); // write-ahead-logging for better concurrency
  db.pragma("foreign_keys = ON"); // Enforce foreign keys

  // Run schema initialization
  const schemaPath = path.join(__dirname, "../../data/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  try {
    db.exec(schema);
  } catch (err) {
    console.error("awawa====>", err);
  }

  console.log(`Database initialized at ${dbPath}`);

  return db;
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanExpiredCache() {
  const db = getDatabase();
  const stmt = db.prepare(
    'DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < datetime("now")',
  );
  const result = stmt.run();
  return result.changes;
}

/**
 * Clean up expired sessions
 */
export function cleanExpiredSessions() {
  const db = getDatabase();
  const stmt = db.prepare(
    'DELETE FROM sessions WHERE expires < datetime("now")',
  );
  const result = stmt.run();
  return result.changes;
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  cleanExpiredCache,
  cleanExpiredSessions,
};
