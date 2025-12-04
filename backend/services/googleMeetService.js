// backend/services/googleMeetService.js
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

// Initialize OAuth2 client
let oauth2Client = null;
let isGoogleConfigured = false;

function initializeGoogleAuth() {
  // Check if Google credentials are properly configured (not placeholder values)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const isPlaceholder = (val) => !val || val.includes('your_') || val === '';

  if (isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
    console.warn('⚠️ Google OAuth credentials not configured. Google Meet links will not be generated.');
    console.warn('   Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    isGoogleConfigured = false;
    return null;
  }

  try {
    oauth2Client = new OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5005/api/google/callback'
    );

    // Set refresh token if available
    if (!isPlaceholder(refreshToken)) {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      isGoogleConfigured = true;
      console.log('✅ Google OAuth configured - Google Meet links enabled');
    } else {
      console.warn('⚠️ Google refresh token not configured.');
      console.warn('   Visit http://localhost:5005/api/google/auth-url to authorize');
      isGoogleConfigured = false;
    }

    return oauth2Client;
  } catch (error) {
    console.error('❌ Error initializing Google OAuth:', error.message);
    isGoogleConfigured = false;
    return null;
  }
}

// Initialize on module load
initializeGoogleAuth();

/**
 * Check if Google Meet is configured
 */
function isGoogleMeetConfigured() {
  return isGoogleConfigured;
}

/**
 * Generate Google Meet link for appointment
 * Doctor/Clinic is the organizer (admin of the call)
 * Patient is added as attendee
 * @param {Object} appointment - Appointment object with date, time, doctor, patient info
 * @returns {Promise<Object>} - { meetLink, eventId, success }
 */
