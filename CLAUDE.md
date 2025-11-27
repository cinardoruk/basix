# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Basix** is an Express.js boilerplate for building simple server-side rendered web applications with HTMX. Philosophy: no TypeScript, no React, no build step—just simple, fast development.

**Stack:** Express 5, Pug templates, HTMX (CDN), Bootstrap 5 (CDN), SQLite (better-sqlite3), LiveReload

## Development Commands

```bash
# Local development (localhost only)
npm run dev

# LAN development (accessible from other devices)
npm run dev:lan

# Production
NODE_ENV=production npm start
```

**Important:** Use `npm run dev:lan` when testing on mobile devices or other machines on your network. The server will display all accessible IP addresses on startup.

## Server Architecture

### Server Initialization Flow (src/server.js)

The server follows this exact initialization order:

1. Load environment variables (.env)
2. Initialize SQLite database (runs schema.sql)
3. Create Express app
4. Configure Pug view engine
5. **Add LiveReload middleware** (dev only, MUST be early in stack)
6. Add request logging
7. **Add session middleware** (MUST come before routes that use sessions)
8. Add body parsers
9. Serve static files from `/public`
10. Mount application routes (auth middleware applied per-route)
11. Add 404 handler (must be after all routes)
12. Add error handler (must be last)
13. Start HTTP server
14. Set up graceful shutdown handlers

**Critical:** Middleware order matters. LiveReload first (dev only), then logging, then session, then body parsers, then static files, then routes, then 404 handler, then error handler last.

### ES Modules Configuration

This project uses ES modules throughout (`"type": "module"` in package.json):
- Use `import/export` syntax only
- No CommonJS `require()`
- File paths must include `.js` extension in imports
- `__dirname` requires polyfill:
  ```javascript
  import { fileURLToPath } from 'url';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```

## Routing Architecture

Routes use a **centralized aggregation pattern** in `src/routes/index.js`:

```javascript
// Landing page at root
router.get("/", (req, res) => res.render("landing"));

// Sub-routers mounted with prefixes
router.use("/health", healthRouter);
router.use("/api", apiRouter);
```

**Current routes:**
- `GET /` → Landing page (Pug template)
- `GET /login` → Login page
- `POST /login` → Handle login
- `GET /register` → Registration page
- `POST /register` → Handle registration
- `POST /logout` → Handle logout
- `GET /dashboard` → Protected dashboard (requires auth)
- `GET /health` → Health check with database connectivity test
- `GET /api/examples` → Example data endpoint
- `POST /api/examples` → Create example

**To add a new route:**
1. Create route file in `src/routes/`
2. Export Express Router
3. Mount in `src/routes/index.js` with appropriate prefix

## Database Layer

### Singleton Pattern

Database uses singleton pattern in `src/db/database.js`:
- `initDatabase()` - Initializes connection and runs schema
- `getDatabase()` - Returns existing connection
- `closeDatabase()` - Closes connection on shutdown

**Key configurations:**
- WAL mode enabled for better concurrent access
- Foreign keys enforced
- Schema runs automatically on startup from `data/schema.sql`

**Usage in routes:**
```javascript
import { getDatabase } from '../db/database.js';

const db = getDatabase();
const result = db.prepare('SELECT * FROM examples').all();
```

**Always use prepared statements** with parameterized queries. Never string interpolation.

### Schema Management

Schema is in `data/schema.sql`. All tables use `CREATE TABLE IF NOT EXISTS` since schema runs on every startup. Tables include:
- `users` - Authentication
- `sessions` - Session management with expiration
- `tasks` - Simple task queue (replaces RabbitMQ for basic needs)
- `cache` - Key-value cache (replaces Redis for basic needs)
- `examples` - Placeholder/example table

## View System (Pug Templates)

Templates are in `src/views/` with inheritance pattern:

```
base.pug (layout)
├── Includes Bootstrap & HTMX via CDN
├── Links to /css/style.css
├── Defines blocks: head, content, scripts
└── landing.pug (extends base)
```

**To create a new page:**
1. Create `.pug` file extending `base.pug`
2. Override `content` block
3. Render from route: `res.render('pagename', { data })`

**Base template provides:**
- Bootstrap 5.3.2 (with integrity hashes)
- HTMX 1.9.10 (with integrity hashes)
- Responsive meta viewport
- Custom CSS from `/public/css/style.css`

## Environment Variables

Set in `.env` file (see `.env.example` for template):

| Variable | Default | Notes |
|----------|---------|-------|
| `NODE_ENV` | `development` | Controls dev features (LiveReload, error details) |
| `PORT` | `5000` | HTTP server port |
| `HOST` | `localhost` | Use `0.0.0.0` for LAN access |
| `DATABASE_PATH` | `./data/basix.db` | SQLite file location |
| `LOG_LEVEL` | `info` | `debug` logs all requests, `info` logs errors only |
| `LIVERELOAD_PORT` | `35245` | LiveReload server port |
| `SESSION_SECRET` | `change-this-in-production` | Secret key for session encryption (MUST change in production) |

## LiveReload Configuration

LiveReload only works in development mode and has specific host binding:

- **Localhost mode:** LiveReload binds to `127.0.0.1` (localhost only)
- **LAN mode:** When `HOST=0.0.0.0`, LiveReload binds to `0.0.0.0` (network accessible)

This ensures LiveReload works when accessing the app from other devices on LAN. Configuration is in `src/utils/livereload-util.js`.

**Watches:** `.pug`, `.js`, `.css`, `.html` files in `src/` directory with 50ms delay.

## Authentication System

The project includes a complete authentication system with session management:

### Session Management

