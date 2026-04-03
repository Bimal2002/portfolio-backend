// Centralized error handler to standardize API error responses

module.exports = function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(`[${req.id || 'no-id'}]`, err);

  const status = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Server Error',
  };

  if (err.errors) {
    payload.errors = Array.isArray(err.errors) ? err.errors : [err.errors];
  }

  res.status(status).json(payload);
};
