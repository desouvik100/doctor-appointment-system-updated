

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'msg91'; 
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'HLTHSN';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;
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
async function sendViaMSG91(phone, message) {
  if (!MSG91_AUTH_KEY || MSG91_AUTH_KEY.includes('your_')) {
    throw new Error('MSG91 not configured');
  }

  const axios = require('axios');
  const formattedPhone = formatPhoneNumber(phone);
  const mobileNumber = formattedPhone.replace('+', '');
  console.log('📱 Using MSG91 Simple SMS API for better delivery...');
  
  const response = await axios.get('https://api.msg91.com/api/sendhttp.php', {
    params: {
      authkey: MSG91_AUTH_KEY,
      mobiles: mobileNumber,
      message: message,
      sender: MSG91_SENDER_ID,
      route: '4', 
      country: '91'
    }
  });
  
  console.log('📱 MSG91 Simple API Response:', response.data);
  return { success: true, provider: 'msg91-simple', response: response.data };
}
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
async function sendWhatsApp(phone, message) {
  if (process.env.MSG91_WHATSAPP_AUTH_KEY && !process.env.MSG91_WHATSAPP_AUTH_KEY.includes('your_')) {
    return await sendWhatsAppViaMSG91(phone, message);
  }
  if (!twilioClient) {
    if (!initTwilio()) {
      throw new Error('WhatsApp not configured - add MSG91 or Twilio credentials');
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
async function sendWhatsAppViaMSG91(phone, message) {
  const MSG91_WHATSAPP_AUTH_KEY = process.env.MSG91_WHATSAPP_AUTH_KEY;
  const MSG91_WHATSAPP_NUMBER = process.env.MSG91_WHATSAPP_NUMBER;
  
  if (!MSG91_WHATSAPP_AUTH_KEY) {
    throw new Error('MSG91 WhatsApp not configured');
  }

  const axios = require('axios');
  const formattedPhone = formatPhoneNumber(phone).replace('+', '');

  const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', {
    integrated_number: MSG91_WHATSAPP_NUMBER?.replace('+', ''),
    content_type: 'text',
    payload: {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    }
  }, {
    headers: {
      'authkey': MSG91_WHATSAPP_AUTH_KEY,
      'Content-Type': 'application/json'
    }
  });

  console.log('📱 MSG91 WhatsApp Response:', response.data);
  return { success: true, provider: 'msg91-whatsapp', response: response.data };
}
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
    console.log('═══════════════════════════════════════');
    console.log('📱 SMS (Development Mode)');
    console.log('To:', phone);
    console.log('Message:', message);
    console.log('═══════════════════════════════════════');
    return { success: true, message: 'SMS logged (development mode)', development: true };
  }
}
async function sendAppointmentReminderSMS(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const message = `HealthSync Reminder: Your appointment with Dr. ${doctor.name} is scheduled for ${date} at ${appointment.time}. ${appointment.consultationType === 'online' ? 'Join via the app.' : 'Please arrive 10 mins early.'} - HealthSync`;

  return await sendSMS(patient.phone, message);
}
async function sendAppointmentConfirmationSMS(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const message = `HealthSync: Appointment confirmed with Dr. ${doctor.name} (${doctor.specialization}) on ${date} at ${appointment.time}. Booking ID: ${appointment._id.toString().slice(-6).toUpperCase()}. - HealthSync`;

  return await sendSMS(patient.phone, message);
}
async function sendOTPSMS(phone, otp) {
  const message = `Your HealthSync verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone. - HealthSync`;
  return await sendSMS(phone, message);
}
async function sendPrescriptionReadySMS(phone, doctorName) {
  const message = `HealthSync: Your prescription from Dr. ${doctorName} is ready. View and download it from the HealthSync app. - HealthSync`;
  return await sendSMS(phone, message);
}
async function sendAppointmentReminderWhatsApp(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const message = `🏥 *HealthSync* - Appointment Reminder

Hello ${patient.name}!

Your appointment is scheduled:
👨‍⚕️ *Doctor:* Dr. ${doctor.name}
📋 *Specialty:* ${doctor.specialization}
📅 *Date:* ${date}
⏰ *Time:* ${appointment.time}
🆔 *Booking ID:* ${appointment._id.toString().slice(-6).toUpperCase()}

${appointment.consultationType === 'online' ? '🌐 *Online Consultation*\n📱 Join via HealthSync app 15 mins before' : '🏥 *In-Person Visit*\n📍 Please arrive 10 minutes early'}

${appointment.googleMeetLink ? `\n🔗 *Meeting Link:* ${appointment.googleMeetLink}` : ''}

Need help? Reply to this message.
Reply STOP to opt out.

*HealthSync* - Your Health, Our Priority 💙`;

  return await sendWhatsApp(patient.phone, message);
}
async function sendAppointmentConfirmationWhatsApp(appointment, patient, doctor) {
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const message = `🏥 *HealthSync* - Booking Confirmed ✅

Hello ${patient.name}!

Your appointment has been successfully booked:

👨‍⚕️ *Doctor:* Dr. ${doctor.name}
📋 *Specialty:* ${doctor.specialization}
📅 *Date:* ${date}
⏰ *Time:* ${appointment.time}
🆔 *Booking ID:* ${appointment._id.toString().slice(-6).toUpperCase()}
💰 *Amount:* ₹${appointment.payment?.totalAmount || 'N/A'}

${appointment.consultationType === 'online' ? '🌐 *Online Consultation*\nYou will receive meeting link 15 minutes before appointment' : '🏥 *In-Person Visit*\nPlease arrive 10 minutes early at the clinic'}

📱 Manage your appointment via HealthSync app
🔔 You will receive a reminder before your appointment

Need to reschedule? Reply to this message.

*HealthSync* - Your Health, Our Priority 💙`;

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
  sendAppointmentConfirmationWhatsApp,
  formatPhoneNumber
};
