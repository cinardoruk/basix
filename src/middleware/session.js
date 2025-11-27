import session from "express-session";
import SqliteStore from "better-sqlite3-session-store";
import { getDatabase } from "../db/database.js";

const SqliteSessionStore = SqliteStore(session);

export function createSessionMiddleware() {
  return session({
    store: new SqliteSessionStore({
      client: getDatabase(),
      expired: {
        clear: true,
        intervalMs: 900000, // Clear expired sessions every 15 minutes
      },
    }),
    secret: process.env.SESSION_SECRET || "change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });
}
