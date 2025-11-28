const express = require('express');
const router = express.Router();
const TokenService = require('../services/tokenService');
const Appointment = require('../models/Appointment');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/token/verify
 * Verify appointment token (Clinic/Admin side)
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const result = await TokenService.verifyToken(token);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/add-to-queue
 * Add verified appointment to queue
 */
router.post('/add-to-queue', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    const result = await TokenService.addToQueue(appointmentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/token/patient/:userId
 * Get patient's current appointment token
 */
router.get('/patient/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own token
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await TokenService.getPatientToken(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/token/queue/:doctorId
 * Get queue list for a doctor (Clinic/Admin side)
 */
router.get('/queue/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    // Verify user is admin or clinic staff
    if (req.user.role !== 'admin' && req.user.role !== 'clinic_staff') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await TokenService.getQueueList(doctorId, new Date(date));

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/mark-completed
 * Mark appointment as completed (Clinic/Admin side)
 */
router.post('/mark-completed', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    // Verify user is admin or clinic staff
    if (req.user.role !== 'admin' && req.user.role !== 'clinic_staff') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await TokenService.markAsCompleted(appointmentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/mark-no-show
 * Mark appointment as no-show (Clinic/Admin side)
 */
router.post('/mark-no-show', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Appointment ID is required'
      });
    }

    // Verify user is admin or clinic staff
    if (req.user.role !== 'admin' && req.user.role !== 'clinic_staff') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await TokenService.markAsNoShow(appointmentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/expire-old
 * Expire old tokens (Cron job or manual trigger)
 */
router.post('/expire-old', verifyToken, async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await TokenService.expireOldTokens();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
