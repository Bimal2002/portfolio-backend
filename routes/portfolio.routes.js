const express = require('express');
const router = express.Router();
const { getPortfolio, updatePortfolio, getMyPortfolio } = require('../controllers/portfolio.controller');
const { protect } = require('../middleware/auth');

router.get('/me', protect, getMyPortfolio);
router.put('/', protect, updatePortfolio);
router.get('/:identifier', getPortfolio);

module.exports = router;
