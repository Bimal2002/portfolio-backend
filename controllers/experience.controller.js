const Experience = require('../models/Experience');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllExperience = getAll(Experience);
exports.getExperience = getOne(Experience);
exports.createExperience = createOne(Experience);
exports.updateExperience = updateOne(Experience);
exports.deleteExperience = deleteOne(Experience);

// @desc    Get public experience by user
// @route   GET /api/experience/user/:userId
// @access  Public
exports.getExperienceByUser = async (req, res) => {
	try {
		const experience = await Experience.find({
			user: req.params.userId,
			isVisible: true
		}).sort({ order: 1, startDate: -1, createdAt: -1 });

		res.status(200).json({
			success: true,
			count: experience.length,
			data: experience
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error fetching experience'
		});
	}
};
