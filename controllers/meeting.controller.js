const Meeting = require('../models/Meeting');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllMeetings = getAll(Meeting);
exports.getMeeting = getOne(Meeting);
exports.createMeeting = createOne(Meeting);
exports.updateMeeting = updateOne(Meeting);
exports.deleteMeeting = deleteOne(Meeting);

// @desc    Get upcoming meetings
// @route   GET /api/meetings/upcoming
// @access  Private
exports.getUpcomingMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      user: req.user.id,
      startTime: { $gte: new Date() },
      status: 'Scheduled'
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming meetings'
    });
  }
};

// @desc    Get meetings by date range
// @route   GET /api/meetings/range
// @access  Private
exports.getMeetingsByRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const meetings = await Meeting.find({
      user: req.user.id,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings'
    });
  }
};
