// backend/services/queueNotificationService.js
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendQueueNotificationEmail } = require('./emailService');

// Track which patients have been notified (to avoid duplicate notifications)
const notifiedPatients = new Map(); // appointmentId -> { position, notifiedAt }

// Default consultation duration in minutes
const DEFAULT_SLOT_DURATION = 15;

/**
 * Calculate estimated wait time based on queue position and slot duration
 */
function calculateEstimatedWaitTime(queuePosition, slotDuration = DEFAULT_SLOT_DURATION, bufferTime = 5) {
  // Each patient takes slotDuration + bufferTime
  const timePerPatient = slotDuration + bufferTime;
  return (queuePosition - 1) * timePerPatient;
}

/**
 * Calculate estimated appointment time
 */
function calculateEstimatedTime(baseTime, waitMinutes) {
  const [hours, minutes] = baseTime.split(':').map(Number);
  const baseDate = new Date();
  baseDate.setHours(hours, minutes, 0, 0);
  baseDate.setMinutes(baseDate.getMinutes() + waitMinutes);
  
  return baseDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Get queue position for an appointment
 */
async function getQueuePosition(appointmentId) {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name consultationSettings')
      .populate('userId', 'name email');
    
    if (!appointment) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
    
    // Only for today's appointments
    if (appointmentDate !== today) return null;
    
    // Get all appointments for this doctor today, sorted by time/token
    const todayAppointments = await Appointment.find({
      doctorId: appointment.doctorId._id,
      date: { 
        $gte: new Date(today), 
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).sort({ tokenNumber: 1, time: 1 });
    
    // Find position in queue
    const position = todayAppointments.findIndex(a => a._id.toString() === appointmentId) + 1;
    
    // Get slot duration from doctor settings
    const slotDuration = appointment.doctorId?.consultationSettings?.slotDuration || DEFAULT_SLOT_DURATION;
    const bufferTime = appointment.doctorId?.consultationSettings?.bufferTime || 5;
    
    // Calculate estimated wait
    const estimatedWaitMinutes = calculateEstimatedWaitTime(position, slotDuration, bufferTime);
    const estimatedTime = calculateEstimatedTime(appointment.time, estimatedWaitMinutes);
    
    return {
      appointmentId,
      position,
      totalInQueue: todayAppointments.length,
      estimatedWaitMinutes,
      estimatedTime,
      appointmentTime: appointment.time,
      patientName: appointment.userId?.name,
      patientEmail: appointment.userId?.email,
      doctorName: appointment.doctorId?.name,
      slotDuration,
      bufferTime
    };
  } catch (error) {
    console.error('Error getting queue position:', error);
    return null;
  }
}

/**
 * Check and send notification if patient's turn is approaching
 * AI-powered smart notification: Notifies when patient is within 2 positions
 * This gives patients enough time to prepare and arrive
 */
async function checkAndNotifyPatient(appointmentId, notifyAtPosition = 2) {
  try {
    const queueInfo = await getQueuePosition(appointmentId);
    if (!queueInfo) return { notified: false, reason: 'Appointment not found or not today' };
    
    const { position, patientEmail, patientName, doctorName, estimatedWaitMinutes, appointmentTime } = queueInfo;
    
    // Skip if no email
    if (!patientEmail) {
      return { notified: false, reason: 'No email address for patient' };
    }
    
    // Check if already notified at this position
    const previousNotification = notifiedPatients.get(appointmentId);
    if (previousNotification && previousNotification.position <= position) {
      return { notified: false, reason: 'Already notified at this or earlier position' };
    }
    
    // Smart notification logic:
    // - Position 1: "You are NEXT!" (urgent)
    // - Position 2: "Only 1 patient before you!" (urgent)
    // - Position 3: "2 patients before you" (prepare)
    if (position <= notifyAtPosition && position > 0) {
      console.log(`🤖 AI Smart Notification: Alerting ${patientName} at position ${position}`);
      
      // Send email notification
      const result = await sendQueueNotificationEmail(
        patientEmail,
        patientName,
        doctorName,
        position,
        estimatedWaitMinutes,
        formatTime(appointmentTime)
      );
      
      if (result.success) {
        // Track notification
        notifiedPatients.set(appointmentId, {
          position,
          notifiedAt: new Date(),
          type: position === 1 ? 'next' : position === 2 ? 'urgent' : 'prepare'
        });
        
        console.log(`✅ Smart notification sent to ${patientEmail} (Position: ${position})`);
        
        return { 
          notified: true, 
          position, 
          estimatedWaitMinutes,
          urgency: position <= 2 ? 'urgent' : 'normal',
          message: `Notification sent to ${patientEmail}` 
        };
      }
    }
    
    return { 
      notified: false, 
      position, 
      estimatedWaitMinutes,
      reason: position > notifyAtPosition ? `Position ${position} is not within notification threshold (${notifyAtPosition})` : 'Email failed'
    };
  } catch (error) {
    console.error('Error in checkAndNotifyPatient:', error);
    return { notified: false, error: error.message };
  }
}

/**
 * Process queue and notify all patients who are approaching their turn
 */
async function processQueueNotifications(doctorId, notifyAtPosition = 3) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all pending/confirmed appointments for this doctor today
    const appointments = await Appointment.find({
      doctorId,
      date: { 
        $gte: new Date(today), 
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ tokenNumber: 1, time: 1 });
    
    const results = [];
    
    for (let i = 0; i < Math.min(appointments.length, notifyAtPosition); i++) {
      const result = await checkAndNotifyPatient(appointments[i]._id.toString(), notifyAtPosition);
      results.push({
        appointmentId: appointments[i]._id,
        ...result
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error processing queue notifications:', error);
    return [];
  }
}

/**
 * Get estimated time for all appointments in queue
 */
async function getQueueWithEstimates(doctorId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const doctor = await Doctor.findById(doctorId).select('consultationSettings');
    const slotDuration = doctor?.consultationSettings?.slotDuration || DEFAULT_SLOT_DURATION;
    const bufferTime = doctor?.consultationSettings?.bufferTime || 5;
    
    const appointments = await Appointment.find({
      doctorId,
      date: { 
        $gte: new Date(today), 
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    })
    .populate('userId', 'name email phone')
    .sort({ tokenNumber: 1, time: 1 });
    
    // Find current patient (in_progress)
    const currentIndex = appointments.findIndex(a => a.status === 'in_progress');
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    
    return appointments.map((apt, index) => {
      const queuePosition = index - startIndex + 1;
      const estimatedWaitMinutes = queuePosition > 0 ? calculateEstimatedWaitTime(queuePosition, slotDuration, bufferTime) : 0;
      
      return {
        _id: apt._id,
        tokenNumber: apt.tokenNumber,
        time: apt.time,
        status: apt.status,
        patient: apt.userId,
        reason: apt.reason,
        consultationType: apt.consultationType,
        queuePosition: queuePosition > 0 ? queuePosition : 'Current',
        estimatedWaitMinutes,
        estimatedTime: queuePosition > 0 ? calculateEstimatedTime(apt.time, estimatedWaitMinutes) : 'Now',
        isCurrentPatient: apt.status === 'in_progress'
      };
    });
  } catch (error) {
    console.error('Error getting queue with estimates:', error);
    return [];
  }
}

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Clean up old notifications (older than 24 hours)
function cleanupOldNotifications() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [appointmentId, data] of notifiedPatients.entries()) {
    if (data.notifiedAt < oneDayAgo) {
      notifiedPatients.delete(appointmentId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldNotifications, 60 * 60 * 1000);

module.exports = {
  getQueuePosition,
  checkAndNotifyPatient,
  processQueueNotifications,
  getQueueWithEstimates,
  calculateEstimatedWaitTime,
  calculateEstimatedTime
};
