const express = require('express');
const router = express.Router();
const {
  getAllMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getUpcomingMeetings,
  getMeetingsByRange
} = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth');

router.get('/upcoming', protect, getUpcomingMeetings);
router.get('/range', protect, getMeetingsByRange);
router.get('/', protect, getAllMeetings);
router.get('/:id', protect, getMeeting);
router.post('/', protect, createMeeting);
router.put('/:id', protect, updateMeeting);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
