const CalendarSync = require('../models/CalendarSync');
const googleCalendar = require('../utils/googleCalendar');

// @desc    Get Google Calendar auth URL
// @route   GET /api/calendar/auth-url
// @access  Private
exports.getAuthUrl = (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthUrl(req.user.id);
    res.status(200).json({ success: true, authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ success: false, message: 'Error getting auth URL' });
  }
};

// @desc    Handle Google Calendar callback
// @route   GET /api/calendar/callback
// @access  Public
exports.handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;

    if (!code || !userId) {
      return res.status(400).json({ success: false, message: 'Missing code or user ID' });
    }

    // Exchange code for tokens
    const tokens = await googleCalendar.getTokens(code);

    // Get calendar ID (usually 'primary')
    const calendarId = 'primary';

    // Save to database
    let sync = await CalendarSync.findOne({ user: userId });
    
    if (sync) {
      sync.accessToken = tokens.access_token;
      sync.refreshToken = tokens.refresh_token || sync.refreshToken;
      sync.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
      sync.isActive = true;
      sync.googleCalendarId = calendarId;
    } else {
      sync = new CalendarSync({
        user: userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarId: calendarId,
        isActive: true
      });
    }

    await sync.save();

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/calendar?status=success`);
  } catch (error) {
    console.error('Error handling callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/calendar?status=error`);
  }
};

// @desc    Get calendar sync status
// @route   GET /api/calendar/sync-status
// @access  Private
exports.getSyncStatus = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id });

    if (!sync) {
      return res.status(200).json({
        success: true,
        data: {
          connected: false,
          isActive: false
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        connected: true,
        isActive: sync.isActive,
        googleCalendarId: sync.googleCalendarId,
        syncedAt: sync.syncedAt,
        syncedEvents: sync.syncedEvents,
        lastError: sync.lastError
      }
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ success: false, message: 'Error getting sync status' });
  }
};

// @desc    Get calendar events
// @route   GET /api/calendar/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    const events = await googleCalendar.getCalendarEvents(
      { access_token: sync.accessToken },
      sync.googleCalendarId,
      req.query.timeMin
    );

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ success: false, message: 'Error fetching calendar events' });
  }
};

// @desc    Create calendar event
// @route   POST /api/calendar/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    const event = await googleCalendar.createCalendarEvent(
      { access_token: sync.accessToken },
      req.body,
      sync.googleCalendarId
    );

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ success: false, message: 'Error creating calendar event' });
  }
};

// @desc    Get free/busy times
// @route   GET /api/calendar/free-busy
// @access  Private
exports.getFreeBusyTimes = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    const freeBusy = await googleCalendar.getFreeBusyTimes(
      { access_token: sync.accessToken },
      sync.googleCalendarId,
      req.query.timeMin,
      req.query.timeMax
    );

    res.status(200).json({ success: true, data: freeBusy });
  } catch (error) {
    console.error('Error getting free/busy times:', error);
    res.status(500).json({ success: false, message: 'Error fetching availability' });
  }
};

// @desc    Disconnect Google Calendar
// @route   DELETE /api/calendar/disconnect
// @access  Private
exports.disconnect = async (req, res) => {
  try {
    await CalendarSync.deleteOne({ user: req.user.id });
    res.status(200).json({ success: true, message: 'Calendar disconnected' });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ success: false, message: 'Error disconnecting calendar' });
  }
};

// @desc    Sync portfolio meetings to Google Calendar
// @route   POST /api/calendar/sync-meetings
// @access  Private
exports.syncMeetings = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    const Meeting = require('../models/Meeting');
    const meetings = await Meeting.find({ 
      user: req.user.id,
      isSynced: { $ne: true }
    }).limit(50);

    const result = await googleCalendar.syncMeetingsToCalendar(req.user.id, meetings);

    if (result.success) {
      // Mark meetings as synced
      await Meeting.updateMany(
        { _id: { $in: meetings.map(m => m._id) } },
        { isSynced: true, googleEventId: new Date().getTime() }
      );
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error syncing meetings:', error);
    res.status(500).json({ success: false, message: 'Error syncing meetings to calendar' });
  }
};

// @desc    Update calendar event
// @route   PUT /api/calendar/events/:eventId
// @access  Private
exports.updateEvent = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    const event = await googleCalendar.updateCalendarEvent(
      { access_token: sync.accessToken },
      req.params.eventId,
      req.body,
      sync.googleCalendarId
    );

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ success: false, message: 'Error updating calendar event' });
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/calendar/events/:eventId
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user.id }).select('+accessToken +refreshToken');

    if (!sync || !sync.isActive) {
      return res.status(400).json({ success: false, message: 'Calendar not connected' });
    }

    // Check and refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await googleCalendar.refreshAccessToken(req.user.id);
    }

    await googleCalendar.deleteCalendarEvent(
      { access_token: sync.accessToken },
      req.params.eventId,
      sync.googleCalendarId
    );

    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ success: false, message: 'Error deleting calendar event' });
  }
};
