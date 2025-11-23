const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Get payment calculation for appointment
router.get('/calculate/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const breakdown = paymentService.calculatePaymentBreakdown(appointment.doctorId.consultationFee);
    
    res.json({
      success: true,
      appointmentId,
      doctorName: appointment.doctorId.name,
      ...breakdown
    });
  } catch (error) {
    console.error('Payment calculation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Stripe Payment Intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    
    if (!appointmentId || !userId) {
      return res.status(400).json({ message: 'Appointment ID and User ID are required' });
    }
    
    const paymentData = await paymentService.createPaymentIntent(appointmentId, userId);
    
    res.json({
      success: true,
      message: 'Payment intent created successfully',
      ...paymentData
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
});

// Confirm payment completion
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment Intent ID is required' });
    }
    
    const result = await paymentService.confirmPayment(paymentIntentId);
    
    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      ...result
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to confirm payment', 
      error: error.message 
    });
  }
});

// Get payment history for user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const paymentHistory = await paymentService.getPaymentHistory(userId);
    
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
    
    const result = await paymentService.processRefund(appointmentId, reason);
    
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

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    await paymentService.handleWebhook(req.body, signature);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Stripe publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;