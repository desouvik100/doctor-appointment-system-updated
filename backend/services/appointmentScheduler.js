// backend/services/appointmentScheduler.js
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { generateGoogleMeetLink } = require('./googleMeetService');
const { sendAppointmentEmail } = require('./emailService');

// Store scheduled jobs
const scheduledJobs = new Map();

/**
 * Schedule Google Meet link generation 18 minutes before appointment
 * @param {Object} appointment - Appointment document
 */
function scheduleGoogleMeetGeneration(appointment) {
  try {
    // Skip if not online consultation
    if (appointment.consultationType !== 'online') {
      return;
    }

    // Skip if already generated
    if (appointment.meetLinkGenerated) {
      console.log(`✅ Meet link already generated for appointment ${appointment._id}`);
      return;
    }

    // Calculate appointment datetime
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate trigger time (18 minutes before)
    const triggerTime = new Date(appointmentDate.getTime() - 18 * 60 * 1000);
    const now = new Date();

    // If trigger time has passed, generate immediately
    if (triggerTime <= now) {
      console.log(`⚡ Generating Meet link immediately for appointment ${appointment._id}`);
      generateAndSendMeetLink(appointment._id);
      return;
    }

    // Schedule for future
    const delay = triggerTime.getTime() - now.getTime();
    
    console.log(`📅 Scheduling Meet link generation for appointment ${appointment._id}`);
    console.log(`   Appointment time: ${appointmentDate.toLocaleString()}`);
    console.log(`   Will generate at: ${triggerTime.toLocaleString()}`);
    console.log(`   Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    const timeoutId = setTimeout(async () => {
      await generateAndSendMeetLink(appointment._id);
      scheduledJobs.delete(appointment._id.toString());
    }, delay);

    // Store the timeout ID
    scheduledJobs.set(appointment._id.toString(), timeoutId);

  } catch (error) {
    console.error('❌ Error scheduling Meet link generation:', error);
  }
}

/**
 * Generate and send Google Meet link
 * @param {String} appointmentId - Appointment ID
 */
async function generateAndSendMeetLink(appointmentId) {
  try {
    console.log(`🔄 Generating Meet link for appointment ${appointmentId}...`);

    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      console.error(`❌ Appointment ${appointmentId} not found`);
      return;
    }

    // Skip if already generated
    if (appointment.meetLinkGenerated) {
      console.log(`✅ Meet link already exists for appointment ${appointmentId}`);
      return;
    }

    // Generate Google Meet link
    const meetResult = await generateGoogleMeetLink(appointment);

    if (!meetResult.success) {
      console.error(`❌ Failed to generate Meet link for appointment ${appointmentId}`);
      return;
    }

    // Update appointment with Meet link
    appointment.googleMeetLink = meetResult.meetLink;
    appointment.googleEventId = meetResult.eventId;
    appointment.meetLinkGenerated = true;
    appointment.meetLinkGeneratedAt = new Date();
    
    // Also update the legacy meetingLink field for backward compatibility
    appointment.meetingLink = meetResult.meetLink;

    await appointment.save();

    console.log(`✅ Meet link saved for appointment ${appointmentId}`);
    console.log(`   Link: ${meetResult.meetLink}`);
    console.log(`   Provider: ${meetResult.provider}`);

    // Send email to patient
    try {
      await sendAppointmentEmail(appointment, 'patient');
      appointment.meetLinkSentToPatient = true;
      console.log(`✅ Email sent to patient: ${appointment.userId.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email to patient:`, emailError.message);
    }

    // Send email to doctor
    try {
      await sendAppointmentEmail(appointment, 'doctor');
      appointment.meetLinkSentToDoctor = true;
      console.log(`✅ Email sent to doctor: ${appointment.doctorId.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email to doctor:`, emailError.message);
    }

    await appointment.save();

  } catch (error) {
    console.error(`❌ Error in generateAndSendMeetLink:`, error);
  }
}

/**
 * Cancel scheduled Meet link generation
 * @param {String} appointmentId - Appointment ID
 */
function cancelScheduledGeneration(appointmentId) {
  const jobId = appointmentId.toString();
  
  if (scheduledJobs.has(jobId)) {
    clearTimeout(scheduledJobs.get(jobId));
    scheduledJobs.delete(jobId);
    console.log(`✅ Cancelled scheduled generation for appointment ${appointmentId}`);
  }
}

/**
 * Initialize scheduler - scan for pending appointments on startup
 */
async function initializeScheduler() {
  try {
    console.log('🚀 Initializing appointment scheduler...');

    // Find all confirmed online appointments in the future
    const now = new Date();
    const futureAppointments = await Appointment.find({
      consultationType: 'online',
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: now },
      meetLinkGenerated: false
    });

    console.log(`📋 Found ${futureAppointments.length} appointments to schedule`);

    // Schedule each appointment
    for (const appointment of futureAppointments) {
      scheduleGoogleMeetGeneration(appointment);
    }

    // Run cleanup job every hour to check for missed appointments
    cron.schedule('0 * * * *', async () => {
      console.log('🔍 Running hourly appointment check...');
      await checkMissedAppointments();
    });

    console.log('✅ Appointment scheduler initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing scheduler:', error);
  }
}

/**
 * Check for appointments that missed their scheduled generation
 */
async function checkMissedAppointments() {
  try {
    const now = new Date();
    const eighteenMinutesAgo = new Date(now.getTime() - 18 * 60 * 1000);

    // Find appointments that should have had links generated
    const missedAppointments = await Appointment.find({
      consultationType: 'online',
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: eighteenMinutesAgo, $lte: now },
      meetLinkGenerated: false
    });

    if (missedAppointments.length > 0) {
      console.log(`⚠️ Found ${missedAppointments.length} missed appointments, generating links now...`);
      
      for (const appointment of missedAppointments) {
        await generateAndSendMeetLink(appointment._id);
      }
    }

  } catch (error) {
    console.error('❌ Error checking missed appointments:', error);
  }
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    activeJobs: scheduledJobs.size,
    scheduledAppointments: Array.from(scheduledJobs.keys())
  };
}

module.exports = {
  scheduleGoogleMeetGeneration,
  cancelScheduledGeneration,
  initializeScheduler,
  generateAndSendMeetLink,
  getSchedulerStatus
};
