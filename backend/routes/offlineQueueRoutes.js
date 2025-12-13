/**
 * Offline Queue Token API Routes
 * Requirement 2: Offline-First Queue Token System
 */

const express = require('express');
const router = express.Router();
const OfflineQueueToken = require('../models/OfflineQueueToken');
const whatsappService = require('../services/whatsappService');
const { authenticate, checkRole } = require('../middleware/roleMiddleware');

// Generate new token (walk-in or booking)
router.post('/token', authenticate, async (req, res) => {
  try {
    const {
      clinicId, doctorId, patientName, patientPhone,
      bookingType, appointmentId, tokenPrefix, priority, notes
    } = req.body;
    
    const token = await OfflineQueueToken.createToken({
      clinicId,
      doctorId,
      patientId: req.user?.id,
      patientName,
      patientPhone,
      bookingType: bookingType || 'walk_in',
      appointmentId,
      tokenPrefix: tokenPrefix || 'A',
      priority: priority || 'normal',
      notes
    });
    
    // Send SMS/WhatsApp notification
    await whatsappService.sendTextMessage(patientPhone,
      `🎫 *Token Issued*\n\nYour token: *${token.displayToken}*\n📊 Position: ${token.queuePosition}\n⏱️ Est. Wait: ~${token.estimatedWaitTime} min\n\nWe'll notify you when it's your turn.\n\n- HealthSyncPro`
    );
    
    res.status(201).json({
      message: 'Token generated',
      token: {
        id: token._id,
        displayToken: token.displayToken,
        queuePosition: token.queuePosition,
        estimatedWaitTime: token.estimatedWaitTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync offline tokens
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { tokens, deviceId } = req.body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ message: 'Tokens array required' });
    }
    
    const results = await OfflineQueueToken.syncOfflineTokens(tokens, deviceId);
    
    res.json({
      message: 'Sync completed',
      synced: results.synced.length,
      conflicts: results.conflicts.length,
      errors: results.errors.length,
      details: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current queue for clinic/doctor
router.get('/queue/:clinicId/:doctorId', async (req, res) => {
  try {
    const { clinicId, doctorId } = req.params;
    const queue = await OfflineQueueToken.getCurrentQueue(clinicId, doctorId);
    
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get queue display data (for waiting room TV)
router.get('/display/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all doctors' queues for this clinic
    const tokens = await OfflineQueueToken.find({
      clinicId,
      tokenDate: { $gte: today },
      status: { $in: ['waiting', 'called', 'in_consultation'] }
    })
    .populate('doctorId', 'name specialization')
    .sort({ doctorId: 1, priority: -1, tokenNumber: 1 });
    
    // Group by doctor
    const queuesByDoctor = {};
    tokens.forEach(token => {
      const doctorId = token.doctorId?._id?.toString() || 'unknown';
      if (!queuesByDoctor[doctorId]) {
        queuesByDoctor[doctorId] = {
          doctor: token.doctorId,
          currentToken: null,
          waitingTokens: []
        };
      }
      
      if (token.status === 'in_consultation' || token.status === 'called') {
        queuesByDoctor[doctorId].currentToken = token.displayToken;
      } else {
        queuesByDoctor[doctorId].waitingTokens.push(token.displayToken);
      }
    });
    
    res.json({
      clinicId,
      timestamp: new Date(),
      queues: Object.values(queuesByDoctor)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Call next patient
router.post('/call-next/:clinicId/:doctorId', authenticate, async (req, res) => {
  try {
    const { clinicId, doctorId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find next waiting token (priority first, then by token number)
    const nextToken = await OfflineQueueToken.findOne({
      clinicId,
      doctorId,
      tokenDate: { $gte: today },
      status: 'waiting'
    }).sort({ priority: -1, tokenNumber: 1 });
    
    if (!nextToken) {
      return res.status(404).json({ message: 'No patients waiting' });
    }
    
    nextToken.callPatient();
    await nextToken.save();
    
    // Send notification
    await whatsappService.sendQueueUpdate(nextToken.patientPhone, {
      patientName: nextToken.patientName,
      tokenNumber: nextToken.displayToken,
      position: 0,
      estimatedWait: 0,
      doctorName: 'Doctor'
    });
    
    res.json({
      message: 'Patient called',
      token: nextToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start consultation
router.post('/:tokenId/start', authenticate, async (req, res) => {
  try {
    const token = await OfflineQueueToken.findById(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    token.startConsultation();
    await token.save();
    
    // Update queue positions for waiting patients
    await updateQueuePositions(token.clinicId, token.doctorId);
    
    res.json({ message: 'Consultation started', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete consultation
router.post('/:tokenId/complete', authenticate, async (req, res) => {
  try {
    const token = await OfflineQueueToken.findById(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    token.completeConsultation();
    await token.save();
    
    // Update queue positions
    await updateQueuePositions(token.clinicId, token.doctorId);
    
    // Notify next few patients
    await notifyUpcomingPatients(token.clinicId, token.doctorId);
    
    res.json({ message: 'Consultation completed', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as no-show
router.post('/:tokenId/no-show', authenticate, async (req, res) => {
  try {
    const token = await OfflineQueueToken.findById(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    token.markNoShow();
    await token.save();
    
    await updateQueuePositions(token.clinicId, token.doctorId);
    
    res.json({ message: 'Marked as no-show', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Skip patient
router.post('/:tokenId/skip', authenticate, async (req, res) => {
  try {
    const token = await OfflineQueueToken.findById(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }
    
    token.skipPatient();
    await token.save();
    
    // Send notification
    await whatsappService.sendTextMessage(token.patientPhone,
      `⏭️ *Skipped*\n\nToken: ${token.displayToken}\n\nYou were not present when called. Please inform the reception when you arrive.\n\n- HealthSyncPro`
    );
    
    res.json({ message: 'Patient skipped', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Recall skipped patient
router.post('/:tokenId/recall', authenticate, async (req, res) => {
  try {
    const token = await OfflineQueueToken.findById(req.params.tokenId);
    
    if (!token || token.status !== 'skipped') {
      return res.status(404).json({ message: 'Skipped token not found' });
    }
    
    token.status = 'waiting';
    token.priority = 'priority'; // Give them priority
    await token.save();
    
    await updateQueuePositions(token.clinicId, token.doctorId);
    
    res.json({ message: 'Patient recalled to queue', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient's token status
router.get('/my-token', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const token = await OfflineQueueToken.findOne({
      patientId: req.user.id,
      tokenDate: { $gte: today },
      status: { $nin: ['completed', 'cancelled', 'no_show'] }
    }).populate('doctorId', 'name specialization');
    
    if (!token) {
      return res.json(null);
    }
    
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get token by phone (for patients without account)
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tokens = await OfflineQueueToken.find({
      patientPhone: req.params.phone,
      tokenDate: { $gte: today },
      status: { $nin: ['completed', 'cancelled', 'no_show'] }
    }).populate('doctorId', 'name specialization');
    
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get queue statistics for clinic
router.get('/stats/:clinicId', authenticate, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tokens = await OfflineQueueToken.find({
      clinicId,
      tokenDate: { $gte: today }
    });
    
    const stats = {
      total: tokens.length,
      waiting: tokens.filter(t => t.status === 'waiting').length,
      inConsultation: tokens.filter(t => t.status === 'in_consultation').length,
      completed: tokens.filter(t => t.status === 'completed').length,
      noShow: tokens.filter(t => t.status === 'no_show').length,
      cancelled: tokens.filter(t => t.status === 'cancelled').length,
      avgConsultationTime: calculateAvgConsultationTime(tokens),
      avgWaitTime: calculateAvgWaitTime(tokens)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper: Update queue positions
async function updateQueuePositions(clinicId, doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const waitingTokens = await OfflineQueueToken.find({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    status: 'waiting'
  }).sort({ priority: -1, tokenNumber: 1 });
  
  const avgTime = 10; // minutes per patient
  
  for (let i = 0; i < waitingTokens.length; i++) {
    waitingTokens[i].queuePosition = i + 1;
    waitingTokens[i].estimatedWaitTime = (i + 1) * avgTime;
    await waitingTokens[i].save();
  }
}

// Helper: Notify upcoming patients
async function notifyUpcomingPatients(clinicId, doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingTokens = await OfflineQueueToken.find({
    clinicId,
    doctorId,
    tokenDate: { $gte: today },
    status: 'waiting',
    queuePosition: { $lte: 3 }
  }).populate('doctorId', 'name');
  
  for (const token of upcomingTokens) {
    // Check if we already sent "your turn soon" notification
    const alreadyNotified = token.notifications.some(n => 
      n.type === 'your_turn_soon' && 
      Date.now() - n.sentAt < 30 * 60 * 1000 // within 30 min
    );
    
    if (!alreadyNotified) {
      await whatsappService.sendQueueUpdate(token.patientPhone, {
        patientName: token.patientName,
        tokenNumber: token.displayToken,
        position: token.queuePosition,
        estimatedWait: token.estimatedWaitTime,
        doctorName: token.doctorId?.name || 'Doctor'
      });
      
      token.notifications.push({
        type: 'your_turn_soon',
        sentAt: new Date(),
        status: 'sent',
        channel: 'whatsapp'
      });
      await token.save();
    }
  }
}

// Helper: Calculate average consultation time
function calculateAvgConsultationTime(tokens) {
  const completed = tokens.filter(t => t.consultationDuration);
  if (completed.length === 0) return 0;
  
  const total = completed.reduce((sum, t) => sum + t.consultationDuration, 0);
  return Math.round(total / completed.length);
}

// Helper: Calculate average wait time
function calculateAvgWaitTime(tokens) {
  const completed = tokens.filter(t => t.consultationStartedAt && t.issuedAt);
  if (completed.length === 0) return 0;
  
  const total = completed.reduce((sum, t) => {
    return sum + (t.consultationStartedAt - t.issuedAt) / (1000 * 60);
  }, 0);
  return Math.round(total / completed.length);
}

module.exports = router;
