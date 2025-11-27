/*
 * Basix Server
 *
 * Flow:
 * 1. Load environment variables from .env file
 * 2. Initialize SQLite database connection
 * 3. Create Express app instance
 * 4. Configure Pug as view engine
 * 5. Add LiveReload middleware (development only)
 * 6. Add request logging and body parsing middleware
 * 7. Add session middleware for authentication
 * 8. Serve static files from public directory
 * 9. Mount application routes
 * 10. Add 404 and error handling middleware
 * 11. Start HTTP server on configured host and port
 * 12. Set up graceful shutdown handlers for SIGTERM/SIGINT
 */

import dotenv from "dotenv";
import express from "express";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { createSessionMiddleware } from "./middleware/session.js";
import { addSessionToLocals } from "./middleware/locals.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { initDatabase, closeDatabase } from "./db/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Initialize database
try {
  initDatabase();
  console.log("Database initialized successfully");
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exit(1);
}

// Create Express app
const app = express();

// View engine setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// LiveReload middleware (must be early)
if (process.env.NODE_ENV === "development") {
  const livereload = await import("./utils/livereload-util.js");
  app.use(livereload.createMiddleware());
  livereload.startServer();
}

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (must be after body parsers)
app.use(createSessionMiddleware());

// Add session data to response locals (must be after session middleware)
app.use(addSessionToLocals);

// Serve static files
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/", routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = process.env.HOST || "localhost";

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);

  // If serving on 0.0.0.0, show all network interfaces
  if (HOST === "0.0.0.0") {
    const networkInterfaces = os.networkInterfaces();
    console.log("\nAccessible on your LAN at:");

    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((networkInterface) => {
        if (networkInterface.family === "IPv4" && !networkInterface.internal) {
          console.log(`  http://${networkInterface.address}:${PORT}`);
        }
      });
    });
  }
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");
    closeDatabase();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
