const mongoose = require('mongoose');

const newsletterCampaignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  htmlContent: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft'
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  successfulSends: {
    type: Number,
    default: 0
  },
  failedSends: {
    type: Number,
    default: 0
  },
  openedCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  failureReasons: [{
    email: String,
    error: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('NewsletterCampaign', newsletterCampaignSchema);
