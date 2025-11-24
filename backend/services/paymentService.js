const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

class PaymentService {
  constructor() {
    this.currency = process.env.CURRENCY || 'inr';
    this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 7;
    this.gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 22;
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

  // Create Stripe Payment Intent
  async createPaymentIntent(appointmentId, userId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name consultationFee')
        .populate('userId', 'name email');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.userId._id.toString() !== userId) {
        throw new Error('Unauthorized access to appointment');
      }

      const paymentBreakdown = this.calculatePaymentBreakdown(appointment.doctorId.consultationFee);

      // Create Stripe customer if not exists
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: appointment.userId.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: appointment.userId.email,
          name: appointment.userId.name,
          metadata: {
            userId: userId,
            appointmentId: appointmentId
          }
        });
      }

      // Create Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentBreakdown.total * 100, // Stripe expects amount in smallest currency unit
        currency: this.currency,
        customer: customer.id,
        metadata: {
          appointmentId: appointmentId,
          userId: userId,
          doctorId: appointment.doctorId._id.toString(),
          consultationFee: paymentBreakdown.consultationFee.toString(),
          gst: paymentBreakdown.gst.toString(),
          platformFee: paymentBreakdown.platformFee.toString()
        },
        description: `Consultation with ${appointment.doctorId.name}`,
        receipt_email: appointment.userId.email,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update appointment with payment intent
      appointment.paymentIntentId = paymentIntent.id;
      appointment.paymentStatus = 'pending';
      await appointment.save();

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentBreakdown.total,
        breakdown: paymentBreakdown,
        customer: {
          id: customer.id,
          email: customer.email
        }
      };

    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment and update appointment
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const appointmentId = paymentIntent.metadata.appointmentId;
        
        const appointment = await Appointment.findById(appointmentId);
        if (appointment) {
          appointment.paymentStatus = 'completed';
          appointment.status = 'confirmed';
          appointment.paymentDetails = {
            paymentIntentId: paymentIntentId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method,
            paidAt: new Date()
          };
          await appointment.save();
        }

        return {
          success: true,
          appointment: appointment,
          paymentDetails: paymentIntent
        };
      } else {
        throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
      }

    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(appointmentId, reason = 'Appointment cancelled') {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment || !appointment.paymentIntentId) {
        throw new Error('No payment found for this appointment');
      }

      if (appointment.paymentStatus !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: appointment.paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
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
        doctor: appointment.doctorId.name,
        specialization: appointment.doctorId.specialization,
        clinic: appointment.clinicId?.name,
        date: appointment.date,
        time: appointment.time,
        amount: appointment.paymentDetails?.amount || 0,
        currency: appointment.paymentDetails?.currency || this.currency,
        status: appointment.paymentStatus,
        paymentMethod: appointment.paymentDetails?.paymentMethod,
        paidAt: appointment.paymentDetails?.paidAt,
        refundDetails: appointment.refundDetails
      }));

    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Handle Stripe webhooks
  async handleWebhook(body, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        case 'charge.dispute.created':
          await this.handleDispute(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    const appointmentId = paymentIntent.metadata.appointmentId;
    const appointment = await Appointment.findById(appointmentId);
    
    if (appointment && appointment.paymentStatus !== 'completed') {
      appointment.paymentStatus = 'completed';
      appointment.status = 'confirmed';
      appointment.paymentDetails = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        paidAt: new Date()
      };
      await appointment.save();
      
      // Here you could send confirmation email/SMS
      console.log(`Payment confirmed for appointment ${appointmentId}`);
    }
  }

  async handlePaymentFailure(paymentIntent) {
    const appointmentId = paymentIntent.metadata.appointmentId;
    const appointment = await Appointment.findById(appointmentId);
    
    if (appointment) {
      appointment.paymentStatus = 'failed';
      appointment.status = 'pending';
      await appointment.save();
      
      // Here you could send failure notification
      console.log(`Payment failed for appointment ${appointmentId}`);
    }
  }

  async handleDispute(charge) {
    // Handle payment disputes/chargebacks
    console.log(`Dispute created for charge ${charge.id}`);
    // Implement dispute handling logic
  }
}

module.exports = new PaymentService();