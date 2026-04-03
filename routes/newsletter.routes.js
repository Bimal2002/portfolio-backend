const express = require('express');
const router = express.Router();
const { 
  subscribe, 
  confirmSubscription,
  unsubscribe,
  listSubscribers,
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  deleteCampaign,
  getNewsletterStats,
  sendDirectEmail,
  trackOpen,
  trackClick
} = require('../controllers/newsletter.controller');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Public routes
router.post('/subscribe', rateLimit, subscribe);
router.get('/confirm/:token', confirmSubscription);
router.get('/unsubscribe/:token', unsubscribe);
router.get('/open/:campaignId.png', trackOpen);
router.get('/click/:campaignId', trackClick);

// Private routes
router.get('/subscribers', protect, listSubscribers);
router.get('/stats', protect, getNewsletterStats);
router.get('/campaigns', protect, getAllCampaigns);
router.get('/campaigns/:id', protect, getCampaign);
router.post('/campaigns', protect, createCampaign);
router.put('/campaigns/:id', protect, updateCampaign);
router.post('/campaigns/:id/send', protect, sendCampaign);
router.delete('/campaigns/:id', protect, deleteCampaign);
router.post('/send-direct', protect, sendDirectEmail);

module.exports = router;
