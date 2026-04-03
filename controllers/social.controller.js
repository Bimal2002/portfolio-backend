const SocialLink = require('../models/SocialLink');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllSocialLinks = getAll(SocialLink);
exports.getSocialLink = getOne(SocialLink);
exports.createSocialLink = createOne(SocialLink);
exports.updateSocialLink = updateOne(SocialLink);
exports.deleteSocialLink = deleteOne(SocialLink);

// @desc    Get public social links by user
// @route   GET /api/social/user/:userId
// @access  Public
exports.getSocialLinksByUser = async (req, res) => {
	try {
		const links = await SocialLink.find({
			user: req.params.userId,
			isVisible: true
		}).sort({ order: 1, createdAt: -1 });

		res.status(200).json({
			success: true,
			count: links.length,
			data: links
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error fetching social links'
		});
	}
};
