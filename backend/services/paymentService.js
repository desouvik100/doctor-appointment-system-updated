const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');
const { 
  USE_PAYU_PAYMENTS, 
  PAYU_MERCHANT_KEY, 
  PAYU_MERCHANT_SALT,
  PAYU_MODE,
  PAYU_BASE_URL,
  FRONTEND_URL,
  BACKEND_URL
} = require('../config/paymentConfig');

// PayU configuration check
const isPayUEnabled = USE_PAYU_PAYMENTS && PAYU_MERCHANT_KEY && PAYU_MERCHANT_SALT;

if (isPayUEnabled) {
  console.log(`✅ PayU payments ENABLED (${PAYU_MODE} mode)`);
} else {
  console.log('⚠️  PayU payments DISABLED - Running in test mode');
}

class PaymentService {
  constructor() {
    this.currency = process.env.CURRENCY || 'INR';
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7;
    this.gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 18;
    this.usePayUPayments = isPayUEnabled;
    this.payuBaseUrl = PAYU_BASE_URL;
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

  // Generate PayU hash
  generateHash(params) {
    // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    const hashString = `${PAYU_MERCHANT_KEY}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ''}|${params.udf2 || ''}|${params.udf3 || ''}|${params.udf4 || ''}|${params.udf5 || ''}||||||${PAYU_MERCHANT_SALT}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  // Verify PayU response hash
  verifyHash(params) {
    // Reverse hash formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const hashString = `${PAYU_MERCHANT_SALT}|${params.status}||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${PAYU_MERCHANT_KEY}`;
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    return calculatedHash === params.hash;
  }

  // Create PayU Order/Transaction
  async createOrder(appointmentId, userId) {
    // If PayU is disabled, return test mode response
    if (!this.usePayUPayments) {
      return {
        testMode: true,
        message: 'PayU disabled - running in test mode',
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
      
      // Generate unique transaction ID
      const txnid = `TXN${Date.now()}${appointmentId.slice(-6)}`;

      // PayU payment parameters
      const payuParams = {
        key: PAYU_MERCHANT_KEY,
        txnid: txnid,
        amount: paymentBreakdown.total.toFixed(2),
        productinfo: `Consultation with Dr. ${appointment.doctorId.name}`,
        firstname: appointment.userId.name.split(' ')[0],
        email: appointment.userId.email,
        phone: appointment.userId.phone || '9999999999',
        surl: `${BACKEND_URL}/api/payments/payu/success`,
        furl: `${BACKEND_URL}/api/payments/payu/failure`,
        udf1: appointmentId,
        udf2: userId,
        udf3: appointment.doctorId._id.toString(),
        udf4: paymentBreakdown.consultationFee.toString(),
        udf5: ''
      };

      // Generate hash
      payuParams.hash = this.generateHash(payuParams);

      // Update appointment with transaction ID
      appointment.payuTxnId = txnid;
      appointment.paymentStatus = 'pending';
      await appointment.save();

      return {
        payuUrl: `${this.payuBaseUrl}/_payment`,
        payuParams: payuParams,
        amount: paymentBreakdown.total,
        breakdown: paymentBreakdown,
        txnid: txnid
      };

    } catch (error) {
      console.error('Error creating PayU order:', error);
      throw error;
    }
  }

  // Verify PayU Payment (called from success/failure callback)
  async verifyPayment(payuResponse) {
    // If PayU is disabled, return test mode response
    if (!this.usePayUPayments) {
      return {
        success: true,
        testMode: true,
        message: 'PayU disabled - payment verification skipped in test mode'
      };
    }

    try {
      // Verify hash
      const isValidHash = this.verifyHash(payuResponse);
      
      if (!isValidHash) {
        console.error('PayU hash verification failed');
        throw new Error('Payment verification failed - Invalid hash');
      }

      const appointmentId = payuResponse.udf1;
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found for this transaction');
      }

      // Check payment status
      if (payuResponse.status === 'success') {
        // Update appointment with payment details
        appointment.paymentStatus = 'completed';
        appointment.status = 'confirmed';
        appointment.payuPaymentId = payuResponse.mihpayid;
        appointment.paymentDetails = {
          payuTxnId: payuResponse.txnid,
          payuPaymentId: payuResponse.mihpayid,
          amount: parseFloat(payuResponse.amount),
          currency: 'INR',
          method: payuResponse.mode,
          bank: payuResponse.bankcode || payuResponse.bank_ref_num,
          status: payuResponse.status,
          paidAt: new Date()
        };
        await appointment.save();

        return {
          success: true,
          verified: true,
          appointment: appointment,
          redirectUrl: `${FRONTEND_URL}/payment-success?appointmentId=${appointmentId}`,
          paymentDetails: {
            txnid: payuResponse.txnid,
            paymentId: payuResponse.mihpayid,
            amount: payuResponse.amount,
            method: payuResponse.mode
          }
        };
      } else {
        // Payment failed
        appointment.paymentStatus = 'failed';
        appointment.status = 'pending';
        await appointment.save();

        return {
          success: false,
          verified: true,
          appointment: appointment,
          redirectUrl: `${FRONTEND_URL}/payment-failed?appointmentId=${appointmentId}&error=${encodeURIComponent(payuResponse.error_Message || 'Payment failed')}`,
          error: payuResponse.error_Message || 'Payment failed'
        };
      }

    } catch (error) {
      console.error('Error verifying PayU payment:', error);
      throw error;
    }
  }

  // Process refund (PayU refund API)
  async processRefund(appointmentId, reason = 'Appointment cancelled') {
    // If PayU is disabled, just cancel the appointment
    if (!this.usePayUPayments) {
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
      
      if (!appointment || !appointment.payuPaymentId) {
        throw new Error('No payment found for this appointment');
      }

      if (appointment.paymentStatus !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // PayU refund requires API call
      // Note: PayU refund API requires merchant dashboard or API integration
      // For now, mark as refund requested
      appointment.paymentStatus = 'refund_requested';
      appointment.status = 'cancelled';
      appointment.refundDetails = {
        reason: reason,
        requestedAt: new Date(),
        amount: appointment.paymentDetails.amount
      };
      await appointment.save();

      console.log(`Refund requested for appointment ${appointmentId}`);

      return {
        success: true,
        message: 'Refund request submitted. It will be processed within 5-7 business days.',
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
        paymentStatus: { $in: ['completed', 'refunded', 'refund_requested'] }
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

  // Get payment config for frontend
  getConfig() {
    return {
      paymentsEnabled: this.usePayUPayments,
      testMode: PAYU_MODE === 'test',
      currency: this.currency,
      platformFeePercentage: this.platformFeePercentage,
      gstPercentage: this.gstPercentage
    };
  }
}

module.exports = new PaymentService();
