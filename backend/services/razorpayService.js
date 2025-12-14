// Razorpay Payment Service
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const { 
  USE_RAZORPAY_PAYMENTS,
  RAZORPAY_KEY_ID, 
  RAZORPAY_KEY_SECRET,
  RAZORPAY_MODE,
  FRONTEND_URL
} = require('../config/paymentConfig');

// Initialize Razorpay instance
let razorpay = null;
const isRazorpayEnabled = USE_RAZORPAY_PAYMENTS && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET;

if (isRazorpayEnabled) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
  console.log(`✅ Razorpay payments ENABLED (${RAZORPAY_MODE} mode)`);
  console.log(`   Key ID: ${RAZORPAY_KEY_ID.substring(0, 12)}...`);
} else {
  console.log('⚠️  Razorpay payments DISABLED - Running in test mode');
}

class RazorpayService {
  constructor() {
    this.currency = 'INR';
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 5; // Default 5%
    this.gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 0; // Default 0%
    this.useRazorpay = isRazorpayEnabled;
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
      totalInPaise: totalAmount * 100, // Razorpay uses paise
      currency: this.currency
    };
  }

  // Create Razorpay Order
  async createOrder(appointmentId, userId) {
    if (!this.useRazorpay) {
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
      
      // Create Razorpay order
      const orderOptions = {
        amount: paymentBreakdown.totalInPaise, // Amount in paise
        currency: this.currency,
        receipt: `apt_${appointmentId.slice(-10)}`,
        notes: {
          appointmentId: appointmentId,
          userId: userId,
          doctorId: appointment.doctorId._id.toString(),
          doctorName: appointment.doctorId.name,
          patientName: appointment.userId.name
        }
      };

      console.log('📦 Creating Razorpay order:', orderOptions);
      const order = await razorpay.orders.create(orderOptions);
      console.log('✅ Razorpay order created:', order.id);

      // Update appointment with order ID
      appointment.razorpayOrderId = order.id;
      appointment.paymentStatus = 'pending';
      await appointment.save();

      return {
        success: true,
        orderId: order.id,
        amount: paymentBreakdown.total,
        amountInPaise: paymentBreakdown.totalInPaise,
        currency: this.currency,
        breakdown: paymentBreakdown,
        keyId: RAZORPAY_KEY_ID,
        prefill: {
          name: appointment.userId.name,
          email: appointment.userId.email,
          contact: appointment.userId.phone || ''
        },
        notes: orderOptions.notes,
        appointmentId: appointmentId
      };

    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Verify Razorpay Payment Signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    return expectedSignature === signature;
  }

  // Verify and Complete Payment
  async verifyPayment(paymentData) {
    if (!this.useRazorpay) {
      return {
        success: true,
        testMode: true,
        message: 'Razorpay disabled - payment verification skipped in test mode'
      };
    }

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = paymentData;

      // Verify signature
      const isValidSignature = this.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        console.error('❌ Razorpay signature verification failed');
        throw new Error('Payment verification failed - Invalid signature');
      }

      console.log('✅ Razorpay signature verified');

      // Find appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log('📦 Payment details:', payment);

      // Update appointment with payment details
      appointment.paymentStatus = 'completed';
      appointment.status = 'confirmed';
      appointment.razorpayPaymentId = razorpay_payment_id;
      appointment.razorpaySignature = razorpay_signature;
      appointment.paymentDetails = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        status: payment.status,
        paidAt: new Date()
      };
      await appointment.save();

      console.log(`✅ Payment completed for appointment ${appointmentId}`);

      return {
        success: true,
        verified: true,
        appointment: appointment,
        paymentDetails: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: payment.amount / 100,
          method: payment.method
        }
      };

    } catch (error) {
      console.error('❌ Error verifying Razorpay payment:', error);
      throw error;
    }
  }

  // Process Refund
  async processRefund(appointmentId, reason = 'Appointment cancelled') {
    if (!this.useRazorpay) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        appointment.status = 'cancelled';
        await appointment.save();
        return {
          success: true,
          testMode: true,
          message: 'Appointment cancelled (test mode - no refund needed)'
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

      // Create refund
      const refund = await razorpay.payments.refund(appointment.razorpayPaymentId, {
        amount: appointment.paymentDetails.amount * 100, // Convert to paise
        notes: {
          reason: reason,
          appointmentId: appointmentId
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

      console.log(`✅ Refund processed for appointment ${appointmentId}: ${refund.id}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };

    } catch (error) {
      console.error('❌ Error processing refund:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(userId) {
    try {
      const appointments = await Appointment.find({ 
        userId: userId,
        paymentStatus: { $in: ['completed', 'refunded', 'refund_requested'] }
      })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });

      return appointments.map(apt => ({
        id: apt._id,
        doctor: apt.doctorId?.name || 'Unknown',
        specialization: apt.doctorId?.specialization || 'General',
        clinic: apt.clinicId?.name,
        date: apt.date,
        time: apt.time,
        amount: apt.paymentDetails?.amount || 0,
        currency: apt.paymentDetails?.currency || this.currency,
        status: apt.paymentStatus,
        method: apt.paymentDetails?.method,
        paidAt: apt.paymentDetails?.paidAt,
        refundDetails: apt.refundDetails
      }));

    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Get config for frontend
  getConfig() {
    return {
      paymentsEnabled: Boolean(this.useRazorpay),
      keyId: this.useRazorpay ? RAZORPAY_KEY_ID : null,
      testMode: RAZORPAY_MODE === 'test',
      currency: this.currency,
      platformFeePercentage: this.platformFeePercentage,
      gstPercentage: this.gstPercentage
    };
  }
}

module.exports = new RazorpayService();