async function generateGoogleMeetLink(appointment) {
  try {
    // Re-initialize to check current state
    const auth = initializeGoogleAuth();

    if (!auth || !isGoogleConfigured) {
      console.error('❌ Google Meet not configured. Cannot generate meeting link.');
      return {
        success: false,
        error: 'Google Meet not configured. Please set up Google OAuth credentials.',
        setupUrl: 'http://localhost:5005/api/google/auth-url'
      };
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Parse appointment date and time
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // End time (30 minutes after start for consultation)
    const endTime = new Date(appointmentDate.getTime() + 30 * 60 * 1000);

    // Get doctor and patient info
    const doctorName = appointment.doctorId?.name || 'Doctor';
    const doctorEmail = appointment.doctorId?.email;
    const patientName = appointment.userId?.name || 'Patient';
    const patientEmail = appointment.userId?.email;
    const clinicName = appointment.clinicId?.name || 'HealthSync Clinic';

    console.log('📧 Google Meet - Attendee emails:');
    console.log(`   Doctor: ${doctorName} <${doctorEmail || 'NO EMAIL'}>`);
    console.log(`   Patient: ${patientName} <${patientEmail || 'NO EMAIL'}>`);

    if (!doctorEmail) {
      console.warn('⚠️ WARNING: Doctor has no email - they will NOT receive calendar invite!');
    }

    // Build attendees list
    // Doctor is added FIRST as the primary host/admin of the meeting
    // Patient is added as attendee
    const attendees = [];

    // Add doctor FIRST as the primary host (will have admin controls in Meet)
    if (doctorEmail) {
      attendees.push({
        email: doctorEmail,
        displayName: `Dr. ${doctorName}`,
        responseStatus: 'accepted',
        comment: 'Doctor - Meeting Host',
        organizer: false, // OAuth account is organizer, but doctor is primary attendee
        optional: false
      });
    }

    // Add patient as attendee
    if (patientEmail) {
      attendees.push({
        email: patientEmail,
        displayName: patientName,
        responseStatus: 'needsAction',
        comment: 'Patient',
        optional: false
      });
    }

    // Create calendar event with Google Meet conference
    // Doctor is the HOST of the meeting
    const event = {
      summary: `🏥 Medical Consultation - Dr. ${doctorName} (Host)`,
      description: `
📋 Online Medical Consultation

🎯 MEETING HOST: Dr. ${doctorName}
   Email: ${doctorEmail || 'Not provided'}

👤 Patient: ${patientName}
   Email: ${patientEmail || 'Not provided'}

🏥 Clinic: ${clinicName}
📝 Reason: ${appointment.reason || 'General consultation'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Instructions for Doctor (Host):
• You have full control of the meeting
• You can admit/remove participants
• You can mute/unmute participants
• You can share your screen
• You can record the consultation if needed

📌 Instructions for Patient:
• Join the meeting 5 minutes before scheduled time
• Ensure stable internet connection
• Have your camera and microphone ready
• Keep relevant medical documents handy

🔒 This is a private medical consultation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Powered by HealthSync Pro
      `.trim(),
      location: 'Google Meet (Online)',
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
      },
      attendees: attendees,
      conferenceData: {
        createRequest: {
          requestId: `healthsync-${appointment._id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },    // 1 hour before
          { method: 'email', minutes: 15 },    // 15 minutes before
          { method: 'popup', minutes: 10 }     // 10 minutes before
        ]
      },
      colorId: '9', // Blue color for medical
      visibility: 'private',
      status: 'confirmed'
    };

    console.log('📅 Creating Google Calendar event with Meet...');
    console.log(`   Doctor: ${doctorName} (${doctorEmail || 'no email'})`);
    console.log(`   Patient: ${patientName} (${patientEmail || 'no email'})`);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',  // Send email invites to all attendees
      sendNotifications: true
    });

    // Extract Google Meet link
    const meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;

    // Get dial-in info if available
    const dialIn = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'phone'
    );

    if (!meetLink) {
      console.error('❌ Google Meet link not found in response');
      return {
        success: false,
        error: 'Failed to generate Google Meet link. Please try again.'
      };
    }

    console.log('✅ Google Meet link generated successfully!');
    console.log(`   Meet Link: ${meetLink}`);
    console.log(`   Event ID: ${response.data.id}`);
    console.log(`   Calendar invites sent to attendees`);

    return {
      success: true,
      meetLink,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      provider: 'google-meet',
      dialIn: dialIn ? {
        phone: dialIn.uri,
        pin: dialIn.pin
      } : null,
      attendees: {
        doctor: doctorEmail,
        patient: patientEmail
      }
    };

  } catch (error) {
    console.error('❌ Error generating Google Meet link:', error.message);

    // Provide helpful error messages
    if (error.message.includes('invalid_grant')) {
      console.error('   Token expired. Please re-authorize at /api/google/auth-url');
    } else if (error.message.includes('insufficient')) {
      console.error('   Insufficient permissions. Ensure Calendar API is enabled.');
    }

    return {
      success: false,
      error: error.message,
      setupUrl: 'http://localhost:5005/api/google/auth-url'
    };
  }
}

/**
 * Delete Google Calendar event and associated Meet
 * @param {String} eventId - Google Calendar event ID
 * @returns {Promise<Object>}
 */
async function deleteGoogleMeetEvent(eventId) {
  try {
    if (!eventId) {
      return { success: false, error: 'No event ID provided' };
    }

    const auth = initializeGoogleAuth();
    if (!auth || !isGoogleConfigured) {
      return { success: false, error: 'Google not configured' };
    }

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'  // Notify attendees of cancellation
    });

    console.log('✅ Google Calendar event deleted:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update Google Calendar event
 * @param {String} eventId - Google Calendar event ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>}
 */
async function updateGoogleMeetEvent(eventId, updates) {
  try {
    if (!eventId) {
      return { success: false, error: 'No event ID provided' };
    }

    const auth = initializeGoogleAuth();
    if (!auth || !isGoogleConfigured) {
      return { success: false, error: 'Google not configured' };
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updates,
      sendUpdates: 'all'
    });

    console.log('✅ Google Calendar event updated:', eventId);
    return { success: true, event: response.data };

  } catch (error) {
    console.error('❌ Error updating Google Calendar event:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get Google configuration status
 */
function getGoogleStatus() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const isPlaceholder = (val) => !val || val.includes('your_') || val === '';

  return {
    clientIdConfigured: !isPlaceholder(clientId),
    clientSecretConfigured: !isPlaceholder(clientSecret),
    refreshTokenConfigured: !isPlaceholder(refreshToken),
    fullyConfigured: isGoogleConfigured,
    provider: 'google-meet'
  };
}

module.exports = {
  generateGoogleMeetLink,
  deleteGoogleMeetEvent,
  updateGoogleMeetEvent,
  isGoogleMeetConfigured,
  getGoogleStatus
};
