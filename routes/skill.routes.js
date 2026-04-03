const express = require('express');
const router = express.Router();
const {
  getAllSkills,
  getSkillsByUser,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  getSkillsByCategory
} = require('../controllers/skill.controller');
const { protect } = require('../middleware/auth');

router.get('/grouped', protect, getSkillsByCategory);
router.get('/user/:userId', getSkillsByUser);
router.get('/', protect, getAllSkills);
router.get('/:id', getSkill);
router.post('/', protect, createSkill);
router.put('/:id', protect, updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
