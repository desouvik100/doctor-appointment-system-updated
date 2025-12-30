/**
 * Admin Billing & Expenses Routes
 * API endpoints for admin financial management
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Expense Schema (inline for simplicity)
const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: ['salary', 'rent', 'utilities', 'marketing', 'software', 'maintenance', 'supplies', 'legal', 'insurance', 'other'] },
  description: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ type: String }],
  notes: { type: String }
}, { timestamps: true });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

// Get all bills (admin view)
router.get('/billing/all', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, status, limit = 100 } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (status) query.status = status;

    // Try to get bills from ClinicBilling model
    let bills = [];
    try {
      const ClinicBilling = require('../models/ClinicBilling');
      bills = await ClinicBilling.find(query)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    } catch (e) {
      // Model might not exist, return empty
    }

    // Also get from Payment model
    try {
      const Payment = require('../models/Payment');
      const payments = await Payment.find(query)
        .populate('userId', 'name email')
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      // Merge payments as bills
      const paymentBills = payments.map(p => ({
        _id: p._id,
        billNumber: p.transactionId || p._id.toString().slice(-6),
        patientName: p.userId?.name || 'Unknown',
        grandTotal: p.amount,
        status: p.status === 'completed' ? 'paid' : p.status,
        createdAt: p.createdAt
      }));
      
      bills = [...bills, ...paymentBills];
    } catch (e) {
      // Model might not exist
    }

    res.json({ success: true, bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all expenses
router.get('/expenses', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name');

    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new expense
router.post('/expenses', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { category, description, amount, date, notes } = req.body;

    const expense = new Expense({
      category,
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      notes,
      createdBy: req.user?.userId
    });

    await expense.save();

    res.status(201).json({ success: true, expense, message: 'Expense added successfully' });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update expense
router.put('/expenses/:id', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, expense });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete expense
router.delete('/expenses/:id', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get financial summary
router.get('/financial-summary', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Get total revenue from payments
    let totalRevenue = 0;
    let pendingPayments = 0;
    
    try {
      const Payment = require('../models/Payment');
      const revenueAgg = await Payment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      totalRevenue = revenueAgg[0]?.total || 0;

      const pendingAgg = await Payment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      pendingPayments = pendingAgg[0]?.total || 0;
    } catch (e) {
      // Payment model might not exist
    }

    // Also check ClinicBilling
    try {
      const ClinicBilling = require('../models/ClinicBilling');
      const billingAgg = await ClinicBilling.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: 'finalized' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);
      totalRevenue += billingAgg[0]?.total || 0;
    } catch (e) {
      // Model might not exist
    }

    // Get total expenses
    const expenseAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    res.json({
      success: true,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingPayments,
      period: { start, end }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expense breakdown by category
router.get('/expenses/breakdown', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const breakdown = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, breakdown });
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
