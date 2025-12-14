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
      paymentsEnabled: USE_RAZORPAY_PAYMENTS,
      testMode: !USE_RAZORPAY_PAYMENTS, // Only true when payments are DISABLED
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

// Razorpay Webhook - for payment confirmations (backup verification)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const crypto = require('crypto');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('❌ Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }
    
    const event = req.body;
    console.log('📥 Razorpay webhook received:', event.event);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        
        // Find appointment by order ID and update status
        const appointment = await Appointment.findOne({ razorpayOrderId: orderId });
        if (appointment && appointment.paymentStatus !== 'completed') {
          appointment.paymentStatus = 'completed';
          appointment.status = 'confirmed';
          appointment.razorpayPaymentId = payment.id;
          appointment.paymentDetails = {
            razorpayOrderId: orderId,
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            method: payment.method,
            status: 'captured',
            paidAt: new Date()
          };
          await appointment.save();
          console.log(`✅ Webhook: Payment confirmed for appointment ${appointment._id}`);
        }
        break;
        
      case 'payment.failed':
        const failedPayment = event.payload.payment.entity;
        const failedOrderId = failedPayment.order_id;
        
        const failedAppointment = await Appointment.findOne({ razorpayOrderId: failedOrderId });
        if (failedAppointment && failedAppointment.status === 'pending_payment') {
          failedAppointment.paymentStatus = 'failed';
          failedAppointment.status = 'cancelled';
          failedAppointment.cancellationReason = 'Payment failed';
          failedAppointment.cancelledBy = 'system';
          failedAppointment.cancelledAt = new Date();
          await failedAppointment.save();
          console.log(`❌ Webhook: Payment failed for appointment ${failedAppointment._id}`);
        }
        break;
        
      case 'refund.created':
        const refund = event.payload.refund.entity;
        console.log(`💰 Refund created: ${refund.id} for payment ${refund.payment_id}`);
        break;
        
      default:
        console.log(`📌 Unhandled webhook event: ${event.event}`);
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
