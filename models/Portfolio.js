const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Info
  tagline: {
    type: String,
    trim: true,
    maxlength: 200
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  location: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String
  },
  
  // Customization
  theme: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    textColor: {
      type: String,
      default: '#1F2937'
    },
    layout: {
      type: String,
      enum: ['modern', 'classic', 'minimal', 'creative'],
      default: 'modern'
    }
  },
  
  // Section Visibility
  sections: {
    about: { type: Boolean, default: true },
    education: { type: Boolean, default: true },
    experience: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    social: { type: Boolean, default: true },
    contact: { type: Boolean, default: true }
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  isPublished: {
    type: Boolean,
    default: true
  },
  // Messaging Auto-Responder
  autoresponderEnabled: { type: Boolean, default: false },
  autoresponderMessage: { type: String, maxlength: 2000 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
