const mongoose = require('mongoose');

const calendarSyncSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  googleCalendarId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true,
    select: false // Don't return by default
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  syncedAt: Date,
  syncedEvents: {
    type: Number,
    default: 0
  },
  lastError: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
calendarSyncSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CalendarSync', calendarSyncSchema);
