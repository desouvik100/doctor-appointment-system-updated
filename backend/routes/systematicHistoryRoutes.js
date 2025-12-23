/**
 * Systematic History API Routes
 */

const express = require('express');
const router = express.Router();
const systematicHistoryService = require('../services/systematicHistoryService');
const doctorMatcherService = require('../services/doctorMatcherService');
const { verifyToken } = require('../middleware/auth');
const { 
  BODY_SYSTEMS, 
  COMMON_CONDITIONS, 
  COMMON_MEDICATIONS,
  DURATION_OPTIONS,
  SEVERITY_LABELS 
} = require('../config/systematicHistoryConfig');

// Get configuration (body systems, conditions, etc.) - public
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      bodySystems: BODY_SYSTEMS,
      commonConditions: COMMON_CONDITIONS,
      commonMedications: COMMON_MEDICATIONS,
      durationOptions: DURATION_OPTIONS,
      severityLabels: SEVERITY_LABELS
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new systematic history
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const historyData = req.body;
    
    const history = await systematicHistoryService.create(userId, historyData);
    
    // Generate AI recommendations
    const recommendations = doctorMatcherService.getRecommendations(history);
    await systematicHistoryService.saveRecommendations(history._id, recommendations);
    
    // Fetch updated history with recommendations
    const updatedHistory = await systematicHistoryService.getById(history._id);
    
    res.status(201).json({
      success: true,
      message: 'Systematic history created successfully',
      history: updatedHistory,
      recommendations
    });
  } catch (error) {
    console.error('Error creating systematic history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create systematic history',
      error: error.message 
    });
  }
});

// Get systematic history by appointment ID
router.get('/appointment/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const history = await systematicHistoryService.getByAppointment(appointmentId);
    
    if (!history) {
      return res.status(404).json({ 
        success: false, 
        message: 'No systematic history found for this appointment' 
      });
    }
    
    res.json({
      success: true,
      history,
      summary: history.generateSummary()
    });
  } catch (error) {
    console.error('Error fetching history by appointment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's latest systematic history
router.get('/user/:userId/latest', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const history = await systematicHistoryService.getLatestByUser(userId);
    
    res.json({
      success: true,
      history,
      hasHistory: !!history
    });
  } catch (error) {
    console.error('Error fetching latest history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all history versions for a user
router.get('/user/:userId/versions', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Verify user can access this data
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const histories = await systematicHistoryService.getUserHistoryVersions(userId, limit);
    
    res.json({
      success: true,
      histories,
      count: histories.length
    });
  } catch (error) {
    console.error('Error fetching history versions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get systematic history by ID
router.get('/:historyId', verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const history = await systematicHistoryService.getById(historyId);
    
    if (!history) {
      return res.status(404).json({ success: false, message: 'History not found' });
    }
    
    // Verify user can access this data
    const isOwner = history.userId._id.toString() === req.user.id;
    const isDoctor = req.user.role === 'doctor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({
      success: true,
      history,
      summary: history.generateSummary()
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update systematic history
router.put('/:historyId', verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const updates = req.body;
    const createNewVersion = req.query.newVersion === 'true';
    
    const history = await systematicHistoryService.update(historyId, updates, createNewVersion);
    
    // Regenerate AI recommendations if symptoms changed
    if (updates.general || updates.respiratory || updates.cardiovascular || 
        updates.gastrointestinal || updates.neurological || updates.musculoskeletal ||
        updates.skin || updates.endocrine || updates.genitourinary) {
      const recommendations = doctorMatcherService.getRecommendations(history);
      await systematicHistoryService.saveRecommendations(history._id, recommendations);
    }
    
    const updatedHistory = await systematicHistoryService.getById(history._id);
    
    res.json({
      success: true,
      message: createNewVersion ? 'New version created' : 'History updated',
      history: updatedHistory
    });
  } catch (error) {
    console.error('Error updating history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Mark history as completed
router.post('/:historyId/complete', verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const history = await systematicHistoryService.markCompleted(historyId);
    
    res.json({
      success: true,
      message: 'History marked as completed',
      history
    });
  } catch (error) {
    console.error('Error completing history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Link history to appointment
router.post('/:historyId/link/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { historyId, appointmentId } = req.params;
    const history = await systematicHistoryService.linkToAppointment(historyId, appointmentId);
    
    res.json({
      success: true,
      message: 'History linked to appointment',
      history
    });
  } catch (error) {
    console.error('Error linking history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get AI recommendations for symptoms
router.post('/recommendations', verifyToken, async (req, res) => {
  try {
    const historyData = req.body;
    const recommendations = doctorMatcherService.getRecommendations(historyData);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add attachment to history
router.post('/:historyId/attachments', verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    const attachment = req.body;
    
    const history = await systematicHistoryService.addAttachment(historyId, attachment);
    
    res.json({
      success: true,
      message: 'Attachment added',
      history
    });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get histories for clinic queue (batch)
router.post('/clinic-queue', verifyToken, async (req, res) => {
  try {
    const { appointmentIds } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return res.status(400).json({ success: false, message: 'appointmentIds array required' });
    }
    
    const historyMap = await systematicHistoryService.getForClinicQueue(appointmentIds);
    
    res.json({
      success: true,
      historyMap
    });
  } catch (error) {
    console.error('Error fetching clinic queue histories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete history
router.delete('/:historyId', verifyToken, async (req, res) => {
  try {
    const { historyId } = req.params;
    await systematicHistoryService.delete(historyId);
    
    res.json({
      success: true,
      message: 'History deleted'
    });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
