const mongoose = require('mongoose');

// Reply schema for conversation thread
const replySchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['visitor', 'owner'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  attachments: [
    {
      url: { type: String, required: true },
      name: { type: String },
      type: { type: String },
      size: { type: Number }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema({
  portfolioOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  senderEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  attachments: [
    {
      url: { type: String, required: true },
      name: { type: String },
      type: { type: String },
      size: { type: Number }
    }
  ],
  // Conversation thread - array of replies
  replies: [replySchema],
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  // Token for visitor to reply without authentication
  replyToken: {
    type: String,
    unique: true,
    sparse: true
  },
  lastReplyAt: {
    type: Date
  },
  // Attribution
  utmSource: { type: String },
  utmMedium: { type: String },
  utmCampaign: { type: String },
  referrer: { type: String }
}, {
  timestamps: true
});

messageSchema.index({ portfolioOwner: 1, createdAt: -1 });
messageSchema.index({ portfolioOwner: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
