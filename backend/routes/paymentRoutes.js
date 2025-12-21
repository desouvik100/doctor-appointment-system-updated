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
    const { appointmentId, userId, couponCode } = req.body;
    
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
    
    const orderData = await razorpayService.createOrder(appointmentId, userId, couponCode);
    
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
    
    // Send invoice email after successful payment
    if (result.success && appointmentId) {
      try {
        const { generateAndSendInvoice } = require('../services/invoiceService');
        
        // Fetch populated appointment for invoice
        const populatedAppointment = await Appointment.findById(appointmentId)
          .populate('userId', 'name email phone')
          .populate('doctorId', 'name specialization consultationFee email')
          .populate('clinicId', 'name address');
        
        if (populatedAppointment && populatedAppointment.userId?.email) {
          const paymentDetails = result.paymentDetails || populatedAppointment.paymentDetails;
          const consultationFee = populatedAppointment.doctorId?.consultationFee || 500;
          const platformFee = Math.round(consultationFee * 0.05); // 5% platform fee
          const totalAmount = consultationFee + platformFee;
          
          const invoiceResult = await generateAndSendInvoice(
            populatedAppointment,
            populatedAppointment.userId,
            populatedAppointment.doctorId,
            populatedAppointment.clinicId,
            {
              consultationFee,
              platformFee,
              tax: 0,
              totalAmount,
              status: 'paid',
              paymentMethod: paymentDetails?.method || 'Razorpay',
              transactionId: razorpay_payment_id
            }
          );
          
          if (invoiceResult?.success) {
            console.log(`✅ Invoice ${invoiceResult.invoiceNumber} sent to ${populatedAppointment.userId.email}`);
            // Save invoice number to appointment
            populatedAppointment.invoiceNumber = invoiceResult.invoiceNumber;
            await populatedAppointment.save();
          } else {
            console.error('❌ Invoice sending failed:', invoiceResult?.error);
          }
        }
      } catch (invoiceError) {
        console.error('❌ Error sending invoice after payment:', invoiceError.message);
        // Don't fail the payment verification if invoice fails
      }
    }
    
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

// Razorpay Callback - for Android app redirect flow
router.get('/razorpay-callback', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.query;
    
    console.log('📱 Razorpay callback received:', { razorpay_order_id, razorpay_payment_id, appointmentId });
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      // Redirect to app with error
      return res.redirect(`healthsync://payment-failed?error=Missing payment details&appointmentId=${appointmentId || ''}`);
    }
    
    // Verify the payment
    const result = await razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId
    });
    
    if (result.success) {
      // Redirect to app with success
      const successUrl = `healthsync://payment-success?razorpay_order_id=${razorpay_order_id}&razorpay_payment_id=${razorpay_payment_id}&razorpay_signature=${razorpay_signature}&appointmentId=${appointmentId || ''}`;
      console.log('✅ Payment verified, redirecting to:', successUrl);
      return res.redirect(successUrl);
    } else {
      return res.redirect(`healthsync://payment-failed?error=Payment verification failed&appointmentId=${appointmentId || ''}`);
    }
  } catch (error) {
    console.error('❌ Razorpay callback error:', error);
    return res.redirect(`healthsync://payment-failed?error=${encodeURIComponent(error.message)}&appointmentId=${req.query.appointmentId || ''}`);
  }
});

// Razorpay Cancel - for Android app redirect flow
router.get('/razorpay-cancel', async (req, res) => {
  const { appointmentId } = req.query;
  console.log('📱 Razorpay payment cancelled for appointment:', appointmentId);
  return res.redirect(`healthsync://payment-failed?error=Payment cancelled by user&appointmentId=${appointmentId || ''}`);
});

// Mobile Payment Page - serves a full-page Razorpay checkout for Android
router.get('/mobile-checkout/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { appointmentId, amount, name, email, contact, doctorName } = req.query;
    
    console.log('📱 Mobile checkout page requested for order:', orderId);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>HealthSync Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #0ea5e9;
      margin-bottom: 20px;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #1e293b;
      margin: 20px 0;
    }
    .doctor {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .pay-btn {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      border: none;
      padding: 18px 40px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      width: 100%;
      margin-bottom: 15px;
      transition: transform 0.2s;
    }
    .pay-btn:active { transform: scale(0.98); }
    .cancel-btn {
      background: transparent;
      color: #64748b;
      border: 2px solid #e2e8f0;
      padding: 14px 40px;
      font-size: 16px;
      border-radius: 12px;
      cursor: pointer;
      width: 100%;
    }
    .loading {
      display: none;
      color: #64748b;
      margin-top: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #0ea5e9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .secure {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #22c55e;
      font-size: 14px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🏥 HealthSync Pro</div>
    <div class="doctor">Consultation with ${decodeURIComponent(doctorName || 'Doctor')}</div>
    <div class="amount">₹${parseInt(amount || 0) / 100}</div>
    <button class="pay-btn" onclick="startPayment()">Pay Now</button>
    <button class="cancel-btn" onclick="cancelPayment()">Cancel</button>
    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>Processing payment...</p>
    </div>
    <div class="secure">🔒 Secured by Razorpay</div>
  </div>
  
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const orderId = '${orderId}';
    const appointmentId = '${appointmentId}';
    const keyId = '${RAZORPAY_KEY_ID}';
    
    function startPayment() {
      document.getElementById('loading').style.display = 'block';
      
      const options = {
        key: keyId,
        amount: ${amount || 0},
        currency: 'INR',
        name: 'HealthSync Pro',
        description: 'Consultation with ${decodeURIComponent(doctorName || 'Doctor')}',
        order_id: orderId,
        prefill: {
          name: '${decodeURIComponent(name || '')}',
          email: '${decodeURIComponent(email || '')}',
          contact: '${decodeURIComponent(contact || '')}'
        },
        theme: { color: '#0ea5e9' },
        handler: function(response) {
          // Payment successful - redirect to app
          const successUrl = 'healthsync://payment-success?' +
            'razorpay_order_id=' + response.razorpay_order_id +
            '&razorpay_payment_id=' + response.razorpay_payment_id +
            '&razorpay_signature=' + response.razorpay_signature +
            '&appointmentId=' + appointmentId;
          window.location.href = successUrl;
        },
        modal: {
          ondismiss: function() {
            document.getElementById('loading').style.display = 'none';
          }
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        window.location.href = 'healthsync://payment-failed?error=' + 
          encodeURIComponent(response.error.description) + 
          '&appointmentId=' + appointmentId;
      });
      rzp.open();
    }
    
    function cancelPayment() {
      window.location.href = 'healthsync://payment-failed?error=Payment cancelled&appointmentId=' + appointmentId;
    }
    
    // Auto-start payment after a short delay
    setTimeout(startPayment, 500);
  </script>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('❌ Mobile checkout error:', error);
    res.redirect(`healthsync://payment-failed?error=${encodeURIComponent(error.message)}`);
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
      case 'refund.processed':
        const refund = event.payload.refund.entity;
        console.log(`💰 Refund ${event.event}: ${refund.id} for payment ${refund.payment_id}`);
        
        // Update appointment refund status
        const refundAppointment = await Appointment.findOne({ razorpayPaymentId: refund.payment_id });
        if (refundAppointment) {
          refundAppointment.paymentStatus = 'refunded';
          refundAppointment.refundDetails = {
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
            refundedAt: new Date()
          };
          await refundAppointment.save();
          console.log(`✅ Refund updated for appointment ${refundAppointment._id}`);
        }
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
