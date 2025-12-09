// backend/routes/aiRoutes.js
// AI-Powered Features API Routes

const express = require('express');
const router = express.Router();

const {
  predictWaitTime,
  getDoctorAverageConsultationTime,
  predictNoShowRisk,
  getOptimalSlots,
  suggestBestAppointmentTime
} = require('../services/aiPredictionService');

const {
  processMessage,
  getQuickReplies
} = require('../services/aiChatbotService');

/**
 * ============================================
 * SMART WAIT TIME PREDICTION
 * ============================================
 */

// Get predicted wait time for a queue position
router.get('/predict-wait/:doctorId/:position', async (req, res) => {
  try {
    const { doctorId, position } = req.params;
    const prediction = await predictWaitTime(doctorId, parseInt(position));
    
    res.json({
      success: true,
      ...prediction
    });
  } catch (error) {
    console.error('Error predicting wait time:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get doctor's average consultation time
router.get('/doctor-avg-time/:doctorId', async (req, res) => {
  try {
    const avgTime = await getDoctorAverageConsultationTime(req.params.doctorId);
    res.json({
      success: true,
      averageConsultationTime: avgTime,
      unit: 'minutes'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ============================================
 * NO-SHOW PREDICTION
 * ============================================
 */

// Get no-show risk for a patient
router.post('/no-show-risk', async (req, res) => {
  try {
    const { userId, appointmentDetails } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }
    
    const risk = await predictNoShowRisk(userId, appointmentDetails);
    
    res.json({
      success: true,
      ...risk
    });
  } catch (error) {
    console.error('Error predicting no-show risk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch no-show risk for multiple appointments (for doctors)
router.post('/batch-no-show-risk', async (req, res) => {
  try {
    const { appointments } = req.body;
    
    if (!appointments || !Array.isArray(appointments)) {
      return res.status(400).json({ success: false, message: 'Appointments array required' });
    }
    
    const results = await Promise.all(
      appointments.map(async (apt) => ({
        appointmentId: apt._id,
        userId: apt.userId,
        risk: await predictNoShowRisk(apt.userId, apt)
      }))
    );
    
    res.json({
      success: true,
      results,
      summary: {
        highRisk: results.filter(r => r.risk.riskLevel === 'high').length,
        mediumRisk: results.filter(r => r.risk.riskLevel === 'medium').length,
        lowRisk: results.filter(r => r.risk.riskLevel === 'low').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ============================================
 * SMART SCHEDULING OPTIMIZATION
 * ============================================
 */

// Get optimal appointment slots for a doctor on a date
router.get('/optimal-slots/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const slots = await getOptimalSlots(doctorId, date);
    
    res.json({
      success: true,
      ...slots
    });
  } catch (error) {
    console.error('Error getting optimal slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI-suggested best appointment time
router.post('/suggest-time', async (req, res) => {
  try {
    const { doctorId, patientId, preferredDate } = req.body;
    
    if (!doctorId || !preferredDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID and preferred date required' 
      });
    }
    
    const suggestion = await suggestBestAppointmentTime(doctorId, patientId, preferredDate);
    
    res.json({
      success: true,
      ...suggestion
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ============================================
 * AI CHATBOT
 * ============================================
 */

// Process chatbot message
router.post('/chat', async (req, res) => {
  try {
    const { message, userId, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    const response = await processMessage(message, userId, conversationHistory);
    
    res.json(response);
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      success: false, 
      response: "I'm having trouble right now. Please try again.",
      error: error.message 
    });
  }
});

// Get quick reply options
router.get('/chat/quick-replies', (req, res) => {
  res.json({
    success: true,
    quickReplies: getQuickReplies()
  });
});

// Get chatbot welcome message
router.get('/chat/welcome', (req, res) => {
  res.json({
    success: true,
    message: "👋 Hello! I'm your HealthSync AI assistant. How can I help you today?",
    suggestions: [
      "Book an appointment",
      "Find a doctor",
      "Check my queue status",
      "Clinic timings",
      "Help"
    ]
  });
});

module.exports = router;
