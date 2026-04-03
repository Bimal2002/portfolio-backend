const express = require('express');
const router = express.Router();
const {
  getAllSocialLinks,
  getSocialLinksByUser,
  getSocialLink,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink
} = require('../controllers/social.controller');
const { protect } = require('../middleware/auth');

router.get('/user/:userId', getSocialLinksByUser);
router.get('/', protect, getAllSocialLinks);
router.get('/:id', getSocialLink);
router.post('/', protect, createSocialLink);
router.put('/:id', protect, updateSocialLink);
router.delete('/:id', protect, deleteSocialLink);

module.exports = router;
