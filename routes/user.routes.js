const express = require('express');
const router = express.Router();
const { getUserByUsername, checkUsername } = require('../controllers/user.controller');

router.get('/check/:username', checkUsername);
router.get('/:username', getUserByUsername);

module.exports = router;
