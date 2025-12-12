const express = require('express');
const router = express.Router();
const razorpayService = require('../services/razorpayService');
const Appointment = require('../models/Appointment');
const { USE_RAZORPAY_PAYMENTS, RAZORPAY_KEY_ID, FRONTEND_URL } = require('../config/paymentConfig');
const { verifyToken } = require('../middleware/auth');

// Get payment calculation for appointment (authenticated users)
router.get('/calculate/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const breakdown = razorpayService.calculatePaymentBreakdown(appointment.doctorId.consultationFee);
    
    res.json({
      success: true,
      testMode: !USE_RAZORPAY_PAYMENTS,
      appointmentId,
      doctorName: appointment.doctorId.name,
      ...breakdown
    });
  } catch (error) {
    console.error('Payment calculation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Razorpay Order (authenticated users)
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    
    if (!appointmentId || !userId) {
      return res.status(400).json({ message: 'Appointment ID and User ID are required' });
    }

    // If Razorpay is disabled, return test mode response
    if (!USE_RAZORPAY_PAYMENTS) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        appointment.paymentStatus = 'completed';
        appointment.status = 'confirmed';
        appointment.paymentDetails = {
          testMode: true,
          amount: 0,
          paidAt: new Date()
        };
        await appointment.save();
      }
      
      return res.json({
        success: true,
        testMode: true,
        message: 'Razorpay disabled - appointment confirmed in test mode',
        appointmentId
      });
    }
    
    const orderData = await razorpayService.createOrder(appointmentId, userId);
    
    res.json({
      success: true,
      message: 'Order created successfully',
      ...orderData
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order', 
      error: error.message 
    });
  }
});

// Verify Razorpay Payment
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;
    
    // If Razorpay is disabled, return test mode response
    if (!USE_RAZORPAY_PAYMENTS) {
      return res.json({
        success: true,
        testMode: true,
        message: 'Razorpay disabled - payment verification skipped in test mode'
      });
    }
    
    const result = await razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Payment verified successfully' : 'Payment verification failed',
      ...result
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment verification failed', 
      error: error.message 
    });
  }
});

// Get payment history for user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const paymentHistory = await razorpayService.getPaymentHistory(userId);
    
    res.json({
      success: true,
      payments: paymentHistory
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history', 
      error: error.message 
    });
  }
});

// Process refund
router.post('/refund', async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }
    
    const result = await razorpayService.processRefund(appointmentId, reason);
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process refund', 
      error: error.message 
    });
  }
});

// Get Razorpay config for frontend
router.get('/config', (req, res) => {
  const config = razorpayService.getConfig();
  res.json(config);
});

// Get payment status for an appointment
router.get('/status/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .select('paymentStatus status paymentDetails');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json({
      success: true,
      appointmentId,
      paymentStatus: appointment.paymentStatus,
      status: appointment.status,
      paidAt: appointment.paymentDetails?.paidAt
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
