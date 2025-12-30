/**
 * Clinic Analytics Routes
 * API endpoints for analytics and reporting
 */

const express = require('express');
const router = express.Router();
const ClinicAnalytics = require('../models/ClinicAnalytics');
const ClinicBilling = require('../models/ClinicBilling');
const StaffSchedule = require('../models/StaffSchedule');
const PharmacyInventory = require('../models/PharmacyInventory');
const { verifyToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get dashboard summary
router.get('/clinic/:clinicId/dashboard', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get real-time stats from various collections
    const [revenueToday, revenueMonth, inventorySummary, attendanceToday] = await Promise.all([
      ClinicBilling.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), billDate: { $gte: today }, status: 'finalized' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, collected: { $sum: '$paidAmount' }, bills: { $sum: 1 } } }
      ]),
      ClinicBilling.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), billDate: { $gte: monthStart }, status: 'finalized' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, collected: { $sum: '$paidAmount' }, bills: { $sum: 1 } } }
      ]),
      PharmacyInventory.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), isActive: true } },
        { $group: { _id: null, total: { $sum: 1 }, lowStock: { $sum: { $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] } } } }
      ]),
      StaffSchedule.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['checked_in', 'checked_out']] }, 1, 0] } } } }
      ])
    ]);

    res.json({
      success: true,
      dashboard: {
        today: { revenue: revenueToday[0]?.total || 0, collected: revenueToday[0]?.collected || 0, bills: revenueToday[0]?.bills || 0 },
        month: { revenue: revenueMonth[0]?.total || 0, collected: revenueMonth[0]?.collected || 0, bills: revenueMonth[0]?.bills || 0 },
        inventory: inventorySummary[0] || { total: 0, lowStock: 0, outOfStock: 0 },
        attendance: { total: attendanceToday[0]?.total || 0, present: attendanceToday[0]?.present || 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue analytics
router.get('/clinic/:clinicId/revenue', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const data = await ClinicBilling.getDailyRevenue(req.params.clinicId, parseInt(days));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue by category
router.get('/clinic/:clinicId/revenue-by-category', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const data = await ClinicBilling.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(req.params.clinicId), billDate: { $gte: start, $lte: end }, status: 'finalized' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.itemType', total: { $sum: '$items.total' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment method breakdown
router.get('/clinic/:clinicId/payment-methods', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();
    
    const data = await ClinicBilling.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(req.params.clinicId), billDate: { $gte: start, $lte: end } } },
      { $unwind: '$payments' },
      { $group: { _id: '$payments.paymentMethod', total: { $sum: '$payments.amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get top selling medicines
router.get('/clinic/:clinicId/top-medicines', verifyToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await PharmacyInventory.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(req.params.clinicId) } },
      { $unwind: '$transactions' },
      { $match: { 'transactions.type': 'sale' } },
      { $group: { _id: '$medicineName', totalSold: { $sum: { $abs: '$transactions.quantity' } }, revenue: { $sum: '$transactions.totalAmount' } } },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get staff attendance analytics
router.get('/clinic/:clinicId/staff-attendance', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);
    
    const data = await StaffSchedule.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(req.params.clinicId), date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$staffId', totalDays: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['checked_in', 'checked_out']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }, leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
        lateCount: { $sum: { $cond: ['$attendance.isLate', 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
      { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
      { $project: { staffName: '$staff.name', totalDays: 1, present: 1, absent: 1, leave: 1, lateCount: 1, attendanceRate: { $multiply: [{ $divide: ['$present', '$totalDays'] }, 100] } } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate/refresh analytics
router.post('/clinic/:clinicId/generate', verifyToken, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const analytics = await ClinicAnalytics.generateDailyAnalytics(req.params.clinicId, targetDate);
    res.json({ success: true, analytics, message: 'Analytics generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stored analytics
router.get('/clinic/:clinicId/stored', verifyToken, async (req, res) => {
  try {
    const { periodType = 'daily', startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const analytics = await ClinicAnalytics.getAnalytics(req.params.clinicId, periodType, start, end);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
