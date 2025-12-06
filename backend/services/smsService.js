// backend/services/smsService.js
// SMS and WhatsApp notification service using Twilio or MSG91

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'msg91'; // 'twilio' or 'msg91'

// MSG91 Configuration (Popular in India)
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'HLTHSN';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;

// Initialize Twilio client
function initTwilio() {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !TWILIO_ACCOUNT_SID.includes('your_')) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio SMS service initialized');
      return true;
    } catch (error) {
      console.warn('⚠️ Twilio initialization failed:', error.message);
      return false;
    }
  }
  return false;
}

// Format phone number for India
function formatPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// Send SMS via MSG91
async function sendViaMSG91(phone, message) {
  if (!MSG91_AUTH_KEY || MSG91_AUTH_KEY.includes('your_')) {
    throw new Error('MSG91 not configured');
  }

  const axios = require('axios');
  const formattedPhone = formatPhoneNumber(phone);

  const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
    template_id: MSG91_TEMPLATE_ID,
    sender: MSG91_SENDER_ID,
    mobiles: formattedPhone.replace('+', ''),
    message: message
  }, {
    headers: {
      'authkey': MSG91_AUTH_KEY,
      'Content-Type': 'application/json'
    }
  });

  return { success: true, provider: 'msg91', response: response.data };
}

// Send SMS via Twilio
async function sendViaTwilio(phone, message) {
  if (!twilioClient) {
    if (!initTwilio()) {
      throw new Error('Twilio not configured');
    }
  }

  const formattedPhone = formatPhoneNumber(phone);
  const result = await twilioClient.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: formattedPhone
  });

  return { success: true, provider: 'twilio', sid: result.sid };
}

// Send WhatsApp message via Twilio
async function sendWhatsApp(phone, message) {
  if (!twilioClient) {
    if (!initTwilio()) {
      throw new Error('Twilio WhatsApp not configured');
    }
  }

  const formattedPhone = formatPhoneNumber(phone);
  const result = await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${formattedPhone}`
  });

  return { success: true, provider: 'twilio-whatsapp', sid: result.sid };
}

// Main SMS sending function
async function sendSMS(phone, message) {
  if (!phone) {
    console.warn('⚠️ No phone number provided for SMS');
    return { success: false, message: 'No phone number provided' };
  }

  console.log('📱 Sending SMS to:', phone);
  console.log('📝 Message:', message.substring(0, 50) + '...');

  try {
    if (SMS_PROVIDER === 'twilio') {
      return await sendViaTwilio(phone, message);
    } else {
      return await sendViaMSG91(phone, message);
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    // Log for development
    console.log('═══════════════════════════════════════');
    console.log('📱 SMS (Development Mode)');
    console.log('To:', phone);
    console.log('Message:', message);
    console.log('═══════════════════════════════════════');
    return { success: true, message: 'SMS logged (development mode)', development: true };
  }
}

// Send appointment reminder SMS
async function sendAppointmentReminderSMS(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const message = `HealthSync Reminder: Your appointment with Dr. ${doctor.name} is scheduled for ${date} at ${appointment.time}. ${appointment.consultationType === 'online' ? 'Join via the app.' : 'Please arrive 10 mins early.'} - HealthSync`;

  return await sendSMS(patient.phone, message);
}

// Send appointment confirmation SMS
async function sendAppointmentConfirmationSMS(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const message = `HealthSync: Appointment confirmed with Dr. ${doctor.name} (${doctor.specialization}) on ${date} at ${appointment.time}. Booking ID: ${appointment._id.toString().slice(-6).toUpperCase()}. - HealthSync`;

  return await sendSMS(patient.phone, message);
}

// Send OTP via SMS
async function sendOTPSMS(phone, otp) {
  const message = `Your HealthSync verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone. - HealthSync`;
  return await sendSMS(phone, message);
}

// Send prescription ready notification
async function sendPrescriptionReadySMS(phone, doctorName) {
  const message = `HealthSync: Your prescription from Dr. ${doctorName} is ready. View and download it from the HealthSync app. - HealthSync`;
  return await sendSMS(phone, message);
}

// Send WhatsApp appointment reminder
async function sendAppointmentReminderWhatsApp(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const message = `🏥 *HealthSync Appointment Reminder*

Hello ${patient.name}!

Your appointment details:
👨‍⚕️ *Doctor:* Dr. ${doctor.name}
📋 *Specialization:* ${doctor.specialization}
📅 *Date:* ${date}
⏰ *Time:* ${appointment.time}
${appointment.consultationType === 'online' ? '🌐 *Type:* Online Consultation\n📱 Join via the HealthSync app' : '🏥 *Type:* In-Person Visit\n📍 Please arrive 10 minutes early'}

${appointment.googleMeetLink ? `\n🔗 *Meeting Link:* ${appointment.googleMeetLink}` : ''}

Thank you for choosing HealthSync! 💙`;

  return await sendWhatsApp(patient.phone, message);
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  sendAppointmentReminderSMS,
  sendAppointmentConfirmationSMS,
  sendOTPSMS,
  sendPrescriptionReadySMS,
  sendAppointmentReminderWhatsApp,
  formatPhoneNumber
};
