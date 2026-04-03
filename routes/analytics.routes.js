const express = require('express');
const router = express.Router();
const { logVisit, getSummary, getDetails } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Public logging (rate limited)
router.post('/visit', rateLimit, logVisit);

// Owner summary
router.get('/summary', protect, getSummary);

// Detailed analytics (referrers, etc)
router.get('/details', protect, getDetails);

module.exports = router;
