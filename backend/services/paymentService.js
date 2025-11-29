const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');
const { USE_RAZORPAY_PAYMENTS, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config/paymentConfig');

// Only initialize Razorpay if payments are enabled
let razorpay = null;
if (USE_RAZORPAY_PAYMENTS && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay payments ENABLED');
} else {
  console.log('⚠️  Razorpay payments DISABLED - Running in test mode');
}

class PaymentService {
  constructor() {
    this.currency = process.env.CURRENCY || 'INR';
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7;
    this.gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 18;
    this.useRazorpayPayments = USE_RAZORPAY_PAYMENTS && razorpay !== null;
  }

  // Calculate payment breakdown
  calculatePaymentBreakdown(consultationFee) {
    const baseAmount = parseFloat(consultationFee);
    const gstAmount = Math.round((baseAmount * this.gstPercentage) / 100);
    const platformFeeAmount = Math.round((baseAmount * this.platformFeePercentage) / 100);
    const totalAmount = baseAmount + gstAmount + platformFeeAmount;

    return {
      consultationFee: baseAmount,
      gst: gstAmount,
      platformFee: platformFeeAmount,
      total: totalAmount,
      currency: this.currency.toUpperCase()
    };
  }

  // Create Razorpay Order
  async createOrder(appointmentId, userId) {
    // If Razorpay is disabled, return test mode response
    if (!this.useRazorpayPayments) {
      return {
        testMode: true,
        message: 'Razorpay disabled - running in test mode',
        appointmentId: appointmentId
      };
    }

    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name consultationFee')
        .populate('userId', 'name email phone');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.userId._id.toString() !== userId) {
        throw new Error('Unauthorized access to appointment');
      }

      const paymentBreakdown = this.calculatePaymentBreakdown(appointment.doctorId.consultationFee);

      // Create Razorpay Order
      const orderOptions = {
        amount: paymentBreakdown.total * 100, // Razorpay expects amount in paise
        currency: this.currency,
        receipt: `apt_${appointmentId}`,
        notes: {
          appointmentId: appointmentId,
          userId: userId,
          doctorId: appointment.doctorId._id.toString(),
          doctorName: appointment.doctorId.name,
          consultationFee: paymentBreakdown.consultationFee.toString(),
          gst: paymentBreakdown.gst.toString(),
          platformFee: paymentBreakdown.platformFee.toString()
        }
      };

      const order = await razorpay.orders.create(orderOptions);

      // Update appointment with order ID
      appointment.razorpayOrderId = order.id;
      appointment.paymentStatus = 'pending';
      await appointment.save();

      return {
        orderId: order.id,
        amount: paymentBreakdown.total,
        amountInPaise: order.amount,
        currency: order.currency,
        breakdown: paymentBreakdown,
        keyId: RAZORPAY_KEY_ID,
        prefill: {
          name: appointment.userId.name,
          email: appointment.userId.email,
          contact: appointment.userId.phone || ''
        },
        notes: order.notes
      };

    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Verify Razorpay Payment
  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    // If Razorpay is disabled, return test mode response
    if (!this.useRazorpayPayments) {
      return {
        success: true,
        testMode: true,
        message: 'Razorpay disabled - payment verification skipped in test mode'
      };
    }

    try {
      // Verify signature
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpaySignature;

      if (!isAuthentic) {
        throw new Error('Payment verification failed - Invalid signature');
      }

      // Find appointment by order ID
      const appointment = await Appointment.findOne({ razorpayOrderId: razorpayOrderId });
      
      if (!appointment) {
        throw new Error('Appointment not found for this order');
      }

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpayPaymentId);

      // Update appointment with payment details
      appointment.paymentStatus = 'completed';
      appointment.status = 'confirmed';
      appointment.razorpayPaymentId = razorpayPaymentId;
      appointment.paymentDetails = {
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        paidAt: new Date()
      };
      await appointment.save();

      return {
        success: true,
        verified: true,
        appointment: appointment,
        paymentDetails: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          amount: payment.amount / 100,
          method: payment.method
        }
      };

    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(appointmentId, reason = 'Appointment cancelled') {
    // If Razorpay is disabled, just cancel the appointment
    if (!this.useRazorpayPayments) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        appointment.status = 'cancelled';
        await appointment.save();
        return {
          success: true,
          testMode: true,
          message: 'Appointment cancelled (test mode - no refund needed)',
          appointment: appointment
        };
      }
      throw new Error('Appointment not found');
    }

    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment || !appointment.razorpayPaymentId) {
        throw new Error('No payment found for this appointment');
      }

      if (appointment.paymentStatus !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // Create refund in Razorpay
      const refund = await razorpay.payments.refund(appointment.razorpayPaymentId, {
        amount: appointment.paymentDetails.amount * 100, // Amount in paise
        speed: 'normal',
        notes: {
          appointmentId: appointmentId,
          reason: reason
        }
      });

      // Update appointment
      appointment.paymentStatus = 'refunded';
      appointment.status = 'cancelled';
      appointment.refundDetails = {
        refundId: refund.id,
        amount: refund.amount / 100,
        reason: reason,
        status: refund.status,
        refundedAt: new Date()
      };
      await appointment.save();

      return {
        success: true,
        refund: refund,
        appointment: appointment
      };

    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get payment history for user
  async getPaymentHistory(userId) {
    try {
      const appointments = await Appointment.find({ 
        userId: userId,
        paymentStatus: { $in: ['completed', 'refunded'] }
      })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });

      return appointments.map(appointment => ({
        id: appointment._id,
        doctor: appointment.doctorId?.name || 'Unknown',
        specialization: appointment.doctorId?.specialization || 'General',
        clinic: appointment.clinicId?.name,
        date: appointment.date,
        time: appointment.time,
        amount: appointment.paymentDetails?.amount || 0,
        currency: appointment.paymentDetails?.currency || this.currency,
        status: appointment.paymentStatus,
        method: appointment.paymentDetails?.method,
        paidAt: appointment.paymentDetails?.paidAt,
        refundDetails: appointment.refundDetails
      }));

    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Handle Razorpay webhooks
  async handleWebhook(body, signature) {
    // If Razorpay is disabled, ignore webhooks
    if (!this.useRazorpayPayments) {
      return { received: true, testMode: true, message: 'Webhooks disabled in test mode' };
    }

    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const event = body.event;
      const payload = body.payload;

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;
        
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;
        
        case 'refund.created':
          await this.handleRefundCreated(payload.refund.entity);
          break;
        
        default:
          console.log(`Unhandled Razorpay event: ${event}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  async handlePaymentCaptured(payment) {
    const orderId = payment.order_id;
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
        paidAt: new Date()
      };
      await appointment.save();
      
      console.log(`Payment captured for appointment with order ${orderId}`);
    }
  }

  async handlePaymentFailed(payment) {
    const orderId = payment.order_id;
    const appointment = await Appointment.findOne({ razorpayOrderId: orderId });
    
    if (appointment) {
      appointment.paymentStatus = 'failed';
      appointment.status = 'pending';
      await appointment.save();
      
      console.log(`Payment failed for appointment with order ${orderId}`);
    }
  }

  async handleRefundCreated(refund) {
    const paymentId = refund.payment_id;
    const appointment = await Appointment.findOne({ razorpayPaymentId: paymentId });
    
    if (appointment) {
      appointment.paymentStatus = 'refunded';
      appointment.refundDetails = {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        refundedAt: new Date()
      };
      await appointment.save();
      
      console.log(`Refund created for payment ${paymentId}`);
    }
  }
}

module.exports = new PaymentService();
