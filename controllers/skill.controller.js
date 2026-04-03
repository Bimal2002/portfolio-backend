const Skill = require('../models/Skill');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllSkills = getAll(Skill);
exports.getSkill = getOne(Skill);
exports.createSkill = createOne(Skill);
exports.updateSkill = updateOne(Skill);
exports.deleteSkill = deleteOne(Skill);

// @desc    Get public skills by user
// @route   GET /api/skills/user/:userId
// @access  Public
exports.getSkillsByUser = async (req, res) => {
  try {
    const skills = await Skill.find({
      user: req.params.userId,
      isVisible: true
    }).sort({ category: 1, order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching skills'
    });
  }
};

// Get skills grouped by category
exports.getSkillsByCategory = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const query = req.query.userId ? { user: userId, isVisible: true } : { user: userId };
    
    const skills = await Skill.find(query).sort({ category: 1, order: 1 });

    // Group by category
    const groupedSkills = skills.reduce((acc, skill) => {
      const category = skill.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: groupedSkills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching skills'
    });
  }
};
