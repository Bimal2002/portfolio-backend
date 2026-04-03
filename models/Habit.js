const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Health', 'Productivity', 'Learning', 'Social', 'Personal', 'Other'],
    default: 'Personal'
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly'],
    default: 'Daily'
  },
  targetDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  targetCount: {
    type: Number,
    default: 1
  },
  icon: {
    type: String
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDates: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      default: 1
    },
    note: {
      type: String,
      trim: true
    }
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

habitSchema.index({ user: 1, isActive: 1 });
habitSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Habit', habitSchema);
