const Portfolio = require('../models/Portfolio');

// @desc    Get portfolio by user ID or username
// @route   GET /api/portfolio/:identifier
// @access  Public
exports.getPortfolio = async (req, res) => {
  try {
    const User = require('../models/User');
    let portfolio;

    // Check if identifier is a valid ObjectId
    if (req.params.identifier.match(/^[0-9a-fA-F]{24}$/)) {
      portfolio = await Portfolio.findOne({ user: req.params.identifier }).populate('user', '-password');
    } else {
      // Find by username
      const user = await User.findOne({
        $or: [
          { username: req.params.identifier },
          { portfolioUrl: req.params.identifier }
        ]
      });
      
      if (user) {
        portfolio = await Portfolio.findOne({ user: user._id }).populate('user', '-password');
      }
    }

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio'
    });
  }
};

// @desc    Update portfolio
// @route   PUT /api/portfolio
// @access  Private
exports.updatePortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio'
    });
  }
};

// @desc    Get my portfolio
// @route   GET /api/portfolio/me
// @access  Private
exports.getMyPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio'
    });
  }
};
