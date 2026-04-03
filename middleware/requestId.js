const { randomUUID } = require('crypto');

module.exports = function requestId(req, res, next) {
  const headerId = req.headers['x-request-id'];
  const id = typeof headerId === 'string' && headerId.trim() ? headerId : randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};
