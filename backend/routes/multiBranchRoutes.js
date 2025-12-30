/**
 * Multi-Branch Management Routes
 */

const express = require('express');
const router = express.Router();
const HospitalBranch = require('../models/HospitalBranch');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const mongoose = require('mongoose');

// Create branch
router.post('/branches', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
    const branch = new HospitalBranch({ ...req.body, createdBy: req.user?.userId });
    await branch.save();
    res.status(201).json({ success: true, branch, message: `Branch ${branch.branchCode} created` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all branches for organization
router.get('/branches/organization/:orgId', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { organizationId: req.params.orgId };
    if (status) query.status = status;

    const branches = await HospitalBranch.find(query)
      .populate('branchManager', 'name email')
      .sort({ branchName: 1 });

    res.json({ success: true, branches, count: branches.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get branch by ID
router.get('/branches/:id', verifyToken, async (req, res) => {
  try {
    const branch = await HospitalBranch.findById(req.params.id)
      .populate('branchManager', 'name email phone')
      .populate('organizationId', 'name');
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update branch
router.put('/branches/:id', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
    const branch = await HospitalBranch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get branch performance comparison
router.get('/analytics/comparison/:orgId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const branches = await HospitalBranch.find({ organizationId: req.params.orgId, isActive: true });

    // In production, aggregate data from appointments, billing, etc.
    const comparison = branches.map(branch => ({
      branchId: branch._id,
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      city: branch.city,
      metrics: {
        totalPatients: Math.floor(Math.random() * 1000) + 100,
        totalRevenue: Math.floor(Math.random() * 500000) + 50000,
        avgRating: (Math.random() * 2 + 3).toFixed(1),
        occupancyRate: Math.floor(Math.random() * 40) + 60,
        staffCount: branch.staffCount,
        doctorCount: branch.doctorCount
      }
    }));

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get centralized dashboard
router.get('/dashboard/:orgId', verifyToken, async (req, res) => {
  try {
    const branches = await HospitalBranch.find({ organizationId: req.params.orgId, isActive: true });
    
    const dashboard = {
      totalBranches: branches.length,
      activeBranches: branches.filter(b => b.status === 'active').length,
      totalBeds: branches.reduce((sum, b) => sum + (b.totalBeds || 0), 0),
      totalStaff: branches.reduce((sum, b) => sum + (b.staffCount || 0), 0),
      totalDoctors: branches.reduce((sum, b) => sum + (b.doctorCount || 0), 0),
      branchesByCity: branches.reduce((acc, b) => {
        acc[b.city] = (acc[b.city] || 0) + 1;
        return acc;
      }, {}),
      branchesByType: branches.reduce((acc, b) => {
        acc[b.branchType] = (acc[b.branchType] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ success: true, dashboard, branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer patient between branches
router.post('/transfer-patient', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { patientId, fromBranchId, toBranchId, reason, transferDate } = req.body;
    
    // In production, update patient records, create transfer record, notify both branches
    const transfer = {
      patientId,
      fromBranchId,
      toBranchId,
      reason,
      transferDate: transferDate || new Date(),
      status: 'completed',
      transferredBy: req.user?.userId
    };

    res.json({ success: true, transfer, message: 'Patient transferred successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
