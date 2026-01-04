/**
 * WhatsApp Business API Routes
 * Webhook for receiving messages and status updates
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Webhook verification (GET request from Meta)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'healthsync_whatsapp_verify';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook for receiving messages and status updates (POST)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry) => {
        entry.changes?.forEach((change) => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle incoming messages
            if (value.messages) {
              value.messages.forEach((message) => {
                handleIncomingMessage(message, value.contacts?.[0]);
              });
            }
            
            // Handle message status updates
            if (value.statuses) {
              value.statuses.forEach((status) => {
                handleStatusUpdate(status);
              });
            }
          }
        });
      });

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(message, contact) {
  const from = message.from;
  const messageType = message.type;
  const timestamp = message.timestamp;

  console.log(`📩 WhatsApp message from ${from}:`, message);

  // Handle different message types
  if (messageType === 'text') {
    const text = message.text.body.toLowerCase().trim();
    
    // Auto-reply for common queries
    if (text === 'hi' || text === 'hello' || text === 'hey') {
      await whatsappService.sendTextMessage(from, 
        `👋 Hello! Welcome to HealthSync.

How can I help you today?

Reply with:
1️⃣ - Book Appointment
2️⃣ - Check Appointments
3️⃣ - Contact Support

Or download our app for the full experience! 📱`
      );
    } else if (text === '1') {
      await whatsappService.sendTextMessage(from,
        `📅 To book an appointment, please use our HealthSync app.

Download now:
🤖 Android: [Play Store Link]
🍎 iOS: [App Store Link]

Or visit: https://healthsyncpro.in`
      );
    } else if (text === '2') {
      await whatsappService.sendTextMessage(from,
        `📋 To check your appointments, please log in to the HealthSync app.

Your upcoming appointments and history are available in the "My Appointments" section.`
      );
    } else if (text === '3') {
      await whatsappService.sendTextMessage(from,
        `📞 *HealthSync Support*

📧 Email: support@healthsyncpro.in
📱 Phone: +91-XXXXXXXXXX
🌐 Website: https://healthsyncpro.in

Our support team is available Mon-Sat, 9 AM - 6 PM IST.`
      );
    }
  } else if (messageType === 'interactive') {
    // Handle button/list replies
    const interactiveType = message.interactive.type;
    if (interactiveType === 'button_reply') {
      const buttonId = message.interactive.button_reply.id;
      console.log(`Button clicked: ${buttonId}`);
    } else if (interactiveType === 'list_reply') {
      const listId = message.interactive.list_reply.id;
      console.log(`List item selected: ${listId}`);
    }
  }
}

/**
 * Handle message status updates
 */
function handleStatusUpdate(status) {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp;
  const recipientId = status.recipient_id;

  console.log(`📊 Message ${messageId} status: ${statusType}`);

  // You can store these status updates in database for tracking
  if (statusType === 'failed') {
    const errors = status.errors;
    console.error(`❌ Message failed:`, errors);
  }
}

// Test endpoint to send a message
router.post('/send-test', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    const result = await whatsappService.sendTextMessage(phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint using hello_world template (pre-approved)
router.post('/send-template-test', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    // Use hello_world template which is pre-approved
    const result = await whatsappService.sendTemplateMessage(phone, 'hello_world', 'en_US');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check WhatsApp configuration status
router.get('/status', (req, res) => {
  const configured = whatsappService.isWhatsAppConfigured();
  
  res.json({
    configured,
    message: configured 
      ? '✅ WhatsApp Business API is configured' 
      : '⚠️ WhatsApp Business API not configured',
    requiredEnvVars: [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_VERIFY_TOKEN'
    ]
  });
});

module.exports = router;
