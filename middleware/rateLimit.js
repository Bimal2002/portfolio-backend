// Rate limiting: configurable via env, sensible defaults
const isDev = process.env.NODE_ENV === 'development';
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW || (isDev ? '1000' : '60000'), 10); // Window in ms
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || (isDev ? '100' : '100'), 10); // Requests per window

const buckets = new Map();

function cleanupOld(now) {
  for (const [ip, info] of buckets) {
    if (now - info.start > WINDOW_MS) {
      buckets.delete(ip);
    }
  }
}

module.exports = function rateLimit(req, res, next) {
  // Skip localhost in development
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (isDev && (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost')) {
    return next();
  }

  const now = Date.now();
  cleanupOld(now);
  const info = buckets.get(ip);
  if (!info) {
    buckets.set(ip, { start: now, count: 1 });
    return next();
  }
  if (now - info.start > WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return next();
  }
  if (info.count >= MAX_REQUESTS) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }
  info.count += 1;
  buckets.set(ip, info);
  next();
}
