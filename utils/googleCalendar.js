const { google } = require('googleapis');
const CalendarSync = require('../models/CalendarSync');

// Initialize OAuth2 client
const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:5000/api/calendar/callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

// Get authorization URL
exports.getAuthUrl = (userId) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId // Pass user ID in state
  });

  return authUrl;
};

// Exchange code for tokens
exports.getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Get calendar events
exports.getCalendarEvents = async (tokens, calendarId = 'primary', timeMin) => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const events = await calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return events.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Create event in Google Calendar
exports.createCalendarEvent = async (tokens, event, calendarId = 'primary') => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: event.timeZone || 'UTC'
        },
        end: {
          dateTime: event.endTime,
          timeZone: event.timeZone || 'UTC'
        },
        ...(event.location && { location: event.location }),
        ...(event.attendees && { attendees: event.attendees })
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Get free/busy times
exports.getFreeBusyTimes = async (tokens, calendarId = 'primary', timeMin, timeMax) => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: calendarId }]
      }
    });

    return response.data.calendars[calendarId];
  } catch (error) {
    console.error('Error fetching free/busy times:', error);
    throw error;
  }
};

// Check and refresh token if needed
exports.refreshAccessToken = async (userId) => {
  try {
    const sync = await CalendarSync.findOne({ user: userId }).select('+refreshToken');
    
    if (!sync || !sync.refreshToken) {
      return null;
    }

    oauth2Client.setCredentials({
      refresh_token: sync.refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    sync.accessToken = credentials.access_token;
    if (credentials.expiry_date) {
      sync.tokenExpiry = new Date(credentials.expiry_date);
    }
    await sync.save();

    return credentials;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// Sync meetings from portfolio to Google Calendar
exports.syncMeetingsToCalendar = async (userId, meetings) => {
  try {
    const sync = await CalendarSync.findOne({ user: userId }).select('+accessToken');
    
    if (!sync || !sync.isActive) {
      return { success: false, message: 'Calendar not connected' };
    }

    // Refresh token if needed
    if (sync.tokenExpiry && sync.tokenExpiry < new Date()) {
      await exports.refreshAccessToken(userId);
    }

    oauth2Client.setCredentials({ access_token: sync.accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let synced = 0;
    const errors = [];

    for (const meeting of meetings) {
      try {
        const event = await calendar.events.insert({
          calendarId: sync.googleCalendarId,
          requestBody: {
            summary: meeting.title || 'Portfolio Meeting',
            description: meeting.description || `Meeting with ${meeting.visitorName} (${meeting.visitorEmail})`,
            start: {
              dateTime: new Date(meeting.startTime).toISOString(),
              timeZone: meeting.timeZone || 'UTC'
            },
            end: {
              dateTime: new Date(meeting.endTime).toISOString(),
              timeZone: meeting.timeZone || 'UTC'
            },
            attendees: [
              {
                email: meeting.visitorEmail,
                displayName: meeting.visitorName,
                responseStatus: 'needsAction'
              }
            ],
            conferenceData: {
              createRequest: {
                requestId: `${meeting._id}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          },
          conferenceDataVersion: 1,
          sendUpdates: 'all'
        });

        synced++;
      } catch (e) {
        errors.push({ meeting: meeting._id, error: e.message });
      }
    }

    sync.syncedEvents = synced;
    sync.syncedAt = new Date();
    if (errors.length > 0) {
      sync.lastError = `${synced} synced, ${errors.length} failed`;
    }
    await sync.save();

    return { success: true, synced, errors };
  } catch (error) {
    console.error('Error syncing meetings:', error);
    throw error;
  }
};

// Delete event from Google Calendar
exports.deleteCalendarEvent = async (tokens, eventId, calendarId = 'primary') => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId,
      eventId
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Update event in Google Calendar
exports.updateCalendarEvent = async (tokens, eventId, event, calendarId = 'primary') => {
  try {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: event.timeZone || 'UTC'
        },
        end: {
          dateTime: event.endTime,
          timeZone: event.timeZone || 'UTC'
        },
        ...(event.location && { location: event.location }),
        ...(event.attendees && { attendees: event.attendees })
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};
