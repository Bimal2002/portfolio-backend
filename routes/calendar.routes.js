const express = require('express');
const router = express.Router();
const { 
  getAuthUrl, 
  handleCallback, 
  getSyncStatus, 
  getEvents, 
  createEvent, 
  getFreeBusyTimes,
  disconnect,
  syncMeetings,
  updateEvent,
  deleteEvent
} = require('../controllers/calendar.controller');
const { protect } = require('../middleware/auth');

// Public callback route
router.get('/callback', handleCallback);

// Private routes
router.get('/auth-url', protect, getAuthUrl);
router.get('/sync-status', protect, getSyncStatus);
router.get('/events', protect, getEvents);
router.post('/events', protect, createEvent);
router.put('/events/:eventId', protect, updateEvent);
router.delete('/events/:eventId', protect, deleteEvent);
router.get('/free-busy', protect, getFreeBusyTimes);
router.post('/sync-meetings', protect, syncMeetings);
router.delete('/disconnect', protect, disconnect);

module.exports = router;
