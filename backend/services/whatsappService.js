

const axios = require('axios');
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

const isWhatsAppConfigured = () => {
  return !!(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN);
};

const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
};

const sendTextMessage = async (to, message) => {
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp message sent to ${formattedPhone}`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('❌ WhatsApp send error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

const sendTemplateMessage = async (to, templateName, languageCode = 'en', components = []) => {
  if (!isWhatsAppConfigured()) {
    console.log('⚠️ WhatsApp not configured, skipping template message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    if (components.length > 0) {
      payload.template.components = components;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp template message sent to ${formattedPhone}`);
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('❌ WhatsApp template error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

const sendAppointmentConfirmation = async (phone, appointmentDetails) => {
  const { patientName, doctorName, date, time, clinicName, appointmentId } = appointmentDetails;
  
  const message = `🏥 *HealthSync - Appointment Confirmed*

Hello ${patientName}! 👋

Your appointment has been successfully booked.

📋 *Appointment Details:*
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
🏨 Clinic: ${clinicName}
🔖 Booking ID: ${appointmentId}

Please arrive 15 minutes before your scheduled time.

To reschedule or cancel, visit the HealthSync app.

Thank you for choosing HealthSync! 💚`;

  return sendTextMessage(phone, message);
};

const sendAppointmentReminder = async (phone, appointmentDetails) => {
  const { patientName, doctorName, date, time, clinicName, hoursUntil } = appointmentDetails;
  
  const message = `⏰ *HealthSync - Appointment Reminder*

Hello ${patientName}! 👋

This is a reminder for your upcoming appointment in *${hoursUntil} hours*.

📋 *Appointment Details:*
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
🏨 Clinic: ${clinicName}

Please arrive 15 minutes early and bring any relevant medical documents.

See you soon! 💚`;

  return sendTextMessage(phone, message);
};

const sendAppointmentCancellation = async (phone, appointmentDetails) => {
  const { patientName, doctorName, date, time, reason } = appointmentDetails;
  
  const message = `❌ *HealthSync - Appointment Cancelled*

Hello ${patientName},

Your appointment has been cancelled.

📋 *Cancelled Appointment:*
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
${reason ? `📝 Reason: ${reason}` : ''}

You can book a new appointment anytime through the HealthSync app.

We apologize for any inconvenience. 🙏`;

  return sendTextMessage(phone, message);
};

const sendPrescriptionReady = async (phone, details) => {
  const { patientName, doctorName, prescriptionId } = details;
  
  const message = `💊 *HealthSync - Prescription Ready*

Hello ${patientName}! 👋

Your prescription from Dr. ${doctorName} is now ready.

📋 Prescription ID: ${prescriptionId}

You can view and download your prescription from the HealthSync app.

Get well soon! 💚`;

  return sendTextMessage(phone, message);
};

const sendOTP = async (phone, otp) => {
  const message = `🔐 *HealthSync Verification*

Your OTP is: *${otp}*

This code expires in 10 minutes.

Do not share this code with anyone.`;

  return sendTextMessage(phone, message);
};

const sendPaymentConfirmation = async (phone, paymentDetails) => {
  const { patientName, amount, transactionId, appointmentDate, doctorName } = paymentDetails;
  
  const message = `✅ *HealthSync - Payment Successful*

Hello ${patientName}! 👋

Your payment has been received successfully.

💰 *Payment Details:*
Amount: ₹${amount}
Transaction ID: ${transactionId}
For: Appointment with Dr. ${doctorName}
Date: ${appointmentDate}

Thank you for your payment! 💚`;

  return sendTextMessage(phone, message);
};

const sendMeetLink = async (phone, meetDetails) => {
  const { patientName, doctorName, date, time, meetLink } = meetDetails;
  
  const message = `🎥 *HealthSync - Online Consultation Link*

Hello ${patientName}! 👋

Your online consultation is scheduled.

📋 *Consultation Details:*
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}

🔗 *Join Meeting:*
${meetLink}

Please join 5 minutes before the scheduled time.

See you online! 💚`;

  return sendTextMessage(phone, message);
};

module.exports = {
  isWhatsAppConfigured,
  formatPhoneNumber,
  sendTextMessage,
  sendTemplateMessage,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendPrescriptionReady,
  sendOTP,
  sendPaymentConfirmation,
  sendMeetLink
};
