

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const razorpayService = require('./razorpayService');
const REFUND_POLICY = {
  fullRefundHours: 6,
  fullRefundPercentage: 100,
  partialRefundPercentage: 50,
  noShowRefundPercentage: 0,
  doctorCancelRefundPercentage: 100,
  paymentGatewayFeePercentage: 2.5, 
  doctorCancelCompensationCredit: 50, 
  minimumRefundAmount: 1
};

class RefundPolicyService {

  calculateHoursUntilAppointment(appointmentDate, appointmentTime) {
    const now = new Date();
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    const diffMs = appointmentDateTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours;
  }

  calculateRefund(appointment, cancelledBy = 'patient') {
    const paidAmount = appointment.paymentDetails?.amount || 
                       appointment.payment?.totalAmount || 0;
    const paymentCompleted = appointment.paymentStatus === 'completed' || 
                             appointment.payment?.paymentStatus === 'completed';
    if (paidAmount <= 0 || !paymentCompleted) {
      return {
        eligible: false,
        reason: 'No payment was made for this appointment',
        refundAmount: 0,
        refundPercentage: 0,
        walletCredit: 0,
        policyApplied: 'no_payment'
      };
    }
    
    const hoursUntil = this.calculateHoursUntilAppointment(
      appointment.date, 
      appointment.time
    );
    if (cancelledBy === 'doctor' || cancelledBy === 'clinic' || cancelledBy === 'system') {
      const refundAmount = paidAmount;
      return {
        eligible: true,
        reason: 'Doctor/clinic cancelled the appointment',
        refundAmount: refundAmount,
        refundPercentage: REFUND_POLICY.doctorCancelRefundPercentage,
        walletCredit: REFUND_POLICY.doctorCancelCompensationCredit,
        policyApplied: 'doctor_cancelled',
        hoursUntilAppointment: hoursUntil,
        gatewayFeeDeducted: 0
      };
    }
    if (hoursUntil < 0) {
      return {
        eligible: false,
        reason: 'Appointment time has already passed',
        refundAmount: 0,
        refundPercentage: REFUND_POLICY.noShowRefundPercentage,
        walletCredit: 0,
        policyApplied: 'no_show',
        hoursUntilAppointment: hoursUntil
      };
    }
    if (hoursUntil >= REFUND_POLICY.fullRefundHours) {
      const gatewayFee = Math.round(paidAmount * REFUND_POLICY.paymentGatewayFeePercentage / 100);
      const refundAmount = Math.max(0, paidAmount - gatewayFee);
      
      return {
        eligible: true,
        reason: `Cancelled more than ${REFUND_POLICY.fullRefundHours} hours before appointment`,
        refundAmount: refundAmount,
        refundPercentage: REFUND_POLICY.fullRefundPercentage,
        walletCredit: 0,
        policyApplied: 'full_refund',
        hoursUntilAppointment: hoursUntil,
        gatewayFeeDeducted: gatewayFee,
        originalAmount: paidAmount
      };
    }
    const refundAmount = Math.round(paidAmount * REFUND_POLICY.partialRefundPercentage / 100);
    const platformRetained = paidAmount - refundAmount;
    
    return {
      eligible: true,
      reason: `Cancelled less than ${REFUND_POLICY.fullRefundHours} hours before appointment - partial refund`,
      refundAmount: refundAmount,
      refundPercentage: REFUND_POLICY.partialRefundPercentage,
      walletCredit: 0,
      policyApplied: 'partial_refund',
      hoursUntilAppointment: hoursUntil,
      platformRetained: platformRetained,
      originalAmount: paidAmount
    };
  }

