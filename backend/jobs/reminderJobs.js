/**
 * Reminder Jobs - Automated Appointment Reminders
 * ================================================
 * Sends timely reminders to patients about upcoming appointments
 * 
 * Reminder Schedule:
 * - 24 hours before appointment (email + SMS)
 * - 1 hour before appointment (email + SMS)
 * - 15 minutes before online consultations (push notification)
 */

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const Notification = require('../models/Notification');

/**
 * Send 24-hour reminder emails
 */
async function send24HourReminders() {
  try {
    console.log('📧 Checking for 24-hour appointment reminders...');

    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFourHoursWindow = new Date(twentyFourHoursLater.getTime() + 30 * 60 * 1000); // 30-minute window

    // Find appointments in the next 24 hours that haven't been reminded
    const appointments = await Appointment.find({
      date: {
        $gte: twentyFourHoursLater,
        $lt: twentyFourHoursWindow
      },
      status: { $in: ['confirmed', 'pending'] },
      'remindersSent.email24h': false
    })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address phone')
      .limit(100); // Process in batches

    console.log(`Found ${appointments.length} appointments for 24h reminders`);

    let sentCount = 0;
    let failedCount = 0;

    for (const appointment of appointments) {
      try {
        // Send email reminder
        if (appointment.userId?.email) {
          await sendAppointmentReminderEmail(appointment, '24 hours');
          appointment.remindersSent.email24h = true;
          sentCount++;
        }

        // Send SMS if preference is set
        const reminderPref = appointment.reminderPreference || 'email';
        if ((reminderPref === 'sms' || reminderPref === 'both') && appointment.userId?.phone) {
          await sendAppointmentReminderSMS(appointment, '24 hours');
          appointment.remindersSent.sms24h = true;
        }

        // Create in-app notification
        await createReminderNotification(appointment, '24 hours');

        await appointment.save();
      } catch (error) {
        console.error(`Failed to send 24h reminder for appointment ${appointment._id}:`, error.message);
        failedCount++;
      }
    }

    console.log(`✅ 24h reminders: ${sentCount} sent, ${failedCount} failed`);
    return { success: true, sent: sentCount, failed: failedCount };
  } catch (error) {
    console.error('❌ Error in send24HourReminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send 1-hour reminder emails
 */
async function send1HourReminders() {
  try {
    console.log('📧 Checking for 1-hour appointment reminders...');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourWindow = new Date(oneHourLater.getTime() + 15 * 60 * 1000); // 15-minute window

    // Find appointments in the next 1 hour that haven't been reminded
    const appointments = await Appointment.find({
      date: {
        $gte: oneHourLater,
        $lt: oneHourWindow
      },
      status: { $in: ['confirmed', 'pending'] },
      'remindersSent.email1h': false
    })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address phone')
      .limit(100);

    console.log(`Found ${appointments.length} appointments for 1h reminders`);

    let sentCount = 0;
    let failedCount = 0;

    for (const appointment of appointments) {
      try {
        // Send email reminder
        if (appointment.userId?.email) {
          await sendAppointmentReminderEmail(appointment, '1 hour');
          appointment.remindersSent.email1h = true;
          sentCount++;
        }

        // Send SMS if preference is set
        const reminderPref = appointment.reminderPreference || 'email';
        if ((reminderPref === 'sms' || reminderPref === 'both') && appointment.userId?.phone) {
          await sendAppointmentReminderSMS(appointment, '1 hour');
          appointment.remindersSent.sms1h = true;
        }

        // Create in-app notification
        await createReminderNotification(appointment, '1 hour');

        await appointment.save();
      } catch (error) {
        console.error(`Failed to send 1h reminder for appointment ${appointment._id}:`, error.message);
        failedCount++;
      }
    }

    console.log(`✅ 1h reminders: ${sentCount} sent, ${failedCount} failed`);
    return { success: true, sent: sentCount, failed: failedCount };
  } catch (error) {
    console.error('❌ Error in send1HourReminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send appointment reminder email
 */
async function sendAppointmentReminderEmail(appointment, timeframe) {
  const patient = appointment.userId;
  const doctor = appointment.doctorId;
  const clinic = appointment.clinicId;

  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `⏰ Reminder: Appointment in ${timeframe} - Dr. ${doctor.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #00D4AA 0%, #00B894 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .content { padding: 30px; }
        .appointment-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #00D4AA; }
        .detail-row { display: flex; margin: 12px 0; }
        .detail-label { font-weight: 600; color: #6b7280; min-width: 120px; }
        .detail-value { color: #1f2937; }
        .btn { display: inline-block; background: #00D4AA; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; }
        .urgent { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-top: 16px; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Appointment Reminder</h1>
          <p>Your appointment is in ${timeframe}</p>
        </div>
        <div class="content">
          <p>Hello ${patient.name},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div class="appointment-card">
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span class="detail-value">Dr. ${doctor.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Specialization:</span>
              <span class="detail-value">${doctor.specialization || 'General Physician'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${appointment.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${appointment.consultationType === 'online' ? '🌐 Online Consultation' : '🏥 In-Person Visit'}</span>
            </div>
            ${appointment.consultationType === 'in_person' ? `
            <div class="detail-row">
              <span class="detail-label">Clinic:</span>
              <span class="detail-value">${clinic.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${clinic.address}</span>
            </div>
            ` : ''}
            ${appointment.token ? `
            <div class="detail-row">
              <span class="detail-label">Token:</span>
              <span class="detail-value"><strong>${appointment.token}</strong></span>
            </div>
            ` : ''}
          </div>
          
          ${appointment.consultationType === 'online' ? `
          <div class="urgent">
            <strong>📱 Online Consultation:</strong> You'll receive the meeting link 15 minutes before your appointment. Please ensure you have a stable internet connection.
          </div>
          ` : `
          <div class="urgent">
            <strong>🚗 In-Person Visit:</strong> Please arrive 10 minutes early for check-in. Bring your ID and any relevant medical documents.
          </div>
          `}
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments" class="btn">
              View Appointment Details
            </a>
          </center>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Need to reschedule or cancel? Please do so at least 24 hours in advance to avoid cancellation fees.
          </p>
        </div>
        <div class="footer">
          <p>🏥 HealthSync - Your Healthcare Companion</p>
          <p>Questions? Contact us at support@healthsyncpro.in</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: patient.email,
    subject,
    html
  });

  console.log(`✅ ${timeframe} reminder email sent to ${patient.email}`);
}

/**
 * Send appointment reminder SMS
 */
async function sendAppointmentReminderSMS(appointment, timeframe) {
  const patient = appointment.userId;
  const doctor = appointment.doctorId;
  
  const message = `HealthSync Reminder: Your appointment with Dr. ${doctor.name} is in ${timeframe} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}. ${appointment.consultationType === 'online' ? 'Meeting link will be sent 15 mins before.' : 'Please arrive 10 mins early.'} Token: ${appointment.token || 'N/A'}`;

  await sendSMS(patient.phone, message);
  console.log(`✅ ${timeframe} reminder SMS sent to ${patient.phone}`);
}

/**
 * Create in-app notification for reminder
 */
async function createReminderNotification(appointment, timeframe) {
  try {
    await Notification.create({
      userId: appointment.userId._id,
      userType: 'patient',
      title: `⏰ Appointment in ${timeframe}`,
      message: `Your appointment with Dr. ${appointment.doctorId.name} is scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}`,
      type: 'appointment_reminder',
      priority: timeframe === '1 hour' ? 'high' : 'medium',
      data: {
        appointmentId: appointment._id,
        doctorId: appointment.doctorId._id,
        actionUrl: `/appointments/${appointment._id}`
      }
    });
  } catch (error) {
    console.error('Failed to create reminder notification:', error.message);
  }
}

/**
 * Initialize reminder job scheduler
 * Runs every 15 minutes to check for reminders
 */
function initializeReminderJobs() {
  console.log('📧 Initializing reminder job scheduler...');

  // Check for 24-hour reminders every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Checking for 24-hour reminders...');
    await send24HourReminders();
  });

  // Check for 1-hour reminders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Checking for 1-hour reminders...');
    await send1HourReminders();
  });

  console.log('✅ Reminder jobs scheduled:');
  console.log('   - 24h reminders: Every hour');
  console.log('   - 1h reminders: Every 15 minutes');
}

module.exports = {
  initializeReminderJobs,
  send24HourReminders,
  send1HourReminders,
  sendAppointmentReminderEmail,
  sendAppointmentReminderSMS
};
