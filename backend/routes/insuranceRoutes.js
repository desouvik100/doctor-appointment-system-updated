/**
 * Insurance & TPA Integration Routes
 */

const express = require('express');
const router = express.Router();
const InsuranceClaim = require('../models/InsuranceClaim');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Create new claim
router.post('/claims', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const claim = new InsuranceClaim({ ...req.body, createdBy: req.user?.userId });
    await claim.save();
    res.status(201).json({ success: true, claim, message: `Claim ${claim.claimNumber} created` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all claims for clinic
router.get('/claims/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { status, insuranceProvider, claimType, page = 1, limit = 20 } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (status) query.status = status;
    if (insuranceProvider) query.insuranceProvider = insuranceProvider;
    if (claimType) query.claimType = claimType;

    const claims = await InsuranceClaim.find(query)
      .populate('patientId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await InsuranceClaim.countDocuments(query);
    res.json({ success: true, claims, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get claim by ID
router.get('/claims/:id', verifyToken, async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id)
      .populate('patientId', 'name phone email')
      .populate('admissionId')
      .populate('createdBy', 'name');
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update claim
router.put('/claims/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const claim = await InsuranceClaim.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.userId },
      { new: true }
    );
    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit claim
router.post('/claims/:id/submit', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const claim = await InsuranceClaim.findByIdAndUpdate(
      req.params.id,
      { status: 'submitted', submittedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, claim, message: 'Claim submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pre-authorization request
router.post('/claims/:id/pre-auth', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { preAuthAmount } = req.body;
    const claim = await InsuranceClaim.findByIdAndUpdate(
      req.params.id,
      { 
        preAuthDate: new Date(),
        preAuthAmount,
        preAuthStatus: 'pending',
        status: 'under_review'
      },
      { new: true }
    );
    res.json({ success: true, claim, message: 'Pre-authorization requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add query response
router.post('/claims/:id/query-response', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { queryIndex, response } = req.body;
    const claim = await InsuranceClaim.findById(req.params.id);
    if (claim.queries[queryIndex]) {
      claim.queries[queryIndex].response = response;
      claim.queries[queryIndex].respondedAt = new Date();
      claim.queries[queryIndex].status = 'responded';
      await claim.save();
    }
    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get claim statistics
router.get('/stats/:clinicId', verifyToken, async (req, res) => {
  try {
    const stats = await InsuranceClaim.aggregate([
      { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$claimAmount' },
        approvedAmount: { $sum: '$approvedAmount' }
      }}
    ]);

    const byProvider = await InsuranceClaim.aggregate([
      { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId) } },
      { $group: {
        _id: '$insuranceProvider',
        count: { $sum: 1 },
        totalAmount: { $sum: '$claimAmount' }
      }},
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    res.json({ success: true, stats, byProvider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify insurance eligibility (mock)
router.post('/verify-eligibility', verifyToken, async (req, res) => {
  try {
    const { policyNumber, insuranceProvider, patientName, dob } = req.body;
    // In production, this would call the insurance provider's API
    const eligibility = {
      isEligible: true,
      policyNumber,
      insuranceProvider,
      patientName,
      planName: 'Gold Health Plan',
      sumInsured: 500000,
      availableBalance: 450000,
      copayPercentage: 10,
      roomRentLimit: 5000,
      preExistingWaitingPeriod: '2 years',
      networkHospital: true,
      verifiedAt: new Date()
    };
    res.json({ success: true, eligibility });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
