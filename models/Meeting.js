const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  attendees: [{
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  }],
  meetingType: {
    type: String,
    enum: ['In-person', 'Video Call', 'Phone Call', 'Other'],
    default: 'Video Call'
  },
  location: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: true
    },
    minutesBefore: {
      type: Number,
      default: 15
    }
  },
  isSynced: {
    type: Boolean,
    default: false
  },
  googleEventId: {
    type: String,
    index: true
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  visitorName: String,
  visitorEmail: String
}, {
  timestamps: true
});

meetingSchema.index({ user: 1, startTime: 1 });
meetingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
