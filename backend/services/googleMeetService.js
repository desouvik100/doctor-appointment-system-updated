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

    // Parse appointment date and time with proper timezone handling
    // The appointment.date is stored as a Date object, we need to extract the date part correctly
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = (appointment.time || '10:00').split(':');
    
    // IMPORTANT: Extract date components in IST timezone to avoid UTC conversion issues
    // Use toLocaleDateString to get the correct date in IST
    const istDateStr = appointmentDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Returns YYYY-MM-DD format
    const [year, month, day] = istDateStr.split('-');
    
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    // Format: YYYY-MM-DDTHH:MM:SS (local time, timezone specified separately)
    const startDateTime = `${year}-${month}-${day}T${timeStr}`;
    
    // Calculate end time (30 minutes after start)
    const startHour = parseInt(hours);
    const startMinute = parseInt(minutes);
    let endHour = startHour;
    let endMinute = startMinute + 30;
    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }
    if (endHour >= 24) {
      endHour = 23;
      endMinute = 59;
    }
    const endTimeStr = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;
    
    console.log(`📅 Appointment Details:`);
    console.log(`   Original Date: ${appointment.date}`);
    console.log(`   IST Date: ${istDateStr}`);
    console.log(`   Selected Time: ${appointment.time}`);
    console.log(`   Calendar Start: ${startDateTime} (Asia/Kolkata)`);
    console.log(`   Calendar End: ${endTimeStr} (Asia/Kolkata)`);

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
    // Doctor is added as attendee (they will be co-host in the meeting)
    // Patient is added as attendee
    const attendees = [];

    // Add doctor as attendee
    if (doctorEmail) {
      attendees.push({
        email: doctorEmail,
        displayName: `Dr. ${doctorName}`,
        responseStatus: 'accepted',
        comment: 'Doctor - Consultation Host',
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
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTimeStr,
        timeZone: 'Asia/Kolkata',
      },
      attendees: attendees,
      conferenceData: {
        createRequest: {
          requestId: `healthsync-${appointment._id}-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        },
        // Conference settings - allow participants to join without host
        conferenceSolution: {
          key: {
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
    let meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;

    // Add authuser parameter to help with account selection
    // This helps when users have multiple Google accounts
    if (meetLink) {
      // The meet link format: https://meet.google.com/xxx-xxxx-xxx
      // We keep it clean for universal access
      console.log('   Original Meet Link:', meetLink);
    }

    // Get dial-in info if available
    const dialIn = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'phone'
    );

    if (!meetLink) {
      console.error('❌ Google Meet link not found in response - falling back to Jitsi');
      // Fall back to Jitsi Meet when Google Meet fails
      const jitsiResult = generateJitsiMeetLink(appointment);
      console.log(`✅ Jitsi Meet link generated as fallback: ${jitsiResult.meetLink}`);
      return jitsiResult;
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

    // Fall back to Jitsi Meet when Google Meet fails
    console.log('⚠️ Falling back to Jitsi Meet...');
    const jitsiResult = generateJitsiMeetLink(appointment);
    console.log(`✅ Jitsi Meet link generated as fallback: ${jitsiResult.meetLink}`);
    return jitsiResult;
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

// Module exports moved to end of file after all functions are defined


/**
 * IMPORTANT: Google Meet Host Settings
 * 
 * The "Please wait until a meeting host brings you into the call" message appears because:
 * 1. Google Meet's "Quick Access" is OFF in Google Workspace settings
 * 2. The meeting organizer (OAuth account) hasn't joined yet
 * 
 * SOLUTIONS:
 * 
 * Option 1: Enable Quick Access (Recommended for personal Google accounts)
 * - Go to meet.google.com
 * - Click Settings (gear icon)
 * - Under "Host controls", enable "Quick access"
 * - This allows anyone with the link to join without waiting
 * 
 * Option 2: For Google Workspace accounts
 * - Admin must enable "Quick access" in Admin Console
 * - Go to: admin.google.com > Apps > Google Workspace > Google Meet
 * - Enable "Let people outside your organization join meetings"
 * 
 * Option 3: Doctor joins first (Current workaround)
 * - Doctor clicks "Start Meeting" which opens the Meet link
 * - Once doctor joins, patients can enter
 * 
 * Option 4: Use a different video solution
 * - Jitsi Meet (free, no host required)
 * - Daily.co
 * - Twilio Video
 */

/**
 * Generate a Jitsi Meet link with Doctor as Host/Moderator
 * @param {Object} appointment - Appointment details
 * @returns {Object} - Meeting link info with separate doctor (host) and patient links
 */
function generateJitsiMeetLink(appointment) {
  const appointmentId = appointment._id || Date.now();
  const roomName = `HealthSync-Consultation-${appointmentId}`;
  
  // Get doctor and patient info
  const doctorName = appointment.doctorId?.name || 'Doctor';
  const patientName = appointment.userId?.name || 'Patient';
  
  // Base Jitsi URL
  const baseUrl = `https://meet.jit.si/${roomName}`;
  
  // Doctor link - with moderator settings
  // Using URL config to set doctor as moderator with lobby enabled
  const doctorConfig = {
    'userInfo.displayName': `Dr. ${doctorName} (Host)`,
    'config.startWithAudioMuted': false,
    'config.startWithVideoMuted': false,
    'config.prejoinPageEnabled': false,
    'config.disableModeratorIndicator': false,
    'config.enableLobby': true,  // Enable lobby so doctor can admit patients
    'config.lobbyModeEnabled': true
  };
  
  // Patient link - as guest
  const patientConfig = {
    'userInfo.displayName': patientName,
    'config.startWithAudioMuted': true,
    'config.startWithVideoMuted': false,
    'config.prejoinPageEnabled': true
  };
  
  // Build URL with config
  const doctorParams = Object.entries(doctorConfig)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  const patientParams = Object.entries(patientConfig)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  const doctorLink = `${baseUrl}#${doctorParams}`;
  const patientLink = `${baseUrl}#${patientParams}`;
  
  console.log('🎥 Jitsi Meet links generated:');
  console.log(`   Room: ${roomName}`);
  console.log(`   Doctor (Host): Dr. ${doctorName}`);
  console.log(`   Patient: ${patientName}`);
  
  return {
    success: true,
    meetLink: baseUrl,  // Generic link (works for both)
    doctorLink,         // Doctor joins as host
    patientLink,        // Patient joins as guest
    provider: 'jitsi',
    roomName,
    note: 'Jitsi Meet - Doctor is the host with moderator controls'
  };
}

/**
 * Generate meeting link with fallback options
 * Tries Google Meet first, falls back to Jitsi if Google fails
 */
async function generateMeetingLink(appointment, preferredProvider = 'google') {
  if (preferredProvider === 'jitsi') {
    return generateJitsiMeetLink(appointment);
  }

  // Try Google Meet first
  const googleResult = await generateGoogleMeetLink(appointment);
  
  if (googleResult.success) {
    return googleResult;
  }

  // Fallback to Jitsi if Google fails
  console.log('⚠️ Google Meet failed, falling back to Jitsi Meet');
  return generateJitsiMeetLink(appointment);
}

module.exports = {
  generateGoogleMeetLink,
  deleteGoogleMeetEvent,
  updateGoogleMeetEvent,
  isGoogleMeetConfigured,
  getGoogleStatus,
  generateJitsiMeetLink,
  generateMeetingLink
};
