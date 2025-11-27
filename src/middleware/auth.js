export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    // For HTMX requests, return 401
    if (req.headers['hx-request']) {
      return res.status(401).send('Unauthorized');
    }
    // For regular requests, redirect to login
    return res.redirect('/login');
  }
  next();
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
}
