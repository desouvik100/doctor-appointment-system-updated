/**
 * WhatsApp Integration Service
 * Supports multiple providers: WhatsApp Business API, Twilio, or direct wa.me links
 * 
 * For production, configure one of:
 * 1. WhatsApp Business API (Meta) - Best for high volume
 * 2. Twilio WhatsApp API - Easy setup
 * 3. wa.me links - Free, opens WhatsApp with pre-filled message
 */

const axios = require('axios');

// Configuration
const WHATSAPP_CONFIG = {
  provider: process.env.WHATSAPP_PROVIDER || 'walink', // 'meta', 'twilio', 'walink'
  
  // Meta WhatsApp Business API
  meta: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
  },
  
  // Twilio WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER // format: whatsapp:+14155238886
  },
  
  // Clinic WhatsApp number for wa.me links
  clinicNumber: process.env.CLINIC_WHATSAPP_NUMBER || '+919876543210'
};

class WhatsAppService {
  
  /**
   * Send message via configured provider
   */
  async sendMessage(phoneNumber, message, options = {}) {
    const provider = WHATSAPP_CONFIG.provider;
    
    // Normalize phone number (remove spaces, add country code if needed)
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    console.log(`📱 Sending WhatsApp message via ${provider} to ${normalizedPhone}`);
    
    switch (provider) {
      case 'meta':
        return this.sendViaMeta(normalizedPhone, message, options);
      case 'twilio':
        return this.sendViaTwilio(normalizedPhone, message, options);
      case 'walink':
      default:
        return this.generateWaLink(normalizedPhone, message, options);
    }
  }
  
