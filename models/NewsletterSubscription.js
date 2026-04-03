const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  status: { type: String, enum: ['pending', 'active', 'unsubscribed'], default: 'active' },
  confirmToken: { type: String },
  unsubscribeToken: { type: String },
  unsubscribedAt: { type: Date },
  source: { type: String, default: 'form' },
  tags: [{ type: String }]
}, { timestamps: true });

newsletterSchema.index({ owner: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('NewsletterSubscription', newsletterSchema);
