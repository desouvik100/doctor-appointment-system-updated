/**
 * Doctor Referral & Commission API Routes
 * Requirement 3: Doctor Earnings Protection (Zero-Commission Launch)
 */

const express = require('express');
const router = express.Router();
const DoctorReferral = require('../models/DoctorReferral');
const Doctor = require('../models/Doctor');
const { authenticate, checkRole } = require('../middleware/roleMiddleware');

// Get doctor's referral info
router.get('/my-referral', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ _id: req.user.id }, { email: req.user.email }]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const referral = await DoctorReferral.getOrCreateReferral(doctor._id, doctor.name);
    
    res.json({
      referralCode: referral.referralCode,
      tier: referral.tier,
      commissionRate: referral.commissionRate,
      appointmentCounts: referral.appointmentCounts,
      earnings: referral.earnings,
      referralStats: referral.referralStats,
      milestones: referral.milestones,
      badges: referral.badges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get competitor comparison
router.get('/comparison', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ _id: req.user.id }, { email: req.user.email }]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const referral = await DoctorReferral.findOne({ doctorId: doctor._id });
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral record not found' });
    }
    
    const comparison = referral.getCompetitorComparison();
    
    res.json({
      ...comparison,
      message: `You've saved ₹${comparison.savings.vsPracto.toFixed(0)} compared to Practo!`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get referral code for sharing
router.get('/share-code', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ _id: req.user.id }, { email: req.user.email }]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const referral = await DoctorReferral.getOrCreateReferral(doctor._id, doctor.name);
    
    const shareUrl = `https://healthsyncpro.in/doctor/register?ref=${referral.referralCode}`;
    const shareMessage = `Join HealthSyncPro with my referral code ${referral.referralCode} and get 50 FREE appointments (zero commission)! Register here: ${shareUrl}`;
    
    res.json({
      referralCode: referral.referralCode,
      shareUrl,
      shareMessage,
      whatsappLink: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      benefits: {
        forReferrer: '25 additional free appointments per referral',
        forNewDoctor: '50 free appointments + 100 at reduced rate (₹20)'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply referral code (during doctor registration)
router.post('/apply-code', async (req, res) => {
  try {
    const { referralCode, doctorId, doctorName } = req.body;
    
    // Find referrer
    const referrer = await DoctorReferral.findOne({ referralCode: referralCode.toUpperCase() });
    
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    // Create referral record for new doctor
    const newDoctorReferral = await DoctorReferral.getOrCreateReferral(
      doctorId, 
      doctorName, 
      referralCode
    );
    
    // Add to referrer's referred doctors
    referrer.referredDoctors.push({
      doctorId,
      name: doctorName,
      bonusAppointmentsGiven: 25
    });
    referrer.referralStats.totalReferred += 1;
    referrer.addReferralBonus(25);
    await referrer.save();
    
    res.json({
      message: 'Referral code applied successfully',
      benefits: {
        freeAppointments: newDoctorReferral.appointmentCounts.freeAppointments.total,
        reducedRateAppointments: newDoctorReferral.appointmentCounts.reducedAppointments.total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record appointment and calculate commission
router.post('/record-appointment', authenticate, async (req, res) => {
  try {
    const { doctorId, consultationFee, isOnline, appointmentId } = req.body;
    
    const referral = await DoctorReferral.findOne({ doctorId });
    
    if (!referral) {
      return res.status(404).json({ message: 'Doctor referral record not found' });
    }
    
    const result = referral.recordAppointment(consultationFee, isOnline);
    await referral.save();
    
    res.json({
      commission: result.commission,
      doctorEarning: result.doctorEarning,
      tier: result.tier,
      appointmentCounts: referral.appointmentCounts,
      message: result.tier === 'launch' 
        ? 'Free appointment (Launch offer)!' 
        : `Commission: ₹${result.commission}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get referred doctors list
router.get('/referred-doctors', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ _id: req.user.id }, { email: req.user.email }]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const referral = await DoctorReferral.findOne({ doctorId: doctor._id })
      .populate('referredDoctors.doctorId', 'name specialization');
    
    if (!referral) {
      return res.json({ referredDoctors: [], stats: {} });
    }
    
    res.json({
      referredDoctors: referral.referredDoctors,
      stats: referral.referralStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get milestones and badges
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [{ _id: req.user.id }, { email: req.user.email }]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const referral = await DoctorReferral.findOne({ doctorId: doctor._id });
    
    if (!referral) {
      return res.json({ milestones: [], badges: [] });
    }
    
    // Calculate progress to next milestone
    const total = referral.appointmentCounts.totalAppointments;
    const milestoneTargets = [1, 50, 100, 500, 1000];
    const nextTarget = milestoneTargets.find(t => t > total) || 1000;
    const prevTarget = milestoneTargets.filter(t => t <= total).pop() || 0;
    
    res.json({
      milestones: referral.milestones,
      badges: referral.badges,
      progress: {
        current: total,
        nextMilestone: nextTarget,
        progress: ((total - prevTarget) / (nextTarget - prevTarget) * 100).toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tier benefits
router.get('/tier-benefits', async (req, res) => {
  try {
    const tiers = {
      launch: {
        name: 'Launch',
        description: 'First 50 appointments',
        onlineCommission: '0%',
        clinicCommission: '₹0',
        benefits: ['Zero commission', 'Full earnings', 'Priority support']
      },
      growth: {
        name: 'Growth',
        description: 'Next 100 appointments',
        onlineCommission: '₹20 flat',
        clinicCommission: '₹20 flat',
        benefits: ['Flat ₹20 only', 'Dashboard analytics', 'WhatsApp integration']
      },
      standard: {
        name: 'Standard',
        description: 'After 150 appointments',
        onlineCommission: '10%',
        clinicCommission: '₹25',
        benefits: ['Still lower than competitors', 'Full analytics', 'Priority listing']
      },
      premium: {
        name: 'Premium',
        description: 'After 500 appointments',
        onlineCommission: '8%',
        clinicCommission: '₹20',
        benefits: ['Reduced rates', 'Featured listing', 'Marketing support']
      },
      loyalty: {
        name: 'Loyalty',
        description: 'After 1000 appointments',
        onlineCommission: '5%',
        clinicCommission: '₹15',
        benefits: ['Lowest rates', 'VIP support', 'Co-marketing', 'Revenue share']
      }
    };
    
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all doctor referrals
router.get('/admin/all', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { tier, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (tier) query.tier = tier;
    
    const referrals = await DoctorReferral.find(query)
      .populate('doctorId', 'name email specialization')
      .sort({ 'appointmentCounts.totalAppointments': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await DoctorReferral.countDocuments(query);
    
    res.json({
      referrals,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get commission summary
router.get('/admin/summary', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const referrals = await DoctorReferral.find({});
    
    const summary = {
      totalDoctors: referrals.length,
      byTier: {},
      totalCommissionCollected: 0,
      totalDoctorEarnings: 0,
      totalSavingsForDoctors: 0
    };
    
    referrals.forEach(r => {
      summary.byTier[r.tier] = (summary.byTier[r.tier] || 0) + 1;
      summary.totalCommissionCollected += r.earnings.totalCommissionPaid;
      summary.totalDoctorEarnings += r.earnings.totalEarnings;
      summary.totalSavingsForDoctors += r.earnings.totalCommissionSaved;
    });
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
