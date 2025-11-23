/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Don't leak error details in production
  const response = {
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details,
      }),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.path,
    },
  });
}
