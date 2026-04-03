const express = require('express');
const router = express.Router();
const {
  getAllExperience,
  getExperienceByUser,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience
} = require('../controllers/experience.controller');
const { protect } = require('../middleware/auth');

router.get('/user/:userId', getExperienceByUser);
router.get('/', protect, getAllExperience);
router.get('/:id', getExperience);
router.post('/', protect, createExperience);
router.put('/:id', protect, updateExperience);
router.delete('/:id', protect, deleteExperience);

module.exports = router;
