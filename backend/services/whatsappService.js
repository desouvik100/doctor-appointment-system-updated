/**
 * WhatsApp Integration Service
 * Requirement 1: WhatsApp-First Booking System
 * 
 * Uses WhatsApp Business API (Meta Cloud API)
 * For production, you need:
 * 1. Meta Business Account
 * 2. WhatsApp Business API access
 * 3. Verified phone number
 */

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.isEnabled = !!(this.phoneNumberId && this.accessToken);
    
    if (!this.isEnabled) {
      console.log('⚠️  WhatsApp service not configured - running in mock mode');
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to, message) {
    if (!this.isEnabled) {
      console.log(`[WhatsApp Mock] To: ${to}, Message: ${message}`);
      return { success: true, mock: true };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(to, bookingDetails) {
    const { patientName, doctorName, date, time, tokenNumber, clinicName, consultationType } = bookingDetails;
    
    const message = `🏥 *HealthSyncPro - Booking Confirmed*

✅ Your appointment is confirmed!

👤 Patient: ${patientName}
👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
🎫 Token: ${tokenNumber || 'Will be assigned'}
🏥 Clinic: ${clinicName}
📱 Type: ${consultationType === 'video' ? 'Video Consultation' : 'In-Clinic Visit'}

${consultationType === 'video' ? '📹 Video link will be sent 15 minutes before appointment.' : '📍 Please arrive 10 minutes early.'}

To reschedule or cancel, reply with:
• RESCHEDULE
• CANCEL

Thank you for choosing HealthSyncPro! 🙏`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(to, reminderDetails) {
    const { patientName, doctorName, date, time, hoursUntil, clinicName, consultationType } = reminderDetails;
    
    const message = `⏰ *Appointment Reminder*

Hi ${patientName}!

Your appointment is in *${hoursUntil} hour(s)*:

👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}
🏥 ${clinicName}

${consultationType === 'video' 
  ? '📹 Join link: Will be sent 15 min before'
  : '📍 Please arrive 10 minutes early'}

Reply CONFIRM to confirm your attendance.
Reply CANCEL to cancel.

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send queue update
   */
  async sendQueueUpdate(to, queueDetails) {
    const { patientName, tokenNumber, position, estimatedWait, doctorName } = queueDetails;
    
    let message;
    
    if (position === 0) {
      message = `🔔 *Your Turn Now!*

Hi ${patientName}!

🎫 Token: ${tokenNumber}
👨‍⚕️ Dr. ${doctorName} is ready for you.

Please proceed to the consultation room.

- HealthSyncPro`;
    } else if (position <= 3) {
      message = `⏳ *Almost Your Turn*

Hi ${patientName}!

🎫 Token: ${tokenNumber}
📊 Position: ${position} patient(s) ahead
⏱️ Est. Wait: ~${estimatedWait} minutes

Please be ready!

- HealthSyncPro`;
    } else {
      message = `📊 *Queue Update*

Hi ${patientName}!

🎫 Token: ${tokenNumber}
📊 Position: ${position}
⏱️ Est. Wait: ~${estimatedWait} minutes

We'll notify you when it's almost your turn.

- HealthSyncPro`;
    }

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send payment link
   */
  async sendPaymentLink(to, paymentDetails) {
    const { patientName, amount, doctorName, paymentLink, orderId } = paymentDetails;
    
    const message = `💳 *Payment Request*

Hi ${patientName}!

Please complete payment for your appointment:

👨‍⚕️ Doctor: Dr. ${doctorName}
💰 Amount: ₹${amount}
🔗 Order ID: ${orderId}

Pay securely here:
${paymentLink}

⚠️ Link expires in 30 minutes.

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send prescription
   */
  async sendPrescription(to, prescriptionDetails) {
    const { patientName, doctorName, date, medicines, downloadLink } = prescriptionDetails;
    
    let medicineList = medicines.map((m, i) => 
      `${i + 1}. ${m.name} - ${m.dosage} (${m.duration})`
    ).join('\n');
    
    const message = `📋 *E-Prescription*

Hi ${patientName}!

Your prescription from Dr. ${doctorName}:
📅 Date: ${date}

*Medicines:*
${medicineList}

📥 Download PDF: ${downloadLink}

⚠️ Please consult your doctor before making any changes.

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send doctor availability for booking
   */
  async sendDoctorAvailability(to, availabilityDetails) {
    const { patientName, doctorName, specialization, slots, date } = availabilityDetails;
    
    let slotList = slots.map((s, i) => 
      `${i + 1}. ${s.time} - ${s.type === 'video' ? '📹 Video' : '🏥 Clinic'}`
    ).join('\n');
    
    const message = `👨‍⚕️ *Available Slots*

Hi ${patientName}!

Dr. ${doctorName} (${specialization})
📅 ${date}

*Available Slots:*
${slotList}

Reply with slot number to book.
Example: "1" for first slot

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send cancellation confirmation
   */
  async sendCancellationConfirmation(to, details) {
    const { patientName, doctorName, date, time, refundAmount } = details;
    
    const message = `❌ *Appointment Cancelled*

Hi ${patientName}!

Your appointment has been cancelled:

👨‍⚕️ Doctor: Dr. ${doctorName}
📅 Date: ${date}
⏰ Time: ${time}

${refundAmount > 0 
  ? `💰 Refund of ₹${refundAmount} will be processed in 5-7 business days.`
  : ''}

To book a new appointment, reply BOOK.

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send health reminder
   */
  async sendHealthReminder(to, reminderDetails) {
    const { patientName, reminderType, title, description, actionLink } = reminderDetails;
    
    const icons = {
      'checkup': '🩺',
      'vaccination': '💉',
      'lab_test': '🧪',
      'medicine_refill': '💊',
      'follow_up': '📅'
    };
    
    const message = `${icons[reminderType] || '🔔'} *Health Reminder*

Hi ${patientName}!

*${title}*
${description}

${actionLink ? `📲 Take action: ${actionLink}` : 'Reply BOOK to schedule an appointment.'}

Stay healthy! 💪

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send emergency SOS alert to contacts
   */
  async sendEmergencyAlert(to, emergencyDetails) {
    const { patientName, patientPhone, emergencyType, location, mapLink } = emergencyDetails;
    
    const message = `🚨 *EMERGENCY ALERT*

${patientName} has triggered an emergency SOS!

📞 Phone: ${patientPhone}
🆘 Type: ${emergencyType}
📍 Location: ${location}

🗺️ Map: ${mapLink}

Please contact them immediately or call emergency services.

- HealthSyncPro Emergency System`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Send wallet low balance alert
   */
  async sendWalletAlert(to, walletDetails) {
    const { patientName, balance, threshold } = walletDetails;
    
    const message = `💰 *Low Wallet Balance*

Hi ${patientName}!

Your Family Health Wallet balance is low:

💳 Current Balance: ₹${balance}
⚠️ Alert Threshold: ₹${threshold}

Add money to continue booking appointments seamlessly.

Reply TOPUP to add money.

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Process incoming WhatsApp message (webhook)
   */
  async processIncomingMessage(message) {
    const { from, text, type } = message;
    const body = text?.body?.toUpperCase().trim();
    
    // Command handlers
    const commands = {
      'BOOK': this.handleBookCommand,
      'CANCEL': this.handleCancelCommand,
      'RESCHEDULE': this.handleRescheduleCommand,
      'CONFIRM': this.handleConfirmCommand,
      'STATUS': this.handleStatusCommand,
      'HELP': this.handleHelpCommand,
      'TOPUP': this.handleTopupCommand
    };
    
    const handler = commands[body];
    if (handler) {
      return await handler.call(this, from);
    }
    
    // Check if it's a slot selection (number)
    if (/^\d+$/.test(body)) {
      return await this.handleSlotSelection(from, parseInt(body));
    }
    
    // Default response
    return await this.sendHelpMessage(from);
  }

  async handleBookCommand(from) {
    // This would integrate with your booking system
    const message = `📅 *Book Appointment*

To book an appointment, please tell us:

1. Doctor name or specialization
2. Preferred date
3. Video or In-clinic

Example: "Cardiologist, tomorrow, video"

Or visit: https://healthsyncpro.in/book

- HealthSyncPro`;

    return await this.sendTextMessage(from, message);
  }

  async handleHelpCommand(from) {
    return await this.sendHelpMessage(from);
  }

  async sendHelpMessage(to) {
    const message = `🏥 *HealthSyncPro Help*

Available commands:

📅 BOOK - Book new appointment
❌ CANCEL - Cancel appointment
🔄 RESCHEDULE - Reschedule appointment
✅ CONFIRM - Confirm appointment
📊 STATUS - Check appointment status
💰 TOPUP - Add money to wallet

Or visit: https://healthsyncpro.in

Need help? Call: 1800-XXX-XXXX

- HealthSyncPro`;

    return await this.sendTextMessage(to, message);
  }

  /**
   * Format phone number for WhatsApp API
   */
  formatPhoneNumber(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add India country code if not present
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }
}

// Export singleton instance
module.exports = new WhatsAppService();
