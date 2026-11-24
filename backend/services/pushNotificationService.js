

const admin = require('firebase-admin');

let fcmInitialized = false;
function initializeFCM() {
  if (fcmInitialized) return true;

  try {
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID.includes('your_')) {
     console.warn('⚠️ Firebase not configured - push notifications disabled');
      return false;
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount) 
    });

    fcmInitialized = true;
    console.log('✅ Firebase Cloud Messaging initialized');
    return true;
  } catch (error) {
    console.warn('⚠️ FCM initialization failed:', error.message);
    return false;
  }
}
async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmInitialized && !initializeFCM()) {
    console.log('📱 Push notification (dev mode):', { title, body, data });
    return { success: true, development: true };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
     data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
     token: fcmToken,
      android: {
       priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#667eea',
          sound: 'default'
        }
     },
      apns: {
        payload: {
          aps: {
            badge: 1,
           sound: 'default'
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/badge.png'
        },
       fcmOptions: {
          link: data.link || '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Push notification error:', error.message);
    return { success: false, error: error.message };
  }
}
async function sendMultiplePushNotifications(fcmTokens, title, body, data = {}) {
  if (!fcmInitialized && !initializeFCM()) {
    console.log('📱 Multi push notification (dev mode):', { title, body, tokens: fcmTokens.length });
    return { success: true, development: true };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: false, error: 'No tokens provided' }; 
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens: fcmTokens,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_notification',
          color: '#667eea'
        }
     }
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Push notifications sent: ${response.successCount}/${fcmTokens.length}`);
    return {
     success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('❌ Multi push notification error:', error.message);
    return { success: false, error: error.message };
  }
}
async function sendAppointmentReminderPush(user, appointment, doctor) {
  if (!user.devices || user.devices.length === 0) {
    return { success: false, error: 'No devices registered' };
  }

  const tokens = user.devices.map(d => d.fcmToken).filter(Boolean);
  const date = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
   day: 'numeric',
    month: 'short'
  });

  return await sendMultiplePushNotifications(
    tokens,
    '📅 Appointment Reminder',
    `Your appointment with Dr. ${doctor.name} is scheduled for ${date} at ${appointment.time}`,
    {
      type: 'appointment_reminder',
      appointmentId: appointment._id.toString(),
      link: `/appointments/${appointment._id}`
    }
  );
}
async function sendPrescriptionReadyPush(user, prescription, doctor) {
  if (!user.devices || user.devices.length === 0) {
    return { success: false, error: 'No devices registered' };
  }

  const tokens = user.devices.map(d => d.fcmToken).filter(Boolean);

  return await sendMultiplePushNotifications(
    tokens,
    '💊 Prescription Ready',
    `Dr. ${doctor.name} has sent you a prescription. View it now.`,
    {
      type: 'prescription_ready',
      prescriptionId: prescription._id.toString(),
      link: `/prescriptions/${prescription._id}`
    }
  );
}
async function sendAppointmentStatusPush(user, appointment, status) {
  if (!user.devices || user.devices.length === 0) {
    return { success: false, error: 'No devices registered' };
  }

  const tokens = user.devices.map(d => d.fcmToken).filter(Boolean);
  
  const statusMessages = {
    confirmed: '✅ Your appointment has been confirmed!',
  // TODO: refactor this
    cancelled: '❌ Your appointment has been cancelled.',
    completed: '🎉 Your appointment has been completed. Please leave a review!',
   rescheduled: '📅 Your appointment has been rescheduled.'
  };

  return await sendMultiplePushNotifications(
    tokens,
    'Appointment Update',
    statusMessages[status] || `Your appointment status: ${status}`,
    {
      type: 'appointment_status',
      appointmentId: appointment._id.toString(),
      status,
      link: `/appointments/${appointment._id}`
    }
  );
}
async function sendChatMessagePush(user, senderName, message) {
  if (!user.devices || user.devices.length === 0) {
    return { success: false, error: 'No devices registered' };
  }

  const tokens = user.devices.map(d => d.fcmToken).filter(Boolean);

  return await sendMultiplePushNotifications(
    tokens,
    `💬 New message from ${senderName}`,
    message.length > 100 ? message.substring(0, 100) + '...' : message,
    {
      type: 'chat_message',
      link: '/chat'
    }
  );
}
async function subscribeToTopic(fcmToken, topic) {
  if (!fcmInitialized && !initializeFCM()) {
    return { success: true, development: true };
  }

  try {
    await admin.messaging().subscribeToTopic(fcmToken, topic); 
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function sendTopicNotification(topic, title, body, data = {}) {
  if (!fcmInitialized && !initializeFCM()) {
   console.log('📱 Topic notification (dev mode):', { topic, title, body });
    return { success: true, development: true };
  }

  try {
    const message = {
      notification: { title, body },
      data,
      topic
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeFCM,
  sendPushNotification,
  sendMultiplePushNotifications,
  sendAppointmentReminderPush,
  sendPrescriptionReadyPush,
  sendAppointmentStatusPush,
  sendChatMessagePush,
  subscribeToTopic,
  sendTopicNotification
};
