const Education = require('../models/Education');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllEducation = getAll(Education);
exports.getEducation = getOne(Education);
exports.createEducation = createOne(Education);
exports.updateEducation = updateOne(Education);
exports.deleteEducation = deleteOne(Education);

// @desc    Get public education by user
// @route   GET /api/education/user/:userId
// @access  Public
exports.getEducationByUser = async (req, res) => {
	try {
		const education = await Education.find({
			user: req.params.userId,
			isVisible: true
		}).sort({ order: 1, startDate: -1, createdAt: -1 });

		res.status(200).json({
			success: true,
			count: education.length,
			data: education
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error fetching education'
		});
	}
};
