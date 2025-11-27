/**
 * Middleware to add session data to response locals
 * Makes user data available to all templates
 */
export function addSessionToLocals(req, res, next) {
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username
  } : null;
  next();
}
