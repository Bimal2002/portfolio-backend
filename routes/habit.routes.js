const express = require('express');
const router = express.Router();
const {
  getAllHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabitCompletion,
  getHabitStats
} = require('../controllers/habit.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllHabits);
router.get('/:id', protect, getHabit);
router.get('/:id/stats', protect, getHabitStats);
router.post('/', protect, createHabit);
router.post('/:id/complete', protect, logHabitCompletion);
router.put('/:id', protect, updateHabit);
router.delete('/:id', protect, deleteHabit);

module.exports = router;