Sessions are stored in SQLite using `better-sqlite3-session-store`:
- **Store:** Sessions table in database
- **Secret:** Set via `SESSION_SECRET` env var (defaults to dev value)
- **Cookie settings:** 7-day expiration, httpOnly, secure in production
- **Cleanup:** Expired sessions cleared every 15 minutes

Session middleware is configured in `src/middleware/session.js` and must be added before routes.

### Authentication Middleware

Two middleware functions in `src/middleware/auth.js`:

1. **`requireAuth`** - Protects routes, requires logged-in user
   - Redirects to `/login` for browser requests
   - Returns 401 for HTMX requests

2. **`redirectIfAuthenticated`** - Redirects authenticated users away from login/register
   - Used on login and register pages
   - Redirects to `/dashboard` if already logged in

### Password Security

Password hashing utilities in `src/utils/auth.js`:
- Uses bcrypt with 10 salt rounds
- `hashPassword(password)` - Hashes password for storage
- `comparePassword(password, hash)` - Verifies password against hash

### Auth Routes

Routes defined in `src/routes/auth.js`:
- Login and register forms (Pug templates)
- Form submission handlers
- Session creation on successful auth
- Logout handler (destroys session)

**Usage example:**
```javascript
import { requireAuth } from '../middleware/auth.js';

// Protect a route
router.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', {
    username: req.session.username
  });
});
```

### Auth Views

Three Pug templates in `src/views/`:
- `login.pug` - Email/password login form
- `register.pug` - Username/email/password registration form
- `dashboard.pug` - Example protected page

All extend `base.pug` and use Bootstrap form styling.

## Middleware Chain

**Order is critical:**

1. **LiveReload** (dev only) - Injects client script
2. **Request Logger** - Logs HTTP requests
3. **Session Middleware** - Must come before auth routes
4. **Body Parsers** - JSON and URL-encoded
5. **Static Files** - Serves `/public` directory
6. **Application Routes** - All route handlers (auth middleware applied per-route)
7. **404 Handler** - Catches unmatched routes
8. **Error Handler** - Global error handling (must be last)

All error responses are JSON format. Development mode includes stack traces, production mode hides them.

## Common Development Tasks

### Adding a Protected Route

```javascript
// In src/routes/index.js
import { requireAuth } from '../middleware/auth.js';

router.get('/protected-page', requireAuth, (req, res) => {
  res.render('protected-page', {
    username: req.session.username,
    userId: req.session.userId
  });
});
```

### Adding a New Feature Route

```javascript
// 1. Create src/routes/myfeature.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('myfeature');
});

export default router;

// 2. Mount in src/routes/index.js
import myfeatureRouter from './myfeature.js';
router.use('/myfeature', myfeatureRouter);
```

### Adding a Database Table

```sql
-- Add to data/schema.sql
CREATE TABLE IF NOT EXISTS my_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Restart server to apply (schema runs on init).

### Adding Static Assets

Place files in `/public` directory:
- CSS → `/public/css/`
- Images → `/public/images/`
- JS → `/public/js/`

Accessible at root URL: `/css/style.css`, `/images/logo.png`, etc.

## Key Architectural Decisions

1. **No Build Step:** Uses native ES modules, CDN for frontend libs
2. **SQLite for Everything:** Replaces Redis (cache table) and RabbitMQ (tasks table) for simplicity
3. **JSON API Responses:** All endpoints return JSON, even errors (no error pages)
4. **Environment-Based Features:** Dev mode has LiveReload and debug logging, prod mode strips them
5. **Graceful Shutdown:** 10-second timeout for SIGTERM/SIGINT with database cleanup

## Important Gotchas

- **Middleware order:** LiveReload → logging → session → body parsing → static files → routes → 404 → error handler
- **Session middleware:** Must be added before routes that use `req.session`
- **SESSION_SECRET:** MUST be changed in production (set in `.env`)
- **Static files path:** Must use absolute path `path.join(__dirname, "..", "public")`
- **View path:** Must use absolute path `path.join(__dirname, "views")`
- **LAN access:** Requires `HOST=0.0.0.0` for both main server and LiveReload
- **Database schema:** Runs on every startup, use `IF NOT EXISTS`
- **Import paths:** Always include `.js` extension in ES module imports
- **LiveReload only in dev:** Check `NODE_ENV === "development"` before enabling
- **Password security:** Always use bcrypt utilities, never store plain text passwords

## File Structure Reference

```
src/
├── server.js              # Entry point, middleware chain, server lifecycle
├── routes/
│   ├── index.js          # Route aggregation and mounting
│   ├── auth.js           # Authentication routes (login, register, logout)
│   ├── health.js         # Health check endpoint
│   └── api.js            # Example API endpoints
├── middleware/
│   ├── auth.js           # Authentication middleware (requireAuth, redirectIfAuthenticated)
│   ├── session.js        # Session configuration
│   ├── requestLogger.js  # HTTP request logging
│   └── errorHandler.js   # 404 and error handling
├── db/
│   └── database.js       # SQLite wrapper and utilities
├── utils/
│   ├── auth.js           # Password hashing utilities (bcrypt)
│   └── livereload-util.js # LiveReload configuration
└── views/
    ├── base.pug          # Base layout template
    ├── landing.pug       # Home page
    ├── login.pug         # Login form
    ├── register.pug      # Registration form
    └── dashboard.pug     # Protected dashboard page

data/
├── schema.sql            # Database schema (runs on startup)
└── basix.db             # SQLite database file

public/
└── css/
    └── style.css        # Custom styles
```

## Deployment

Use `deploy.sh` for VPS deployment. Ensure production environment variables are set, especially `NODE_ENV=production`.
