const express = require('express');
const router = express.Router();
const {
  getAllEducation,
  getEducationByUser,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation
} = require('../controllers/education.controller');
const { protect } = require('../middleware/auth');

router.get('/user/:userId', getEducationByUser);
router.get('/', protect, getAllEducation);
router.get('/:id', getEducation);
router.post('/', protect, createEducation);
router.put('/:id', protect, updateEducation);
router.delete('/:id', protect, deleteEducation);

module.exports = router;
