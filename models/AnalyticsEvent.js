const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['visit'], default: 'visit' },
  userAgent: { type: String },
  referrer: { type: String },
}, { timestamps: true });

analyticsEventSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
