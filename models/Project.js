const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  longDescription: {
    type: String,
    trim: true
  },
  technologies: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    caption: String
  }],
  documents: [{
    url: String,
    name: String
  }],
  thumbnail: {
    type: String
  },
  demoUrl: {
    type: String
  },
  githubUrl: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isOngoing: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
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

// Index for querying user's projects
projectSchema.index({ user: 1, order: 1 });

module.exports = mongoose.model('Project', projectSchema);
