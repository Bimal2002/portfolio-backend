const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: ['Programming Languages', 'Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Soft Skills', 'Other']
  },
  proficiency: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  proficiencyLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  icon: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

skillSchema.index({ user: 1, category: 1, order: 1 });

module.exports = mongoose.model('Skill', skillSchema);