  async processRefund(appointmentId, cancelledBy = 'patient', reason = '') {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email phone walletBalance')
        .populate('doctorId', 'name email');
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      const refundCalc = this.calculateRefund(appointment, cancelledBy);
      
      console.log(`💰 Refund calculation for appointment ${appointmentId}:`);
      console.log(`   Policy: ${refundCalc.policyApplied}`);
      console.log(`   Refund amount: ₹${refundCalc.refundAmount}`);
      console.log(`   Wallet credit: ₹${refundCalc.walletCredit}`);
      appointment.refundPolicy = {
        policyApplied: refundCalc.policyApplied,
        calculatedAt: new Date(),
        hoursBeforeAppointment: refundCalc.hoursUntilAppointment,
        originalAmount: refundCalc.originalAmount || appointment.paymentDetails?.amount,
        refundPercentage: refundCalc.refundPercentage,
        refundAmount: refundCalc.refundAmount,
        gatewayFeeDeducted: refundCalc.gatewayFeeDeducted || 0,
        platformRetained: refundCalc.platformRetained || 0,
        walletCreditAmount: refundCalc.walletCredit,
        reason: refundCalc.reason
      };
      
      let refundResult = { success: false };
      let walletCreditResult = { success: false };
      if (refundCalc.eligible && refundCalc.refundAmount >= REFUND_POLICY.minimumRefundAmount) {
        try {
          if (appointment.razorpayPaymentId) {
            refundResult = await this.processRazorpayRefund(
              appointment, 
              refundCalc.refundAmount,
              reason || refundCalc.reason
            );
          } else if (appointment.payuPaymentId || appointment.paymentDetails?.payuPaymentId) {
            refundResult = await this.processPayURefund(
              appointment,
              refundCalc.refundAmount,
              reason || refundCalc.reason
            );
          } else {
            refundResult = {
              success: true,
              testMode: true,
              message: 'Refund marked (no payment gateway transaction)'
            };
          }
          
          if (refundResult.success) {
            appointment.paymentStatus = refundResult.pending ? 'refund_requested' : 'refunded';
            appointment.refundDetails = {
              ...appointment.refundDetails,
              refundId: refundResult.refundId,
              amount: refundCalc.refundAmount,
              status: refundResult.pending ? 'pending' : 'processed',
              processedAt: new Date(),
              reason: reason || refundCalc.reason
            };
          }
        } catch (refundError) {
          console.error('❌ Refund processing error:', refundError.message);
          appointment.refundDetails = {
            status: 'failed',
            error: refundError.message,
            attemptedAt: new Date()
          };
        }
      }
      if (refundCalc.walletCredit > 0 && appointment.userId) {
        try {
          walletCreditResult = await this.addWalletCredit(
            appointment.userId._id,
            refundCalc.walletCredit,
            `Compensation for appointment cancellation by ${cancelledBy}`,
            appointmentId
          );
          
          if (walletCreditResult.success) {
            appointment.refundPolicy.walletCreditProcessed = true;
          }
        } catch (walletError) {
          console.error('❌ Wallet credit error:', walletError.message);
        }
      }
      
      await appointment.save();
      
      return {
        success: true,
        refundCalculation: refundCalc,
        refundProcessed: refundResult.success,
        refundDetails: refundResult,
        walletCreditProcessed: walletCreditResult.success,
        walletCreditDetails: walletCreditResult,
        appointment: appointment
      };
      
    } catch (error) {
      console.error('❌ Error in refund policy processing:', error);
      throw error;
    }
  }

  async processRazorpayRefund(appointment, refundAmount, reason) {
    const Razorpay = require('razorpay');
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, USE_RAZORPAY_PAYMENTS } = require('../config/paymentConfig');
    
    if (!USE_RAZORPAY_PAYMENTS || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return {
        success: true,
        testMode: true,
        message: 'Razorpay disabled - refund simulated'
      };
    }
    
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
    
    try {
      const refund = await razorpay.payments.refund(appointment.razorpayPaymentId, {
        amount: refundAmount * 100, 
        notes: {
          reason: reason,
          appointmentId: appointment._id.toString(),
          policyApplied: appointment.refundPolicy?.policyApplied
        }
      });
      
      console.log(`✅ Razorpay refund processed: ${refund.id} for ₹${refundAmount}`);
      
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      console.error('❌ Razorpay refund error:', error);
      throw error;
    }
  }

  async processPayURefund(appointment, refundAmount, reason) {
    const axios = require('axios');
    const crypto = require('crypto');
    const { 
      USE_PAYU_PAYMENTS, 
      PAYU_MERCHANT_KEY, 
      PAYU_MERCHANT_SALT,
      PAYU_AUTH_HEADER,
      PAYU_MODE 
    } = require('../config/paymentConfig');
    if (!USE_PAYU_PAYMENTS || !PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      console.log('⚠️ PayU not configured - marking refund as pending for manual processing');
      return {
        success: true,
        pending: true,
        testMode: true,
        message: 'Refund request submitted. Will be processed within 5-7 business days.'
      };
    }
    
    const payuPaymentId = appointment.payuPaymentId || appointment.paymentDetails?.payuPaymentId;
    const payuTxnId = appointment.payuTxnId || appointment.paymentDetails?.payuTxnId;
    
    if (!payuPaymentId && !payuTxnId) {
      console.log('⚠️ No PayU transaction ID found - marking for manual refund');
      return {
        success: true,
        pending: true,
        message: 'Refund request submitted for manual processing.'
      };
    }
    
    try {
      const refundUrl = PAYU_MODE === 'live' 
        ? 'https://info.payu.in/merchant/postservice.php?form=2'
        : 'https://test.payu.in/merchant/postservice.php?form=2';
      const command = 'cancel_refund_transaction';
      const var1 = payuPaymentId || payuTxnId;
      const hashString = `${PAYU_MERCHANT_KEY}|${command}|${var1}|${PAYU_MERCHANT_SALT}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');
      
      const refundData = {
        key: PAYU_MERCHANT_KEY,
        command: command,
        var1: var1, 
        var2: payuTxnId, 
        var3: refundAmount.toString(), 
        var4: reason, 
        hash: hash
      };
      
      console.log(`📤 Initiating PayU refund for ₹${refundAmount}...`);
      
      const response = await axios.post(refundUrl, new URLSearchParams(refundData), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(PAYU_AUTH_HEADER && { 'Authorization': PAYU_AUTH_HEADER })
        }
      });
      
      console.log('📥 PayU refund response:', response.data);
      if (response.data && (response.data.status === 1 || response.data.status === 'success')) {
        console.log(`✅ PayU refund initiated successfully for ₹${refundAmount}`);
        return {
          success: true,
          pending: true, 
          refundId: response.data.request_id || response.data.mihpayid,
          amount: refundAmount,
          message: 'Refund initiated. Amount will be credited within 5-7 business days.',
          payuResponse: response.data
        };
      } else {
        console.log('⚠️ PayU refund API returned error, marking for manual processing');
        return {
          success: true,
          pending: true,
          message: 'Refund request submitted. Will be processed manually within 5-7 business days.',
          error: response.data?.msg || 'PayU API error'
        };
      }
      
    } catch (error) {
      console.error('❌ PayU refund API error:', error.message);
      return {
        success: true,
        pending: true,
        message: 'Refund request submitted for manual processing due to API error.',
        error: error.message
      };
    }
  }

  async addWalletCredit(userId, amount, description, referenceId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      if (typeof user.walletBalance !== 'number') {
        user.walletBalance = 0;
      }
      if (!Array.isArray(user.walletHistory)) {
        user.walletHistory = [];
      }
      user.walletBalance += amount;
      user.walletHistory.push({
        type: 'credit',
        amount: amount,
        description: description,
        referenceId: referenceId,
        createdAt: new Date()
      });
      
      await user.save();
      
      console.log(`💳 Wallet credit added: ₹${amount} to user ${userId}`);
      
      return {
        success: true,
        newBalance: user.walletBalance,
        creditAmount: amount
      };
    } catch (error) {
      console.error('❌ Wallet credit error:', error);
      throw error;
    }
  }

  getRefundPolicyDetails() {
    return {
      patientCancellation: {
        moreThan6Hours: {
          refundPercentage: REFUND_POLICY.fullRefundPercentage,
          description: `100% refund (payment gateway fee of ${REFUND_POLICY.paymentGatewayFeePercentage}% may be deducted)`
        },
        lessThan6Hours: {
          refundPercentage: REFUND_POLICY.partialRefundPercentage,
          description: '50% refund - doctor slot was blocked'
        }
      },
      doctorCancellation: {
        refundPercentage: REFUND_POLICY.doctorCancelRefundPercentage,
        walletCredit: REFUND_POLICY.doctorCancelCompensationCredit,
        description: `100% refund + ₹${REFUND_POLICY.doctorCancelCompensationCredit} wallet credit as compensation`
      },
      noShow: {
        refundPercentage: REFUND_POLICY.noShowRefundPercentage,
        description: 'No refund for missed appointments'
      },
      fullRefundWindowHours: REFUND_POLICY.fullRefundHours
    };
  }

  async previewRefund(appointmentId, cancelledBy = 'patient') {
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name');
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    return this.calculateRefund(appointment, cancelledBy);
  }
}

module.exports = new RefundPolicyService();
