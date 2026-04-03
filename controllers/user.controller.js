const User = require('../models/User');

// @desc    Get user by username/portfolio URL
// @route   GET /api/users/:username
// @access  Public
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { username: req.params.username },
        { portfolioUrl: req.params.username }
      ]
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Check username availability
// @route   GET /api/users/check/:username
// @access  Public
exports.checkUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    res.status(200).json({
      success: true,
      available: !user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking username'
    });
  }
};
