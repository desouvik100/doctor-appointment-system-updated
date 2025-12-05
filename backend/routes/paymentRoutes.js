const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Appointment = require('../models/Appointment');
const { USE_PAYU_PAYMENTS, PAYU_MERCHANT_KEY, FRONTEND_URL } = require('../config/paymentConfig');

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
      testMode: !USE_PAYU_PAYMENTS,
      appointmentId,
      doctorName: appointment.doctorId.name,
      ...breakdown
    });
  } catch (error) {
    console.error('Payment calculation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create PayU Order
router.post('/create-order', async (req, res) => {
  try {
    const { appointmentId, userId } = req.body;
    
    if (!appointmentId || !userId) {
      return res.status(400).json({ message: 'Appointment ID and User ID are required' });
    }

    // If PayU is disabled, return test mode response
    if (!USE_PAYU_PAYMENTS) {
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
        message: 'PayU disabled - appointment confirmed in test mode (no payment required)',
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

// PayU Success Callback (POST from PayU)
router.post('/payu/success', async (req, res) => {
  try {
    console.log('PayU Success Callback:', req.body);
    
    const result = await paymentService.verifyPayment(req.body);
    
    // Redirect to frontend success page
    res.redirect(result.redirectUrl);
  } catch (error) {
    console.error('PayU success callback error:', error);
    res.redirect(`${FRONTEND_URL}/payment-failed?error=${encodeURIComponent(error.message)}`);
  }
});

// PayU Failure Callback (POST from PayU)
router.post('/payu/failure', async (req, res) => {
  try {
    console.log('PayU Failure Callback:', req.body);
    
    const result = await paymentService.verifyPayment(req.body);
    
    // Redirect to frontend failure page
    res.redirect(result.redirectUrl);
  } catch (error) {
    console.error('PayU failure callback error:', error);
    res.redirect(`${FRONTEND_URL}/payment-failed?error=${encodeURIComponent(error.message)}`);
  }
});

// Legacy verify endpoint (for compatibility)
router.post('/verify', async (req, res) => {
  try {
    // If PayU is disabled, return test mode response
    if (!USE_PAYU_PAYMENTS) {
      return res.json({
        success: true,
        testMode: true,
        message: 'PayU disabled - payment verification skipped in test mode'
      });
    }
    
    const result = await paymentService.verifyPayment(req.body);
    
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
      message: 'Refund request submitted successfully',
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

// Get PayU config for frontend
router.get('/config', (req, res) => {
  const config = paymentService.getConfig();
  res.json(config);
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

// Hosted checkout page for PayU (renders PayU form)
router.get('/checkout', async (req, res) => {
  const { appointmentId, userId } = req.query;
  
  if (!USE_PAYU_PAYMENTS) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Test Mode</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>Payment Test Mode</h2>
        <p>PayU is disabled. Payment auto-completed.</p>
        <script>
          setTimeout(() => {
            window.location.href = '${FRONTEND_URL}/payment-success?appointmentId=${appointmentId}&status=success';
          }, 2000);
        </script>
      </body>
      </html>
    `);
  }

  try {
    const orderData = await paymentService.createOrder(appointmentId, userId);
    const params = orderData.payuParams;
    
    // Render PayU checkout form that auto-submits
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HealthSync Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .container { max-width: 400px; background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          .logo { font-size: 28px; font-weight: bold; color: #4F46E5; margin-bottom: 10px; }
          .subtitle { color: #6b7280; margin-bottom: 30px; }
          .amount { font-size: 36px; font-weight: bold; color: #1f2937; margin: 20px 0; }
          .amount span { font-size: 18px; color: #6b7280; }
          .loading { display: flex; align-items: center; justify-content: center; gap: 10px; color: #4F46E5; margin: 20px 0; }
          .spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #4F46E5; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .secure { display: flex; align-items: center; justify-content: center; gap: 8px; color: #10b981; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🏥 HealthSync</div>
          <div class="subtitle">Secure Payment Gateway</div>
          <div class="amount"><span>₹</span>${params.amount}</div>
          <div class="loading">
            <div class="spinner"></div>
            <span>Redirecting to PayU...</span>
          </div>
          <div class="secure">🔒 256-bit SSL Encrypted</div>
        </div>
        
        <form id="payuForm" action="${orderData.payuUrl}" method="POST" style="display:none;">
          <input type="hidden" name="key" value="${params.key}" />
          <input type="hidden" name="txnid" value="${params.txnid}" />
          <input type="hidden" name="amount" value="${params.amount}" />
          <input type="hidden" name="productinfo" value="${params.productinfo}" />
          <input type="hidden" name="firstname" value="${params.firstname}" />
          <input type="hidden" name="email" value="${params.email}" />
          <input type="hidden" name="phone" value="${params.phone}" />
          <input type="hidden" name="surl" value="${params.surl}" />
          <input type="hidden" name="furl" value="${params.furl}" />
          <input type="hidden" name="hash" value="${params.hash}" />
          <input type="hidden" name="udf1" value="${params.udf1}" />
          <input type="hidden" name="udf2" value="${params.udf2}" />
          <input type="hidden" name="udf3" value="${params.udf3}" />
          <input type="hidden" name="udf4" value="${params.udf4}" />
          <input type="hidden" name="udf5" value="${params.udf5 || ''}" />
        </form>
        
        <script>
          setTimeout(() => {
            document.getElementById('payuForm').submit();
          }, 1500);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>Payment Error</h2>
        <p>${error.message}</p>
        <a href="${FRONTEND_URL}">Go Back</a>
      </body>
      </html>
    `);
  }
});

module.exports = router;
