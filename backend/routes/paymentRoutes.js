const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Appointment = require('../models/Appointment');
const { USE_RAZORPAY_PAYMENTS, RAZORPAY_KEY_ID } = require('../config/paymentConfig');

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

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    
    if (!appointmentId || !userId) {
      return res.status(400).json({ message: 'Appointment ID and User ID are required' });
    }

    // If Razorpay is disabled, return test mode response
    if (!USE_RAZORPAY_PAYMENTS) {
      // In test mode, directly confirm the appointment
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
        message: 'Razorpay disabled - appointment confirmed in test mode (no payment required)',
        appointmentId
      });
    }
    
    const orderData = await paymentService.createOrder(appointmentId, userId);
    
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification parameters' });
    }

    // If Razorpay is disabled, return test mode response
    if (!USE_RAZORPAY_PAYMENTS) {
      return res.json({
        success: true,
        testMode: true,
        message: 'Razorpay disabled - payment verification skipped in test mode'
      });
    }
    
    const result = await paymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
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

// Razorpay webhook endpoint
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    await paymentService.handleWebhook(req.body, signature);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Razorpay config (key ID for frontend)
router.get('/config', (req, res) => {
  res.json({
    keyId: USE_RAZORPAY_PAYMENTS ? RAZORPAY_KEY_ID : null,
    testMode: !USE_RAZORPAY_PAYMENTS,
    paymentsEnabled: USE_RAZORPAY_PAYMENTS
  });
});

// Get payment status for an appointment (for mobile polling)
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

// Hosted checkout page for mobile (renders Razorpay checkout)
router.get('/checkout', async (req, res) => {
  const { orderId, appointmentId, amount, currency, keyId, prefillName, prefillEmail, prefillContact, successUrl, cancelUrl } = req.query;
  
  if (!USE_RAZORPAY_PAYMENTS) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Test Mode</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>Payment Test Mode</h2>
        <p>Razorpay is disabled. Payment auto-completed.</p>
        <script>
          setTimeout(() => {
            window.location.href = '${successUrl}&status=success';
          }, 2000);
        </script>
      </body>
      </html>
    `);
  }
  
  // Render Razorpay checkout page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HealthSync Payment</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 400px; margin: 0 auto; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 20px; }
        .amount { font-size: 32px; font-weight: bold; margin: 20px 0; }
        .loading { color: #666; }
        .error { color: #dc2626; padding: 20px; }
        .btn { background: #4F46E5; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .btn:hover { background: #4338CA; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">HealthSync</div>
        <p class="loading">Initializing payment...</p>
        <div class="amount">₹${amount}</div>
        <button class="btn" id="payBtn" style="display:none;">Pay Now</button>
      </div>
      <script>
        const options = {
          key: '${keyId}',
          amount: ${parseFloat(amount) * 100},
          currency: '${currency || 'INR'}',
          name: 'HealthSync',
          description: 'Appointment Payment',
          order_id: '${orderId}',
          prefill: {
            name: '${prefillName || ''}',
            email: '${prefillEmail || ''}',
            contact: '${prefillContact || ''}'
          },
          theme: { color: '#4F46E5' },
          handler: function(response) {
            const successParams = new URLSearchParams({
              appointmentId: '${appointmentId}',
              status: 'success',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            });
            window.location.href = '${successUrl}&' + successParams.toString();
          },
          modal: {
            ondismiss: function() {
              window.location.href = '${cancelUrl}&status=cancelled';
            }
          }
        };
        
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          window.location.href = '${cancelUrl}&status=failed&error=' + encodeURIComponent(response.error.description);
        });
        
        // Auto-open checkout
        setTimeout(() => {
          document.querySelector('.loading').style.display = 'none';
          document.getElementById('payBtn').style.display = 'inline-block';
          rzp.open();
        }, 500);
        
        document.getElementById('payBtn').onclick = () => rzp.open();
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
