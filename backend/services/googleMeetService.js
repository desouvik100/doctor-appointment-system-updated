
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
let oauth2Client = null;
let isGoogleConfigured = false;

function initializeGoogleAuth() {
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
initializeGoogleAuth();

function isGoogleMeetConfigured() {
  return isGoogleConfigured;
}

async function generateGoogleMeetLink(appointment) {
  try {
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
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = (appointment.time || '10:00').split(':');
    const istDateStr = appointmentDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); 
    const [year, month, day] = istDateStr.split('-');
    
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const startDateTime = `${year}-${month}-${day}T${timeStr}`;
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
    const attendees = [];
    if (doctorEmail) {
      attendees.push({
        email: doctorEmail,
       displayName: `Dr. ${doctorName}`,
        responseStatus: 'accepted',
        comment: 'Doctor - Consultation Host',
        optional: false 
      });
    }
    if (patientEmail) {
      attendees.push({
        email: patientEmail,
        displayName: patientName,
        responseStatus: 'needsAction',
        comment: 'Patient',
        optional: false
      });
    }
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
          { method: 'email', minutes: 60 },    
          { method: 'email', minutes: 15 },    
          { method: 'popup', minutes: 10 }     
        ] 
      },
      colorId: '9', 
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
      sendUpdates: 'all',  
      sendNotifications: true
    });
    let meetLink = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'video'
    )?.uri;
    if (meetLink) {
      console.log('   Original Meet Link:', meetLink);
    }
    const dialIn = response.data.conferenceData?.entryPoints?.find(
      ep => ep.entryPointType === 'phone'
    );

    if (!meetLink) {
     console.error('❌ Google Meet link not found in response - falling back to Jitsi');
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
    if (error.message.includes('invalid_grant')) {
      console.error('   Token expired. Please re-authorize at /api/google/auth-url');
    } else if (error.message.includes('insufficient')) {
      console.error('   Insufficient permissions. Ensure Calendar API is enabled.');
    }
    console.log('⚠️ Falling back to Jitsi Meet...');
    const jitsiResult = generateJitsiMeetLink(appointment);
    console.log(`✅ Jitsi Meet link generated as fallback: ${jitsiResult.meetLink}`);
    return jitsiResult;
  }
}

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
      sendUpdates: 'all'  
    });

    console.log('✅ Google Calendar event deleted:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error.message);
    return { success: false, error: error.message };
  }
}

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

function generateJitsiMeetLink(appointment) {
  const appointmentId = appointment._id || Date.now();
  const roomName = `HealthSync-Consultation-${appointmentId}`;
  const doctorName = appointment.doctorId?.name || 'Doctor';
  const patientName = appointment.userId?.name || 'Patient';
  const baseUrl = `https://meet.jit.si/${roomName}`;
  const doctorConfig = {
    'userInfo.displayName': `Dr. ${doctorName} (Host)`,
    'config.startWithAudioMuted': false,
    'config.startWithVideoMuted': false,
    'config.prejoinPageEnabled': false,
    'config.disableModeratorIndicator': false,
    'config.enableLobby': true,  
    'config.lobbyModeEnabled': true
  };
  const patientConfig = {
    'userInfo.displayName': patientName,
    'config.startWithAudioMuted': true,
    'config.startWithVideoMuted': false,
    'config.prejoinPageEnabled': true
  };
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
    meetLink: baseUrl,  
    doctorLink,         
    patientLink,        
    provider: 'jitsi',
    roomName,
    note: 'Jitsi Meet - Doctor is the host with moderator controls'
  }; 
}

async function generateMeetingLink(appointment, preferredProvider = 'google') {
  if (preferredProvider === 'jitsi') {
    return generateJitsiMeetLink(appointment);
  }
  const googleResult = await generateGoogleMeetLink(appointment);
  
  if (googleResult.success) {
    return googleResult;
  }
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
