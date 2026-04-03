const express = require('express');
const router = express.Router();
const {
  getProjectsByUser,
  getMyProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth');

router.get('/user/:userId', getProjectsByUser);
router.get('/my', protect, getMyProjects);
router.get('/:id', getProject);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