  /**
   * Normalize phone number to international format
   */
  normalizePhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If starts with 0, assume Indian number
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }
    
    // If no country code, assume India (+91)
    if (!cleaned.startsWith('+') && !cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    // Remove + if present for API calls
    cleaned = cleaned.replace('+', '');
    
    return cleaned;
  }
  
  /**
   * Send via Meta WhatsApp Business API
   */
  async sendViaMeta(phone, message, options = {}) {
    const { phoneNumberId, accessToken, apiVersion } = WHATSAPP_CONFIG.meta;
    
    if (!phoneNumberId || !accessToken) {
      console.log('⚠️ Meta WhatsApp not configured, generating wa.me link instead');
      return this.generateWaLink(phone, message, options);
    }
    
    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      };
      
      // If template message
      if (options.template) {
        payload.type = 'template';
        payload.template = options.template;
        delete payload.text;
      }
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ WhatsApp message sent via Meta API');
      return {
        success: true,
        provider: 'meta',
        messageId: response.data.messages?.[0]?.id,
        phone: phone
      };
      
    } catch (error) {
      console.error('❌ Meta WhatsApp API error:', error.response?.data || error.message);
      // Fallback to wa.me link
      return this.generateWaLink(phone, message, options);
    }
  }
  
  /**
   * Send via Twilio WhatsApp API
   */
  async sendViaTwilio(phone, message, options = {}) {
    const { accountSid, authToken, fromNumber } = WHATSAPP_CONFIG.twilio;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.log('⚠️ Twilio not configured, generating wa.me link instead');
      return this.generateWaLink(phone, message, options);
    }
    
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const params = new URLSearchParams();
      params.append('From', fromNumber);
      params.append('To', `whatsapp:+${phone}`);
      params.append('Body', message);
      
      // Add media if provided (for prescriptions, reports)
      if (options.mediaUrl) {
        params.append('MediaUrl', options.mediaUrl);
      }
      
      const response = await axios.post(url, params, {
        auth: {
          username: accountSid,
          password: authToken
        }
      });
      
      console.log('✅ WhatsApp message sent via Twilio');
      return {
        success: true,
        provider: 'twilio',
        messageId: response.data.sid,
        phone: phone
      };
      
    } catch (error) {
      console.error('❌ Twilio WhatsApp API error:', error.response?.data || error.message);
      return this.generateWaLink(phone, message, options);
    }
  }
  
  /**
   * Generate wa.me link (free, works without API)
   */
  generateWaLink(phone, message, options = {}) {
    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    console.log('📎 Generated wa.me link');
    return {
      success: true,
      provider: 'walink',
      link: waLink,
      phone: phone,
      message: message,
      requiresManualSend: true
    };
  }
  
  // ==================== MESSAGE TEMPLATES ====================
  
  /**
   * Send Prescription via WhatsApp
   */
  async sendPrescription(patientPhone, prescriptionData) {
    const { patientName, doctorName, clinicName, date, medicines, diagnosis, advice } = prescriptionData;
    
    let message = `🏥 *${clinicName || 'HealthSync'}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📋 *PRESCRIPTION*\n\n`;
    message += `👤 Patient: ${patientName}\n`;
    message += `👨‍⚕️ Doctor: Dr. ${doctorName}\n`;
    message += `📅 Date: ${new Date(date).toLocaleDateString('en-IN')}\n\n`;
    
    if (diagnosis) {
      message += `🔍 *Diagnosis:* ${diagnosis}\n\n`;
    }
    
    message += `💊 *Medicines:*\n`;
    medicines.forEach((med, index) => {
      message += `${index + 1}. *${med.name}* ${med.strength || ''}\n`;
      message += `   📌 ${med.dosage} - ${med.frequency}\n`;
      message += `   ⏱️ ${med.duration}\n`;
      if (med.instructions) {
        message += `   📝 ${med.instructions}\n`;
      }
      message += `\n`;
    });
    
    if (advice) {
      message += `📝 *Advice:*\n${advice}\n\n`;
    }
    
    message += `━━━━━━━━━━━━━━━\n`;
    message += `🔗 View full prescription on HealthSync app\n`;
    message += `📞 For queries, contact clinic`;
    
    return this.sendMessage(patientPhone, message, { type: 'prescription' });
  }
  
  /**
   * Send Appointment Reminder
   */
  async sendAppointmentReminder(patientPhone, appointmentData) {
    const { patientName, doctorName, clinicName, date, time, consultationType, tokenNumber } = appointmentData;
    
    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    let message = `🏥 *${clinicName || 'HealthSync'}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📅 *APPOINTMENT REMINDER*\n\n`;
    message += `Hello ${patientName}! 👋\n\n`;
    message += `Your appointment is scheduled:\n\n`;
    message += `👨‍⚕️ Doctor: Dr. ${doctorName}\n`;
    message += `📆 Date: ${formattedDate}\n`;
    message += `⏰ Time: ${time}\n`;
    message += `📍 Type: ${consultationType === 'online' ? '🖥️ Online Consultation' : '🏥 In-Person Visit'}\n`;
    
    if (tokenNumber) {
      message += `🎫 Token: ${tokenNumber}\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━\n`;
    
    if (consultationType === 'online') {
      message += `💡 Join link will be shared before appointment\n`;
    } else {
      message += `💡 Please arrive 10 mins early\n`;
      message += `📄 Carry previous reports if any\n`;
    }
    
    message += `\n❌ To cancel/reschedule, visit the app`;
    
    return this.sendMessage(patientPhone, message, { type: 'reminder' });
  }
  
  /**
   * Send Appointment Confirmation
   */
  async sendAppointmentConfirmation(patientPhone, appointmentData) {
    const { patientName, doctorName, clinicName, date, time, consultationType, tokenNumber, amount } = appointmentData;
    
    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    
    let message = `✅ *Appointment Confirmed!*\n\n`;
    message += `🏥 ${clinicName || 'HealthSync'}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;
    message += `👤 ${patientName}\n`;
    message += `👨‍⚕️ Dr. ${doctorName}\n`;
    message += `📅 ${formattedDate} at ${time}\n`;
    message += `📍 ${consultationType === 'online' ? 'Online' : 'In-Person'}\n`;
    
    if (tokenNumber) {
      message += `🎫 Token: *${tokenNumber}*\n`;
    }
    
    if (amount) {
      message += `💰 Amount: ₹${amount}\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━\n`;
    message += `📱 Manage on HealthSync app`;
    
    return this.sendMessage(patientPhone, message, { type: 'confirmation' });
  }
  
  /**
   * Send Lab Report Ready Notification
   */
  async sendLabReportReady(patientPhone, reportData) {
    const { patientName, testName, clinicName, reportDate, reportUrl } = reportData;
    
    let message = `🏥 *${clinicName || 'HealthSync'}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `🔬 *LAB REPORT READY*\n\n`;
    message += `Hello ${patientName}! 👋\n\n`;
    message += `Your lab report is ready:\n\n`;
    message += `📋 Test: ${testName}\n`;
    message += `📅 Date: ${new Date(reportDate).toLocaleDateString('en-IN')}\n\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📥 View/Download from HealthSync app\n`;
    
    if (reportUrl) {
      message += `🔗 Or click: ${reportUrl}\n`;
    }
    
    message += `\n💡 Consult your doctor for interpretation`;
    
    return this.sendMessage(patientPhone, message, { 
      type: 'lab_report',
      mediaUrl: reportUrl 
    });
  }
  
  /**
   * Send Payment Receipt
   */
  async sendPaymentReceipt(patientPhone, paymentData) {
    const { patientName, amount, paymentId, serviceName, clinicName, date } = paymentData;
    
    let message = `🏥 *${clinicName || 'HealthSync'}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `✅ *PAYMENT RECEIPT*\n\n`;
    message += `Thank you ${patientName}! 🙏\n\n`;
    message += `💰 Amount: *₹${amount}*\n`;
    message += `📋 For: ${serviceName}\n`;
    message += `📅 Date: ${new Date(date).toLocaleDateString('en-IN')}\n`;
    message += `🔖 Receipt ID: ${paymentId}\n\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📱 View details on HealthSync app`;
    
    return this.sendMessage(patientPhone, message, { type: 'receipt' });
  }
  
  /**
   * Send Follow-up Reminder
   */
  async sendFollowUpReminder(patientPhone, followUpData) {
    const { patientName, doctorName, clinicName, followUpDate, reason } = followUpData;
    
    const fDate = new Date(followUpDate);
    const formattedDate = fDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    let message = `🏥 *${clinicName || 'HealthSync'}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `🔔 *FOLLOW-UP REMINDER*\n\n`;
    message += `Hello ${patientName}! 👋\n\n`;
    message += `Dr. ${doctorName} has recommended a follow-up visit.\n\n`;
    message += `📅 Suggested Date: ${formattedDate}\n`;
    
    if (reason) {
      message += `📝 Reason: ${reason}\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━\n`;
    message += `📱 Book now on HealthSync app\n`;
    message += `💡 Regular follow-ups ensure better health outcomes`;
    
    return this.sendMessage(patientPhone, message, { type: 'followup' });
  }
  
  /**
   * Send Queue Update
   */
  async sendQueueUpdate(patientPhone, queueData) {
    const { patientName, tokenNumber, currentToken, estimatedWait, doctorName } = queueData;
    
    let message = `🎫 *Queue Update*\n\n`;
    message += `Hello ${patientName}!\n\n`;
    message += `Your Token: *${tokenNumber}*\n`;
    message += `Now Serving: *${currentToken}*\n`;
    message += `⏱️ Est. Wait: ~${estimatedWait} mins\n\n`;
    message += `👨‍⚕️ Dr. ${doctorName}\n\n`;
    message += `💡 We'll notify when it's almost your turn`;
    
    return this.sendMessage(patientPhone, message, { type: 'queue' });
  }
  
  /**
   * Send Custom Message
   */
  async sendCustomMessage(patientPhone, customMessage, clinicName = 'HealthSync') {
    let message = `🏥 *${clinicName}*\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;
    message += customMessage;
    
    return this.sendMessage(patientPhone, message, { type: 'custom' });
  }
}

module.exports = new WhatsAppService();
