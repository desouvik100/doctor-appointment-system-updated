

const EMRSubscription = require('../models/EMRSubscription');
const Clinic = require('../models/Clinic');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { SUBSCRIPTION_PLANS, calculateExpiryDate } = require('../config/emrConfig');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class EMRSubscriptionService {

  static getPlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  static getPlanDetails(planId) {
    return SUBSCRIPTION_PLANS[planId] || null;
  }

  static async createSubscriptionOrder(clinicId, planId, duration, userId) {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
     }
      if (!['6_months', '1_year'].includes(duration)) {
        throw new Error('Invalid duration selected');
      }
      const pricing = plan.pricing[duration];
      if (!pricing) {
        throw new Error('Pricing not available for this duration');
      }
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        throw new Error('Clinic not found');
      }
      const existingSubscription = await EMRSubscription.getActiveForClinic(clinicId);
     if (existingSubscription && !existingSubscription.isExpired) {
        throw new Error('Clinic already has an active subscription. Please upgrade or wait for expiry.');
      }
      const orderOptions = {
        amount: pricing.amount * 100, 
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

  static async verifyAndActivate(paymentData) {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        subscriptionId 
      } = paymentData;
      const subscription = await EMRSubscription.findOne({
        _id: subscriptionId,
        'paymentDetails.razorpayOrderId': razorpay_order_id,
        status: 'pending'
      });
      
      if (!subscription) {
        throw new Error('Subscription not found or already processed');
     }
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
      subscription.status = 'active';
     subscription.startDate = new Date();
      subscription.expiryDate = calculateExpiryDate(new Date(), subscription.duration);
      subscription.paymentDetails.razorpayPaymentId = razorpay_payment_id;
      subscription.paymentDetails.razorpaySignature = razorpay_signature;
      subscription.paymentDetails.paidAt = new Date();
      subscription.paymentDetails.invoiceNumber = `EMR-${Date.now()}`;
      
      await subscription.save();
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

  static async getSubscriptionHistory(clinicId) {
    return EMRSubscription.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(10);
  }

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
      const planOrder = { basic: 1, standard: 2, advanced: 3 };
      if (planOrder[newPlanId] <= planOrder[currentSubscription.plan]) {
        throw new Error('Can only upgrade to a higher plan');
      }
      const daysRemaining = currentSubscription.daysRemaining;
      const totalDays = currentSubscription.duration === '6_months' ? 180 : 365;
      const currentDailyRate = currentPlan.pricing[currentSubscription.duration].amount / totalDays;
     const newDailyRate = newPlan.pricing[currentSubscription.duration].amount / totalDays;
     const proratedAmount = Math.round((newDailyRate - currentDailyRate) * daysRemaining);
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

  static async processUpgrade(clinicId, newPlanId, paymentData) {
    try {
      const subscription = await EMRSubscription.getActiveForClinic(clinicId);
      
      if (!subscription) {
       throw new Error('No active subscription found');
      }
      subscription.planHistory.push({
        fromPlan: subscription.plan,
        toPlan: newPlanId,
        changedAt: new Date(),
        reason: 'upgrade'
      });
      subscription.plan = newPlanId;
      subscription.limits = SUBSCRIPTION_PLANS[newPlanId].limits;
      
      await subscription.save();
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

  static async checkExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await EMRSubscription.find({
        status: 'active',
        expiryDate: { $lt: new Date() }
      });
      
      for (const subscription of expiredSubscriptions) {
        subscription.status = 'expired';
        await subscription.save();
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

  static async sendExpiryReminders() {
    try {
      const reminders = [];
     const thirtyDayExpiring = await EMRSubscription.findExpiring(30);
      for (const sub of thirtyDayExpiring) {
        if (!sub.remindersSent.thirtyDays) {
          reminders.push({ subscription: sub, days: 30 });
          sub.remindersSent.thirtyDays = true;
          await sub.save();
        }
      }
      const sevenDayExpiring = await EMRSubscription.findExpiring(7);
      for (const sub of sevenDayExpiring) {
        if (!sub.remindersSent.sevenDays) { 
          reminders.push({ subscription: sub, days: 7 });
          sub.remindersSent.sevenDays = true;
          await sub.save();
        }
      }
      const oneDayExpiring = await EMRSubscription.findExpiring(1);
      for (const sub of oneDayExpiring) {
        if (!sub.remindersSent.oneDay) {
          reminders.push({ subscription: sub, days: 1 });
          sub.remindersSent.oneDay = true;
          await sub.save();
        }
      }
      for (const { subscription, days } of reminders) {
        try {
          const clinic = await Clinic.findById(subscription.clinicId).select('name email');
          if (clinic?.email) {
            const { sendEmail } = require('./emailService');
            const planName = subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1) || 'EMR';
            await sendEmail({
              to: clinic.email,
              subject: `⚠️ Your HealthSync EMR Subscription Expires in ${days} Day${days > 1 ? 's' : ''}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 22px;">🏥 HealthSync EMR</h1>
                    <p style="margin: 8px 0 0; opacity: 0.9;">Subscription Expiry Reminder</p>
                 </div> 
                  <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
                    <p>Dear <strong>${clinic.name}</strong>,</p>
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
                      <strong style="color: #92400e;">⏰ Your ${planName} plan expires in ${days} day${days > 1 ? 's' : ''}.</strong>
                    </div>
                    <p>Renew now to avoid interruption to your clinic operations.</p>
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${process.env.FRONTEND_URL || 'https://healthsyncpro.in'}/#emr-renew"
                         style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                        Renew Subscription
                      </a>
                    </div>
                    <p style="color: #64748b; font-size: 13px;">Need help? Contact us at support@healthsyncpro.in</p>
                  </div>
                </div>
              `
            });
            console.log(`📧 EMR expiry reminder (${days}d) sent to ${clinic.email}`);
         }
        } catch (emailErr) {
          console.error(`Failed to send EMR reminder for clinic ${subscription.clinicId}:`, emailErr.message);
        }
      }

      return reminders;
    } catch (error) {
      console.error('Error sending expiry reminders:', error);
      throw error;
    }
  }

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
