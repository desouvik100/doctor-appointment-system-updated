 

const mongoose = require('mongoose');
const NOTIFICATION_TYPES = {
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  REMINDER_24H: 'reminder_24h',
  REMINDER_15MIN: 'reminder_15min',
  JOINING_INSTRUCTIONS: 'joining_instructions',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended'
};
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

function scheduleNotifications(appointment) {
  const notifications = [];
  const appointmentTime = new Date(appointment.dateTime);
  notifications.push({
    type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION,
    scheduledFor: new Date(),
    appointmentId: appointment._id,
    recipientId: appointment.patientId,
    recipientType: 'patient',
    channels: [CHANNELS.EMAIL, CHANNELS.SMS],
    data: {
      appointmentTime: appointmentTime,
      doctorName: appointment.doctorName,
      joinUrl: generateJoinUrl(appointment._id, 'patient')
    }
  });
  const reminder24h = new Date(appointmentTime);
  reminder24h.setHours(reminder24h.getHours() - 24);
  
  if (reminder24h > new Date()) {
    notifications.push({
      type: NOTIFICATION_TYPES.REMINDER_24H,
      scheduledFor: reminder24h,
      appointmentId: appointment._id,
      recipientId: appointment.patientId,
      recipientType: 'patient',
      channels: [CHANNELS.EMAIL],
      data: {
        appointmentTime: appointmentTime,
        doctorName: appointment.doctorName
      }
    });
  }
  const reminder15min = new Date(appointmentTime);
  reminder15min.setMinutes(reminder15min.getMinutes() - 15);
  
  if (reminder15min > new Date()) {
    notifications.push({
      type: NOTIFICATION_TYPES.REMINDER_15MIN,
      scheduledFor: reminder15min,
      appointmentId: appointment._id,
      recipientId: appointment.patientId,
      recipientType: 'patient',
      channels: [CHANNELS.SMS, CHANNELS.PUSH],
      data: {
        appointmentTime: appointmentTime,
        joinUrl: generateJoinUrl(appointment._id, 'patient')
      }
    });
  }
  
  return notifications;
}

function generateJoinUrl(appointmentId, role) {
  const baseUrl = process.env.APP_URL || 'https://healthsync.app';
  const token = generateSessionToken(appointmentId, role);
  return `${baseUrl}/telemedicine/join/${appointmentId}?token=${token}`;
}

function generateSessionToken(appointmentId, role) {
  const payload = `${appointmentId}:${role}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

function validateNotificationSchedule(notifications, appointmentTime) {
  const errors = [];
  
  notifications.forEach((notification, index) => {
    if (notification.type !== NOTIFICATION_TYPES.APPOINTMENT_CONFIRMATION) {
     if (notification.scheduledFor >= appointmentTime) {
        errors.push(`Notification ${index} scheduled after appointment time`);
      }
    }
    if (!notification.recipientId) {
     errors.push(`Notification ${index} missing recipientId`);
    }
    
    if (!notification.channels || notification.channels.length === 0) {
      errors.push(`Notification ${index} has no channels`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function markAsTelemedicine(appointment) {
  return {
   ...appointment,
    type: 'telemedicine',
    isVideoConsultation: true,
    requiresIdentityVerification: true,
    joinUrl: generateJoinUrl(appointment._id, 'patient'),
    doctorJoinUrl: generateJoinUrl(appointment._id, 'doctor')
  };
}

function verifyPatientIdentity(patientId, verificationData) {
  const checks = {
    dateOfBirth: false,
    lastFourSSN: false,
    phoneVerification: false
  };
  if (verificationData.dateOfBirth) {
    checks.dateOfBirth = true;
  } 
  if (verificationData.lastFourSSN && verificationData.lastFourSSN.length === 4) {
    checks.lastFourSSN = true;
  }
  if (verificationData.phoneVerified) {
    checks.phoneVerification = true;
  }
  const passedChecks = Object.values(checks).filter(v => v).length;
  const isVerified = passedChecks >= 2;
  
  return {
    isVerified,
    checks,
    passedChecks,
    requiredChecks: 2
  };
}

function getNotificationSchedule(appointmentTime) {
  const schedule = [];
  const now = new Date();
  const reminder24h = new Date(appointmentTime);
  reminder24h.setHours(reminder24h.getHours() - 24);
  if (reminder24h > now) {
    schedule.push({
      type: NOTIFICATION_TYPES.REMINDER_24H,
      scheduledFor: reminder24h,
      hoursBeforeAppointment: 24
   });
  }
  const reminder15min = new Date(appointmentTime);
  reminder15min.setMinutes(reminder15min.getMinutes() - 15);
  if (reminder15min > now) {
   schedule.push({
      type: NOTIFICATION_TYPES.REMINDER_15MIN,
     scheduledFor: reminder15min,
      minutesBeforeAppointment: 15
    });
  }
  
  return schedule;
}

module.exports = {
  NOTIFICATION_TYPES,
  CHANNELS,
  scheduleNotifications,
  generateJoinUrl,
  generateSessionToken,
  validateNotificationSchedule,
  markAsTelemedicine,
  verifyPatientIdentity,
  getNotificationSchedule
};
