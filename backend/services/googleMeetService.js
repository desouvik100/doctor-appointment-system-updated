// backend/services/googleMeetService.js
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

// Initialize OAuth2 client
let oauth2Client = null;

function initializeGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth credentials not configured. Using fallback Jitsi Meet links.');
    return null;
  }

  oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5005/api/google/callback'
  );

  // Set refresh token if available
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  return oauth2Client;
}

/**
 * Generate Google Meet link for appointment
 * @param {Object} appointment - Appointment object with date, time, doctor, patient info
 * @returns {Promise<Object>} - { meetLink, eventId, success }
 */
async function generateGoogleMeetLink(appointment) {
  try {
    // Initialize auth client
    const auth = initializeGoogleAuth();
    
    // Fallback to Jitsi if Google not configured
    if (!auth) {
      return generateFallbackMeetLink(appointment);
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Parse appointment date and time
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // End time (30 minutes after start)
    const endTime = new Date(appointmentDate.getTime() + 30 * 60 * 1000);

    // Create calendar event with Google Meet
    const event = {
      summary: `Medical Consultation - ${appointment.doctorId?.name || 'Doctor'}`,
      description: `Online consultation between Dr. ${appointment.doctorId?.name || 'Doctor'} and ${appointment.userId?.name || 'Patient'}.\n\nReason: ${appointment.reason || 'General consultation'}`,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
      },
      attendees: [
        { email: appointment.userId?.email },
        { email: appointment.doctorId?.email || process.env.EMAIL_USER }
      ],
      conferenceData: {
        createRequest: {
          requestId: `healthsync-${appointment._id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;

    if (!meetLink) {
      console.warn('⚠️ Google Meet link not generated, using fallback');
      return generateFallbackMeetLink(appointment);
    }

    console.log('✅ Google Meet link generated:', meetLink);

    return {
      success: true,
      meetLink,
      eventId: response.data.id,
      provider: 'google'
    };

  } catch (error) {
    console.error('❌ Error generating Google Meet link:', error.message);
    
    // Fallback to Jitsi Meet
    return generateFallbackMeetLink(appointment);
  }
}

/**
 * Generate fallback Jitsi Meet link
 * @param {Object} appointment - Appointment object
 * @returns {Object} - { meetLink, eventId, success }
 */
function generateFallbackMeetLink(appointment) {
  const roomName = `healthsync-${appointment._id}`;
  const meetLink = `https://meet.jit.si/${roomName}`;
  
  console.log('✅ Fallback Jitsi Meet link generated:', meetLink);
  
  return {
    success: true,
    meetLink,
    eventId: null,
    provider: 'jitsi',
    fallback: true
  };
}

/**
 * Delete Google Calendar event
 * @param {String} eventId - Google Calendar event ID
 * @returns {Promise<Boolean>}
 */
async function deleteGoogleMeetEvent(eventId) {
  try {
    if (!eventId) return false;

    const auth = initializeGoogleAuth();
    if (!auth) return false;

    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });

    console.log('✅ Google Calendar event deleted:', eventId);
    return true;

  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error.message);
    return false;
  }
}

/**
 * Update Google Calendar event
 * @param {String} eventId - Google Calendar event ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Boolean>}
 */
async function updateGoogleMeetEvent(eventId, updates) {
  try {
    if (!eventId) return false;

    const auth = initializeGoogleAuth();
    if (!auth) return false;

    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updates,
      sendUpdates: 'all'
    });

    console.log('✅ Google Calendar event updated:', eventId);
    return true;

  } catch (error) {
    console.error('❌ Error updating Google Calendar event:', error.message);
    return false;
  }
}

module.exports = {
  generateGoogleMeetLink,
  generateFallbackMeetLink,
  deleteGoogleMeetEvent,
  updateGoogleMeetEvent
};
