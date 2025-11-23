/**
 * Simple request logging middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

    if (LOG_LEVEL === 'debug' || logLevel === 'error') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    }
  });

  next();
}
