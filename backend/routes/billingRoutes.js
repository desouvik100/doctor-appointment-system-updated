/**
 * Clinic Billing Routes
 * API endpoints for billing and revenue management
 */

const express = require('express');
const router = express.Router();
const ClinicBilling = require('../models/ClinicBilling');
const { verifyToken } = require('../middleware/auth');

// Get all bills for a clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status, paymentStatus, startDate, endDate, patientId, page = 1, limit = 50 } = req.query;
    
    const query = { clinicId };
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (patientId) query.patientId = patientId;
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }
    
    const bills = await ClinicBilling.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ billDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ClinicBilling.countDocuments(query);
    
    res.json({
      success: true,
      bills,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single bill
router.get('/bill/:billId', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId)
      .populate('patientId', 'name email phone address')
      .populate('doctorId', 'name specialization')
      .populate('visitId');
    
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new bill
router.post('/create', verifyToken, async (req, res) => {
  try {
    const bill = new ClinicBilling({ ...req.body, createdBy: req.user?.id });
    await bill.save();
    res.status(201).json({ success: true, bill, message: 'Bill created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update bill
router.put('/bill/:billId', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status === 'finalized') {
      return res.status(400).json({ success: false, message: 'Cannot edit finalized bill' });
    }
    
    Object.assign(bill, req.body, { updatedBy: req.user?.id });
    await bill.save();
    res.json({ success: true, bill, message: 'Bill updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Finalize bill
router.post('/bill/:billId/finalize', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    
    bill.status = 'finalized';
    bill.updatedBy = req.user?.id;
    await bill.save();
    res.json({ success: true, bill, message: 'Bill finalized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add payment to bill
router.post('/bill/:billId/payment', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    
    await bill.addPayment({ ...req.body, receivedBy: req.user?.id });
    res.json({ success: true, bill, message: 'Payment recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel bill
router.post('/bill/:billId/cancel', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    
    bill.status = 'cancelled';
    bill.paymentStatus = 'cancelled';
    bill.cancelledBy = req.user?.id;
    bill.cancelledAt = new Date();
    bill.cancellationReason = req.body.reason;
    await bill.save();
    res.json({ success: true, bill, message: 'Bill cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process refund
router.post('/bill/:billId/refund', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    
    bill.refund = {
      isRefunded: true,
      amount: req.body.amount,
      reason: req.body.reason,
      refundedAt: new Date(),
      refundedBy: req.user?.id,
      transactionId: req.body.transactionId
    };
    bill.paymentStatus = 'refunded';
    await bill.save();
    res.json({ success: true, bill, message: 'Refund processed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue summary
router.get('/clinic/:clinicId/revenue-summary', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await ClinicBilling.getRevenueSummary(req.params.clinicId, start, end);
    res.json({ success: true, summary: summary[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get daily revenue
router.get('/clinic/:clinicId/daily-revenue', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await ClinicBilling.getDailyRevenue(req.params.clinicId, parseInt(days));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending payments
router.get('/clinic/:clinicId/pending', verifyToken, async (req, res) => {
  try {
    const bills = await ClinicBilling.find({
      clinicId: req.params.clinicId,
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] },
      status: 'finalized'
    })
    .populate('patientId', 'name phone')
    .sort({ dueDate: 1 });
    
    const totalPending = bills.reduce((sum, b) => sum + b.dueAmount, 0);
    res.json({ success: true, bills, totalPending, count: bills.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update insurance claim
router.put('/bill/:billId/insurance', verifyToken, async (req, res) => {
  try {
    const bill = await ClinicBilling.findById(req.params.billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    
    bill.insuranceClaim = { ...bill.insuranceClaim, ...req.body };
    bill.updatedBy = req.user?.id;
    await bill.save();
    res.json({ success: true, bill, message: 'Insurance claim updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient billing history
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const bills = await ClinicBilling.find({ patientId: req.params.patientId, status: 'finalized' })
      .populate('clinicId', 'name')
      .sort({ billDate: -1 });
    
    const totalSpent = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalPending = bills.reduce((sum, b) => sum + b.dueAmount, 0);
    
    res.json({ success: true, bills, totalSpent, totalPending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
