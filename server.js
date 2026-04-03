const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Validate required environment variables early
try {
  require('./config/validateEnv').validate();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Environment configuration error:', e.message);
  process.exit(1);
}

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
// Lightweight request id + logging
app.use(require('./middleware/requestId'));
// Log only errors in development, standard in production
if (process.env.LOG_LEVEL !== 'silent') {
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'short';
  app.use(morgan(morganFormat));
}
// Basic rate limiting (in-memory)
app.use(require('./middleware/rateLimit'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Health and readiness first for probes
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.get('/readyz', (req, res) => {
  const ready = mongoose.connection.readyState === 1; // 1 = connected
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready' });
});

// API Docs (Swagger)
const { serve: swaggerServe, setup: swaggerSetup } = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
app.use('/api/docs', swaggerServe, swaggerSetup(swaggerSpec));

// SEO endpoints
app.use('/', require('./routes/seo.routes'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/portfolio', require('./routes/portfolio.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/education', require('./routes/education.routes'));
app.use('/api/experience', require('./routes/experience.routes'));
app.use('/api/skills', require('./routes/skill.routes'));
app.use('/api/social', require('./routes/social.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/meetings', require('./routes/meeting.routes'));
app.use('/api/habits', require('./routes/habit.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/newsletter', require('./routes/newsletter.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/calendar', require('./routes/calendar.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

// In production, serve the frontend build and enable SPA fallback
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(clientBuildPath));

  // SPA fallback: send index.html for non-API routes
  app.get('*', (req, res, next) => {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api') || url.startsWith('/uploads')) return next();
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
