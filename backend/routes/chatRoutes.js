const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Get or create conversation between patient and doctor
router.post('/conversation', async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId } = req.body;

    // Check if conversation exists
    let conversation = await Conversation.findOne({ patientId, doctorId, isActive: true });

    if (!conversation) {
      // Get participant details
      const patient = await User.findById(patientId).select('name profilePhoto');
      const doctor = await Doctor.findById(doctorId).select('name profilePhoto');

      conversation = new Conversation({
        patientId,
        doctorId,
        appointmentId,
        participants: [
          {
            participantId: patientId,
            participantType: 'patient',
            participantName: patient?.name || 'Patient',
            participantPhoto: patient?.profilePhoto
          },
          {
            participantId: doctorId,
            participantType: 'doctor',
            participantName: doctor?.name || 'Doctor',
            participantPhoto: doctor?.profilePhoto
          }
        ]
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId/:userType', async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const query = userType === 'patient' ? { patientId: userId } : { doctorId: userId };
    query.isActive = true;

    const conversations = await Conversation.find(query)
      .populate('patientId', 'name email profilePhoto')
      .populate('doctorId', 'name specialization profilePhoto')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message
router.post('/message', async (req, res) => {
  try {
    const { conversationId, senderId, senderType, senderName, message, messageType, attachments, metadata } = req.body;

    const chatMessage = new ChatMessage({
      conversationId,
      senderId,
      senderType,
      senderName,
      message,
      messageType: messageType || 'text',
      attachments,
      metadata
    });
    await chatMessage.save();

    // Update conversation's last message
    const unreadField = senderType === 'patient' ? 'unreadCount.doctor' : 'unreadCount.patient';
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: message,
        senderId,
        senderType,
        timestamp: new Date()
      },
      $inc: { [unreadField]: 1 }
    });

    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.put('/messages/read/:conversationId/:userType', async (req, res) => {
  try {
    const { conversationId, userType } = req.params;
    const oppositeType = userType === 'patient' ? 'doctor' : 'patient';

    await ChatMessage.updateMany(
      { conversationId, senderType: oppositeType, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const unreadField = `unreadCount.${userType}`;
    await Conversation.findByIdAndUpdate(conversationId, { [unreadField]: 0 });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread count for user
router.get('/unread/:userId/:userType', async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const query = userType === 'patient' ? { patientId: userId } : { doctorId: userId };
    const unreadField = `unreadCount.${userType}`;

    const conversations = await Conversation.find(query).select(unreadField);
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount?.[userType] || 0), 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Close conversation
router.put('/conversation/:id/close', async (req, res) => {
  try {
    const { reason } = req.body;
    await Conversation.findByIdAndUpdate(req.params.id, {
      isActive: false,
      closedAt: new Date(),
      closedReason: reason
    });
    res.json({ message: 'Conversation closed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
