/**
 * Refund Routes
 * Handles refund policy, preview, and processing
 */

const express = require('express');
const router = express.Router();
const refundPolicyService = require('../services/refundPolicyService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

/**
 * GET /api/refunds/policy
 * Get refund policy details (public)
 */
router.get('/policy', (req, res) => {
  try {
    const policy = refundPolicyService.getRefundPolicyDetails();
    res.json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Error fetching refund policy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/refunds/preview/:appointmentId
 * Preview refund amount before cancellation (authenticated)
 */
router.get('/preview/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancelledBy } = req.query;
    
    const preview = await refundPolicyService.previewRefund(
      appointmentId, 
      cancelledBy || 'patient'
    );
    
    res.json({
      success: true,
      preview
    });
  } catch (error) {
    console.error('Error previewing refund:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * POST /api/refunds/process
 * Process refund for cancelled appointment (authenticated)
 */
router.post('/process', verifyToken, async (req, res) => {
  try {
    const { appointmentId, cancelledBy, reason } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment ID is required' 
      });
    }
    
    const result = await refundPolicyService.processRefund(
      appointmentId,
      cancelledBy || 'patient',
      reason || ''
    );
    
    res.json({
      success: true,
      message: 'Refund processed according to policy',
      ...result
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * POST /api/refunds/request
 * Request refund (patient initiated)
 */
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    const userId = req.user.id || req.user._id;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment ID is required' 
      });
    }
    
    // Verify user owns this appointment
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    if (appointment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only request refund for your own appointments' 
      });
    }
    
    // Preview refund first
    const preview = await refundPolicyService.previewRefund(appointmentId, 'patient');
    
    // If eligible, process the refund
    if (preview.eligible) {
      const result = await refundPolicyService.processRefund(
        appointmentId,
        'patient',
        reason || 'Patient requested cancellation'
      );
      
      // Also cancel the appointment
      appointment.status = 'cancelled';
      appointment.cancellationReason = reason || 'Patient requested cancellation';
      appointment.cancelledBy = 'patient';
      appointment.cancelledAt = new Date();
      await appointment.save();
      
      res.json({
        success: true,
        message: `Refund of ₹${preview.refundAmount} will be processed`,
        refundDetails: result.refundCalculation,
        appointmentCancelled: true
      });
    } else {
      res.json({
        success: false,
        message: preview.reason,
        refundDetails: preview,
        appointmentCancelled: false
      });
    }
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * POST /api/refunds/doctor-cancel
 * Doctor cancels appointment (triggers full refund + compensation)
 */
router.post('/doctor-cancel', verifyTokenWithRole(['doctor', 'admin', 'receptionist']), async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment ID is required' 
      });
    }
    
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    // Process refund with doctor cancellation policy
    const result = await refundPolicyService.processRefund(
      appointmentId,
      'doctor',
      reason || 'Doctor cancelled the appointment'
    );
    
    // Cancel the appointment
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Doctor cancelled the appointment';
    appointment.cancelledBy = 'doctor';
    appointment.cancelledAt = new Date();
    await appointment.save();
    
    // Send notification to patient
    try {
      const { sendCancellationEmail } = require('../services/emailService');
      await sendCancellationEmail({
        recipientEmail: appointment.userId.email,
        recipientName: appointment.userId.name,
        recipientType: 'patient',
        doctorName: appointment.doctorId?.name,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        reason: appointment.cancellationReason,
        cancelledBy: 'doctor',
        refundAmount: result.refundCalculation.refundAmount,
        walletCredit: result.refundCalculation.walletCredit
      });
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError.message);
    }
    
    res.json({
      success: true,
      message: 'Appointment cancelled. Patient will receive full refund + ₹50 wallet credit.',
      refundDetails: result.refundCalculation,
      walletCreditAdded: result.walletCreditProcessed
    });
  } catch (error) {
    console.error('Error in doctor cancellation:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

/**
 * GET /api/refunds/history/:userId
 * Get refund history for a user (authenticated)
 */
router.get('/history/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id || req.user._id;
    
    // Users can only view their own history (unless admin)
    if (req.user.role !== 'admin' && userId !== requestingUserId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const Appointment = require('../models/Appointment');
    const refundedAppointments = await Appointment.find({
      userId: userId,
      paymentStatus: { $in: ['refunded', 'refund_requested'] }
    })
    .populate('doctorId', 'name specialization')
    .sort({ cancelledAt: -1 });
    
    const history = refundedAppointments.map(apt => ({
      appointmentId: apt._id,
      doctor: apt.doctorId?.name,
      date: apt.date,
      time: apt.time,
      originalAmount: apt.refundPolicy?.originalAmount || apt.paymentDetails?.amount,
      refundAmount: apt.refundDetails?.amount || apt.refundPolicy?.refundAmount,
      refundPercentage: apt.refundPolicy?.refundPercentage,
      policyApplied: apt.refundPolicy?.policyApplied,
      walletCredit: apt.refundPolicy?.walletCreditAmount,
      cancelledBy: apt.cancelledBy,
      cancelledAt: apt.cancelledAt,
      refundStatus: apt.refundDetails?.status || 'pending',
      reason: apt.cancellationReason
    }));
    
    res.json({
      success: true,
      refunds: history
    });
  } catch (error) {
    console.error('Error fetching refund history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
