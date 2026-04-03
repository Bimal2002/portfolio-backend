const Habit = require('../models/Habit');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./factory.controller');

exports.getAllHabits = getAll(Habit);
exports.getHabit = getOne(Habit);
exports.createHabit = createOne(Habit);
exports.updateHabit = updateOne(Habit);
exports.deleteHabit = deleteOne(Habit);

// @desc    Log habit completion
// @route   POST /api/habits/:id/complete
// @access  Private
exports.logHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    if (habit.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { date, count, note } = req.body;
    const completionDate = date ? new Date(date) : new Date();
    completionDate.setHours(0, 0, 0, 0);

    // Check if already logged for this date
    const existingIndex = habit.completionDates.findIndex(
      completion => {
        const existingDate = new Date(completion.date);
        existingDate.setHours(0, 0, 0, 0);
        return existingDate.getTime() === completionDate.getTime();
      }
    );

    if (existingIndex > -1) {
      // Update existing completion
      habit.completionDates[existingIndex].count = count || habit.completionDates[existingIndex].count;
      habit.completionDates[existingIndex].note = note || habit.completionDates[existingIndex].note;
    } else {
      // Add new completion
      habit.completionDates.push({
        date: completionDate,
        count: count || 1,
        note: note || ''
      });
    }

    // Update streak
    habit.completionDates.sort((a, b) => b.date - a.date);
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let completion of habit.completionDates) {
      const compDate = new Date(completion.date);
      compDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - compDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    habit.streak.current = currentStreak;
    if (currentStreak > habit.streak.longest) {
      habit.streak.longest = currentStreak;
    }

    await habit.save();

    res.status(200).json({
      success: true,
      data: habit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging habit completion',
      error: error.message
    });
  }
};

// @desc    Get habit statistics
// @route   GET /api/habits/:id/stats
// @access  Private
exports.getHabitStats = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    if (habit.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const totalCompletions = habit.completionDates.reduce((sum, c) => sum + c.count, 0);
    const daysTracked = habit.completionDates.length;
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const completionsLast30Days = habit.completionDates.filter(
      c => new Date(c.date) >= thirtyDaysAgo
    ).reduce((sum, c) => sum + c.count, 0);

    res.status(200).json({
      success: true,
      data: {
        habitName: habit.name,
        totalCompletions,
        daysTracked,
        currentStreak: habit.streak.current,
        longestStreak: habit.streak.longest,
        completionsLast30Days,
        startDate: habit.startDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching habit statistics'
    });
  }
};
