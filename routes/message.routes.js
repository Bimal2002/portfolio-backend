const express = require('express');
const router = express.Router();
const {
  getAllMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  getUnreadCount,
  getStats,
  addOwnerReply,
  addVisitorReply,
  getMessageByToken
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const captcha = require('../middleware/captcha');

// Public routes (rate limited)
router.post('/user/:userId', rateLimit, captcha, createMessage);
router.get('/thread/:token', getMessageByToken);
router.post('/reply/:token', rateLimit, captcha, addVisitorReply);

// Protected routes
router.get('/', protect, getAllMessages);
router.get('/unread/count', protect, getUnreadCount);
router.get('/stats', protect, getStats);
router.get('/:id', protect, getMessage);
router.post('/:id/reply', protect, addOwnerReply);
router.put('/:id', protect, updateMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
