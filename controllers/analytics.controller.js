const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');

// @desc    Log a portfolio visit (public)
// @route   POST /api/analytics/visit
// @access  Public
exports.logVisit = async (req, res) => {
  try {
    const { username, ownerId } = req.body;
    let owner = ownerId;
    if (!owner && username) {
      const user = await User.findOne({ username });
      owner = user?._id;
    }
    if (!owner) {
      return res.status(400).json({ success: false, message: 'Missing owner identifier' });
    }
    await AnalyticsEvent.create({
      owner,
      type: 'visit',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || req.headers['referrer'] || '',
    });
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging visit' });
  }
};

// @desc    Get daily visit summary for last 30 days (owner only)
// @route   GET /api/analytics/summary
// @access  Private
exports.getSummary = async (req, res) => {
  try {
    const owner = req.user.id;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await AnalyticsEvent.aggregate([
      { $match: { owner: require('mongoose').Types.ObjectId(owner), createdAt: { $gte: since } } },
      { $group: { 
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        visits: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

// @desc    Get detailed analytics (top referrers, devices, etc)
// @route   GET /api/analytics/details
// @access  Private
exports.getDetails = async (req, res) => {
  try {
    const owner = req.user.id;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get top referrers
    const topReferrers = await AnalyticsEvent.aggregate([
      { $match: { owner: require('mongoose').Types.ObjectId(owner), createdAt: { $gte: since } } },
      { $group: { 
        _id: '$referrer',
        count: { $sum: 1 }
      } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get browser stats
    const browserStats = await AnalyticsEvent.aggregate([
      { $match: { owner: require('mongoose').Types.ObjectId(owner), createdAt: { $gte: since } } },
      { $group: { 
        _id: null,
        total: { $sum: 1 }
      } }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        topReferrers: topReferrers.filter(r => r._id).map(r => ({
          referrer: r._id || 'Direct',
          visits: r.count
        })),
        total: browserStats[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching details:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics details' });
  }
};
