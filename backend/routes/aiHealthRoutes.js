

const express = require('express');
const router = express.Router();
const aiHealthService = require('../services/aiHealthService');
router.get('/health-insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await aiHealthService.getPredictiveHealthInsights(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/match-doctor', async (req, res) => {
  try {
    const { symptoms, location, preferences } = req.body;
    if (!symptoms) {
      return res.status(400).json({ success: false, error: 'Symptoms required' });
    }
    const result = await aiHealthService.smartDoctorMatch(symptoms, location, preferences);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/parse-notes', async (req, res) => {
  try {
    const { notes, doctorName, patientName } = req.body;
    if (!notes) {
      return res.status(400).json({ success: false, error: 'Notes required' });
    }

    const structured = aiHealthService.parseConsultationNotes(notes);
    const template = aiHealthService.generatePrescriptionTemplate(
      structured, 
      doctorName || 'Doctor', 
      patientName || 'Patient'
    );
    
    res.json({ 
      success: true, 
      structured, 
      prescriptionTemplate: template 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text required' });
    }
    
    const sentiment = aiHealthService.analyzeSentiment(text);
    const aspects = aiHealthService.extractAspects(text);
    
    res.json({ success: true, sentiment, aspects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/doctor-reviews/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await aiHealthService.analyzeDoctorReviews(doctorId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/reschedule-slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { originalDate } = req.query;
    const result = await aiHealthService.findOptimalRescheduleSlots(doctorId, originalDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/analyze-report', async (req, res) => {
  try {
    const { reportData } = req.body;
    if (!reportData || Object.keys(reportData).length === 0) {
      return res.status(400).json({ success: false, error: 'Report data required' });
    }
    
    const analysis = aiHealthService.analyzeHealthReport(reportData);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/normal-ranges', (req, res) => {
  res.json({ success: true, ranges: aiHealthService.normalRanges });
});
router.post('/track-metric', async (req, res) => {
  try {
    const { userId, metric, value } = req.body;
    const result = await aiHealthService.trackHealthMetrics(userId, metric, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
