const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin if not already done
let firebaseInitialized = false;
try {
  if (!admin.apps.length) {
    // Try to load service account from file first, then env variable
    let serviceAccount = null;
    
    try {
      serviceAccount = require('../firebase-service-account.json');
      console.log('✅ Firebase service account loaded from file');
    } catch (e) {
      // Try environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase service account loaded from env');
      }
    }
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized for push notifications');
    } else {
      console.log('⚠️ Firebase service account not configured - push notifications disabled');
    }
  } else {
    firebaseInitialized = true;
  }
} catch (error) {
  console.log('⚠️ Firebase Admin init error:', error.message);
}

/**
 * Register device for push notifications
 */
router.post('/register-device', async (req, res) => {
  try {
    const { fcmToken, platform, deviceInfo } = req.body;
    const userId = req.user?.id || req.body.userId;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Find user and update/add device
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if device already exists
    const existingDeviceIndex = user.devices?.findIndex(d => d.fcmToken === fcmToken);
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      user.devices[existingDeviceIndex].lastActive = new Date();
      user.devices[existingDeviceIndex].platform = platform;
    } else {
      // Add new device
      if (!user.devices) user.devices = [];
      user.devices.push({
        fcmToken,
        platform,
        deviceId: deviceInfo?.deviceId || `${platform}-${Date.now()}`,
        lastActive: new Date()
      });
    }
    
    // Also store the latest token directly for quick access
    user.fcmToken = fcmToken;
    await user.save();

    console.log(`📱 Device registered for user ${userId}: ${fcmToken.substring(0, 20)}...`);
    res.json({ success: true, message: 'Device registered for notifications' });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Update notification settings
 */
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const settings = req.body;
    
    await User.findByIdAndUpdate(userId, {
      $set: { notificationSettings: settings }
    });

    res.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Send push notification to a user
 */
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    const user = await User.findById(userId);
    if (!user?.fcmToken) {
      return res.status(400).json({ message: 'User has no registered device' });
    }

    const result = await sendPushNotification(user.fcmToken, title, body, data);
    
    // Also save to database
    await new Notification({
      userId,
      title,
      message: body,
      type: data?.type || 'system',
      data
    }).save();

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Send push notification to multiple users
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;
    
    const users = await User.find({ _id: { $in: userIds }, fcmToken: { $exists: true, $ne: null } });
    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    
    if (tokens.length === 0) {
      return res.status(400).json({ message: 'No registered devices found' });
    }

    const result = await sendBulkPushNotification(tokens, title, body, data);
    
    // Save notifications to database
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message: body,
      type: data?.type || 'system',
      data
    }));
    await Notification.insertMany(notifications);

    res.json({ success: true, sent: tokens.length, result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to send push notification
async function sendPushNotification(token, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.log('📱 [Mock] Push notification:', { token: token?.substring(0, 20), title, body });
    return { success: true, mock: true };
  }

  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: {
          channelId: 'healthsync-channel',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('📱 Push notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to send bulk push notifications
async function sendBulkPushNotification(tokens, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.log('📱 [Mock] Bulk push notification:', { count: tokens.length, title, body });
    return { success: true, mock: true, count: tokens.length };
  }

  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: {
          channelId: 'healthsync-channel',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      ...message
    });
    
    console.log(`📱 Bulk push sent: ${response.successCount}/${tokens.length} successful`);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('Bulk push error:', error);
    return { success: false, error: error.message };
  }
}

// Export helper for use in other modules
module.exports.sendPushNotification = sendPushNotification;
module.exports.sendBulkPushNotification = sendBulkPushNotification;

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         type:
 *           type: string
 *           enum: [appointment, reminder, system, promotion]
 *         isRead:
 *           type: boolean
 *         readAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     description: Retrieves paginated notifications for a specific user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: number
 *                 unreadCount:
 *                   type: number
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ notifications, total, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /notifications/read-all/{userId}:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all/:userId', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all notifications for user
router.delete('/clear/:userId', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread count
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Schedule appointment reminders (called by cron job or manually)
router.post('/schedule-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find appointments for tomorrow
    const appointments = await Appointment.find({
      date: { $gte: tomorrow, $lt: dayAfter },
      status: 'approved'
    }).populate('doctor', 'name').populate('user', 'name');

    const notifications = [];
    for (const apt of appointments) {
      // Check if reminder already exists
      const exists = await Notification.findOne({
        'data.appointmentId': apt._id,
        type: 'appointment_reminder'
      });

      if (!exists) {
        notifications.push({
          userId: apt.user._id,
          userType: 'patient',
          title: 'Appointment Reminder',
          message: `Your appointment with Dr. ${apt.doctor?.name} is tomorrow at ${apt.time}`,
          type: 'appointment_reminder',
          priority: 'high',
          data: { appointmentId: apt._id, doctorId: apt.doctor?._id }
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: `Scheduled ${notifications.length} reminders` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Test push notification - sends a test notification to a user
 * GET /notifications/test/:userId
 */
router.get('/test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fcmToken = user.fcmToken || user.devices?.[0]?.fcmToken;
    
    if (!fcmToken) {
      return res.status(400).json({ 
        message: 'No FCM token registered for this user',
        hint: 'User needs to open the mobile app first to register their device'
      });
    }

    // Send test push notification
    const title = '🔔 Test Notification';
    const body = `Hello ${user.name}! This is a test push notification from HealthSync.`;
    const data = { type: 'test', timestamp: Date.now().toString() };

    const result = await sendPushNotification(fcmToken, title, body, data);

    // Also save to database
    const notification = new Notification({
      userId,
      title,
      message: body,
      type: 'system',
      data
    });
    await notification.save();

    res.json({ 
      success: true, 
      message: 'Test notification sent!',
      fcmToken: fcmToken.substring(0, 30) + '...',
      result 
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Test local notification trigger (for mobile app testing)
 * POST /notifications/test-local
 */
router.post('/test-local', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    // Just save to database - mobile app will fetch and display
    const notification = new Notification({
      userId,
      title: title || '🧪 Test Notification',
      message: body || 'This is a test notification!',
      type: 'system',
      data: { type: 'test', timestamp: Date.now() }
    });
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
