const express = require('express');
const router = express.Router();
const CommissionConfig = require('../models/CommissionConfig');
const FinancialLedger = require('../models/FinancialLedger');
const Payout = require('../models/Payout');
const commissionService = require('../services/commissionService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Middleware aliases
const protect = verifyToken;
const adminOnly = verifyTokenWithRole(['admin']);

// ===== COMMISSION CONFIG ROUTES =====

// Get global commission config
router.get('/config', adminOnly, async (req, res) => {
  try {
    const config = await CommissionConfig.getConfigForClinic(null);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get config for specific clinic
router.get('/config/clinic/:clinicId', adminOnly, async (req, res) => {
  try {
    const config = await CommissionConfig.getConfigForClinic(req.params.clinicId);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update global commission config
router.put('/config', adminOnly, async (req, res) => {
  try {
    const { onlineCommission, inClinicCommission, gstRate, paymentGateway, payoutConfig } = req.body;
    
    let config = await CommissionConfig.findOne({ configType: 'global' });
    
    if (!config) {
      config = new CommissionConfig({ configType: 'global' });
    }
    
    if (onlineCommission) config.onlineCommission = onlineCommission;
    if (inClinicCommission) config.inClinicCommission = inClinicCommission;
    if (gstRate) config.gstRate = gstRate;
    if (paymentGateway) config.paymentGateway = paymentGateway;
    if (payoutConfig) config.payoutConfig = payoutConfig;
    config.updatedBy = req.user.id;
    
    await config.save();
    res.json({ success: true, data: config, message: 'Commission config updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create/Update clinic-specific config
router.put('/config/clinic/:clinicId', adminOnly, async (req, res) => {
  try {
    const { onlineCommission, inClinicCommission, gstRate, paymentGateway, payoutConfig } = req.body;
    
    let config = await CommissionConfig.findOne({ 
      configType: 'clinic', 
      clinicId: req.params.clinicId 
    });
    
    if (!config) {
      config = new CommissionConfig({ 
        configType: 'clinic', 
        clinicId: req.params.clinicId,
        createdBy: req.user.id
      });
    }
    
    if (onlineCommission) config.onlineCommission = onlineCommission;
    if (inClinicCommission) config.inClinicCommission = inClinicCommission;
    if (gstRate !== undefined) config.gstRate = gstRate;
    if (paymentGateway) config.paymentGateway = paymentGateway;
    if (payoutConfig) config.payoutConfig = payoutConfig;
    config.updatedBy = req.user.id;
    
    await config.save();
    res.json({ success: true, data: config, message: 'Clinic commission config updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete clinic-specific config (revert to global)
router.delete('/config/clinic/:clinicId', adminOnly, async (req, res) => {
  try {
    await CommissionConfig.deleteOne({ 
      configType: 'clinic', 
      clinicId: req.params.clinicId 
    });
    res.json({ success: true, message: 'Clinic config removed, will use global config' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CALCULATION PREVIEW =====

// Preview commission calculation
router.post('/calculate', protect, async (req, res) => {
  try {
    const { consultationFee, consultationType, clinicId } = req.body;
    
    if (!consultationFee || !consultationType) {
      return res.status(400).json({ 
        success: false, 
        message: 'consultationFee and consultationType are required' 
      });
    }
    
    const breakdown = await commissionService.calculateFinancialBreakdown({
      consultationFee,
      consultationType,
      clinicId
    });
    
    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== LEDGER ROUTES =====

// Get ledger entries for a doctor
router.get('/ledger/doctor/:doctorId', protect, async (req, res) => {
  try {
    const { startDate, endDate, status, payoutStatus } = req.query;
    
    const query = { doctorId: req.params.doctorId };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status) query.status = status;
    if (payoutStatus) query.payoutStatus = payoutStatus;
    
    const entries = await FinancialLedger.find(query)
      .populate('appointmentId', 'date time consultationType')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single ledger entry
router.get('/ledger/:id', protect, async (req, res) => {
  try {
    const entry = await FinancialLedger.findById(req.params.id)
      .populate('appointmentId')
      .populate('doctorId', 'name')
      .populate('clinicId', 'name')
      .populate('userId', 'name');
    
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    }
    
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PAYOUT ROUTES =====

// Get all payouts (admin)
router.get('/payouts', adminOnly, async (req, res) => {
  try {
    const { status, doctorId, startDate, endDate } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const payouts = await Payout.find(query)
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payouts for a doctor
router.get('/payouts/doctor/:doctorId', protect, async (req, res) => {
  try {
    const payouts = await Payout.find({ doctorId: req.params.doctorId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: payouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single payout details
router.get('/payouts/:id', protect, async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('ledgerEntries');
    
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }
    
    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create payout for doctor
router.post('/payouts/create', adminOnly, async (req, res) => {
  try {
    const { doctorId, cycle, periodStart, periodEnd } = req.body;
    
    const payout = await commissionService.createPayout(
      doctorId,
      cycle || 'weekly',
      new Date(periodStart),
      new Date(periodEnd)
    );
    
    if (!payout) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending earnings found for this period' 
      });
    }
    
    res.json({ success: true, data: payout, message: 'Payout created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve payout
router.put('/payouts/:id/approve', adminOnly, async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }
    
    await payout.approve(req.user.id);
    res.json({ success: true, data: payout, message: 'Payout approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process payout (mark as completed)
router.put('/payouts/:id/process', adminOnly, async (req, res) => {
  try {
    const { transactionReference } = req.body;
    
    if (!transactionReference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction reference is required' 
      });
    }
    
    const payout = await commissionService.processPayout(
      req.params.id,
      transactionReference,
      req.user.id
    );
    
    res.json({ success: true, data: payout, message: 'Payout processed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark payout as failed
router.put('/payouts/:id/fail', adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const payout = await Payout.findById(req.params.id);
    
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }
    
    await payout.markFailed(reason || 'Unknown error');
    
    // Revert ledger entries to pending
    await FinancialLedger.updateMany(
      { payoutId: payout._id },
      { payoutStatus: 'pending', payoutId: null }
    );
    
    res.json({ success: true, data: payout, message: 'Payout marked as failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== REPORTS =====

// Doctor earnings report
router.get('/reports/doctor/:doctorId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const report = await commissionService.getDoctorEarningsReport(
      req.params.doctorId,
      start,
      end
    );
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin revenue report
router.get('/reports/admin/revenue', adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const report = await commissionService.getAdminRevenueReport(start, end);
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export doctor report as CSV
router.get('/reports/doctor/:doctorId/export', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const report = await commissionService.getDoctorEarningsReport(
      req.params.doctorId,
      start,
      end
    );
    
    const csv = await commissionService.exportToCSV(report.entries, 'doctor');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=earnings-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export admin report as CSV
router.get('/reports/admin/export', adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const entries = await FinancialLedger.find({
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    });
    
    const csv = await commissionService.exportToCSV(entries, 'admin');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending payout summary for doctor
router.get('/pending/:doctorId', protect, async (req, res) => {
  try {
    const pending = await commissionService.getPendingPayouts(req.params.doctorId);
    res.json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
