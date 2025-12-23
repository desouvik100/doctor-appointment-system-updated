/**
 * EMR Subscription Service
 * Handles subscription creation, management, and Razorpay integration
 */

const EMRSubscription = require('../models/EMRSubscription');
const Clinic = require('../models/Clinic');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { SUBSCRIPTION_PLANS, calculateExpiryDate } = require('../config/emrConfig');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class EMRSubscriptionService {
  
  /**
   * Get all available plans
   */
  static getPlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }
  
  /**
   * Get plan details by ID
   */
  static getPlanDetails(planId) {
    return SUBSCRIPTION_PLANS[planId] || null;
  }
  
  /**
   * Create a new subscription order (Razorpay)
   */
  static async createSubscriptionOrder(clinicId, planId, duration, userId) {
    try {
      // Validate plan
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
      }
      
      // Validate duration
      if (!['6_months', '1_year'].includes(duration)) {
        throw new Error('Invalid duration selected');
      }
      
      // Get pricing
      const pricing = plan.pricing[duration];
      if (!pricing) {
        throw new Error('Pricing not available for this duration');
      }
      
      // Check if clinic exists
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        throw new Error('Clinic not found');
      }
      
      // Check for existing active subscription
      const existingSubscription = await EMRSubscription.getActiveForClinic(clinicId);
      if (existingSubscription && !existingSubscription.isExpired) {
        throw new Error('Clinic already has an active subscription. Please upgrade or wait for expiry.');
      }
      
      // Create Razorpay order
      const orderOptions = {
        amount: pricing.amount * 100, // Razorpay expects paise
        currency: pricing.currency,
        receipt: `emr_${clinicId}_${Date.now()}`,
        notes: {
          clinicId: clinicId.toString(),
          planId,
          duration,
          type: 'emr_subscription'
        }
      };
      
      const order = await razorpay.orders.create(orderOptions);
      
      // Create pending subscription record
      const subscription = new EMRSubscription({
        clinicId,
        plan: planId,
        duration,
        startDate: new Date(),
        status: 'pending',
        paymentDetails: {
          razorpayOrderId: order.id,
          amount: pricing.amount,
          currency: pricing.currency
        },
        limits: plan.limits,
        createdBy: userId
      });
      
      await subscription.save();
      
      return {
        orderId: order.id,
        amount: pricing.amount,
        currency: pricing.currency,
        subscriptionId: subscription._id,
        plan: {
          id: planId,
          name: plan.name,
          duration
        },
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Error creating subscription order:', error);
      throw error;
    }
  }
  
  /**
   * Verify payment and activate subscription
   */
  static async verifyAndActivate(paymentData) {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        subscriptionId 
      } = paymentData;
      
      // Find pending subscription
      const subscription = await EMRSubscription.findOne({
        _id: subscriptionId,
        'paymentDetails.razorpayOrderId': razorpay_order_id,
        status: 'pending'
      });
      
      if (!subscription) {
        throw new Error('Subscription not found or already processed');
      }
      
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      
      if (expectedSignature !== razorpay_signature) {
        subscription.status = 'cancelled';
        await subscription.save();
        throw new Error('Payment verification failed');
      }
      
      // Activate subscription
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.expiryDate = calculateExpiryDate(new Date(), subscription.duration);
      subscription.paymentDetails.razorpayPaymentId = razorpay_payment_id;
      subscription.paymentDetails.razorpaySignature = razorpay_signature;
      subscription.paymentDetails.paidAt = new Date();
      subscription.paymentDetails.invoiceNumber = `EMR-${Date.now()}`;
      
      await subscription.save();
      
      // Update clinic with EMR status
      await Clinic.findByIdAndUpdate(subscription.clinicId, {
        emrEnabled: true,
        emrPlan: subscription.plan,
        emrExpiryDate: subscription.expiryDate
      });
      
      return {
        success: true,
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          startDate: subscription.startDate,
          expiryDate: subscription.expiryDate,
          daysRemaining: subscription.daysRemaining
        }
      };
    } catch (error) {
      console.error('Error verifying subscription payment:', error);
      throw error;
    }
  }
  
  /**
   * Get active subscription for clinic
   */
  static async getActiveSubscription(clinicId) {
    const subscription = await EMRSubscription.getActiveForClinic(clinicId);
    
    if (!subscription) {
      return null;
    }
    
    const plan = SUBSCRIPTION_PLANS[subscription.plan];
    
    return {
      id: subscription._id,
      plan: subscription.plan,
      planName: plan?.name,
      planFeatures: plan?.features,
      duration: subscription.duration,
      startDate: subscription.startDate,
      expiryDate: subscription.expiryDate,
      daysRemaining: subscription.daysRemaining,
      status: subscription.status,
      limits: subscription.limits,
      autoRenew: subscription.autoRenew
    };
  }
  
  /**
   * Get subscription history for clinic
   */
  static async getSubscriptionHistory(clinicId) {
    return EMRSubscription.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(10);
  }
  
  /**
   * Upgrade subscription plan
   */
  static async upgradePlan(clinicId, newPlanId, userId) {
    try {
      const currentSubscription = await EMRSubscription.getActiveForClinic(clinicId);
      
      if (!currentSubscription) {
        throw new Error('No active subscription to upgrade');
      }
      
      const currentPlan = SUBSCRIPTION_PLANS[currentSubscription.plan];
      const newPlan = SUBSCRIPTION_PLANS[newPlanId];
      
      if (!newPlan) {
        throw new Error('Invalid plan selected');
      }
      
      // Check if it's actually an upgrade
      const planOrder = { basic: 1, standard: 2, advanced: 3 };
      if (planOrder[newPlanId] <= planOrder[currentSubscription.plan]) {
        throw new Error('Can only upgrade to a higher plan');
      }
      
      // Calculate prorated amount
      const daysRemaining = currentSubscription.daysRemaining;
      const totalDays = currentSubscription.duration === '6_months' ? 180 : 365;
      const currentDailyRate = currentPlan.pricing[currentSubscription.duration].amount / totalDays;
      const newDailyRate = newPlan.pricing[currentSubscription.duration].amount / totalDays;
      const proratedAmount = Math.round((newDailyRate - currentDailyRate) * daysRemaining);
      
      // Create upgrade order
      const orderOptions = {
        amount: proratedAmount * 100,
        currency: 'INR',
        receipt: `emr_upgrade_${clinicId}_${Date.now()}`,
        notes: {
          clinicId: clinicId.toString(),
          fromPlan: currentSubscription.plan,
          toPlan: newPlanId,
          type: 'emr_upgrade'
        }
      };
      
      const order = await razorpay.orders.create(orderOptions);
      
      return {
        orderId: order.id,
        amount: proratedAmount,
        currency: 'INR',
        currentPlan: currentSubscription.plan,
        newPlan: newPlanId,
        daysRemaining,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Error creating upgrade order:', error);
      throw error;
    }
  }
  
  /**
   * Process upgrade after payment
   */
  static async processUpgrade(clinicId, newPlanId, paymentData) {
    try {
      const subscription = await EMRSubscription.getActiveForClinic(clinicId);
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      // Record plan change
      subscription.planHistory.push({
        fromPlan: subscription.plan,
        toPlan: newPlanId,
        changedAt: new Date(),
        reason: 'upgrade'
      });
      
      // Update plan
      subscription.plan = newPlanId;
      subscription.limits = SUBSCRIPTION_PLANS[newPlanId].limits;
      
      await subscription.save();
      
      // Update clinic
      await Clinic.findByIdAndUpdate(clinicId, {
        emrPlan: newPlanId
      });
      
      return {
        success: true,
        newPlan: newPlanId,
        subscription
      };
    } catch (error) {
      console.error('Error processing upgrade:', error);
      throw error;
    }
  }
  
  /**
   * Renew subscription
   */
  static async renewSubscription(clinicId, duration, userId) {
    try {
      const currentSubscription = await EMRSubscription.findOne({
        clinicId,
        status: { $in: ['active', 'expired'] }
      }).sort({ createdAt: -1 });
      
      if (!currentSubscription) {
        throw new Error('No subscription found to renew');
      }
      
      const plan = SUBSCRIPTION_PLANS[currentSubscription.plan];
      const pricing = plan.pricing[duration];
      
      // Create renewal order
      const orderOptions = {
        amount: pricing.amount * 100,
        currency: pricing.currency,
        receipt: `emr_renew_${clinicId}_${Date.now()}`,
        notes: {
          clinicId: clinicId.toString(),
          planId: currentSubscription.plan,
          duration,
          type: 'emr_renewal',
          previousSubscriptionId: currentSubscription._id.toString()
        }
      };
      
      const order = await razorpay.orders.create(orderOptions);
      
      return {
        orderId: order.id,
        amount: pricing.amount,
        currency: pricing.currency,
        plan: currentSubscription.plan,
        duration,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Error creating renewal order:', error);
      throw error;
    }
  }
  
  /**
   * Check and update expired subscriptions
   */
  static async checkExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await EMRSubscription.find({
        status: 'active',
        expiryDate: { $lt: new Date() }
      });
      
      for (const subscription of expiredSubscriptions) {
        subscription.status = 'expired';
        await subscription.save();
        
        // Update clinic
        await Clinic.findByIdAndUpdate(subscription.clinicId, {
          emrEnabled: false
        });
        
        console.log(`EMR subscription expired for clinic: ${subscription.clinicId}`);
      }
      
      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
      throw error;
    }
  }
  
  /**
   * Send expiry reminders
   */
  static async sendExpiryReminders() {
    try {
      const reminders = [];
      
      // 30 days reminder
      const thirtyDayExpiring = await EMRSubscription.findExpiring(30);
      for (const sub of thirtyDayExpiring) {
        if (!sub.remindersSent.thirtyDays) {
          reminders.push({ subscription: sub, days: 30 });
          sub.remindersSent.thirtyDays = true;
          await sub.save();
        }
      }
      
      // 7 days reminder
      const sevenDayExpiring = await EMRSubscription.findExpiring(7);
      for (const sub of sevenDayExpiring) {
        if (!sub.remindersSent.sevenDays) {
          reminders.push({ subscription: sub, days: 7 });
          sub.remindersSent.sevenDays = true;
          await sub.save();
        }
      }
      
      // 1 day reminder
      const oneDayExpiring = await EMRSubscription.findExpiring(1);
      for (const sub of oneDayExpiring) {
        if (!sub.remindersSent.oneDay) {
          reminders.push({ subscription: sub, days: 1 });
          sub.remindersSent.oneDay = true;
          await sub.save();
        }
      }
      
      // TODO: Send actual email/notification for each reminder
      // This would integrate with your existing notification service
      
      return reminders;
    } catch (error) {
      console.error('Error sending expiry reminders:', error);
      throw error;
    }
  }
  
  /**
   * Toggle auto-renewal
   */
  static async toggleAutoRenew(clinicId, enabled) {
    const subscription = await EMRSubscription.getActiveForClinic(clinicId);
    
    if (!subscription) {
      throw new Error('No active subscription found');
    }
    
    subscription.autoRenew = enabled;
    await subscription.save();
    
    return { autoRenew: subscription.autoRenew };
  }
}

module.exports = EMRSubscriptionService;
