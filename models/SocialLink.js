const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: [true, 'Platform name is required'],
    trim: true,
    enum: ['LinkedIn', 'GitHub', 'Twitter', 'Facebook', 'Instagram', 'YouTube', 'Medium', 'Dev.to', 'Stack Overflow', 'Portfolio', 'Other']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  username: {
    type: String,
    trim: true
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

socialLinkSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('SocialLink', socialLinkSchema);
