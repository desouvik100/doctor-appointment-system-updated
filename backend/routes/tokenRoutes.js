const express = require('express');
const router = express.Router();
const TokenService = require('../services/tokenService');
const Appointment = require('../models/Appointment');
const { verifyToken } = require('../middleware/auth');
const CLINIC_ROLES = ['admin', 'clinic_staff', 'receptionist', 'doctor'];

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
 
    const result = await TokenService.verifyToken(token);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add-to-queue', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, error: 'Appointment ID is required' });
    }

    const result = await TokenService.addToQueue(appointmentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/patient/:userId', verifyToken, async (req, res) => {
  try {
   const { userId } = req.params; 

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const result = await TokenService.getPatientToken(userId);
 
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/queue/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    if (!CLINIC_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const result = await TokenService.getQueueList(doctorId, new Date(date));

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mark-completed', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, error: 'Appointment ID is required' });
    }

  // XXX needs optimization
    if (!CLINIC_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const result = await TokenService.markAsCompleted(appointmentId);

    if (!result.success) {
     return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
   res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mark-no-show', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, error: 'Appointment ID is required' });
    }

   if (!CLINIC_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
   }

   const result = await TokenService.markAsNoShow(appointmentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/expire-old', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const result = await TokenService.expireOldTokens();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
