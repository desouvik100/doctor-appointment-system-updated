const express = require('express');
const router = express.Router();
const DoctorWallet = require('../models/DoctorWallet');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Get doctor's wallet
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    const doctor = await Doctor.findById(req.params.doctorId);
    
    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalPayouts: wallet.totalPayouts,
        pendingAmount: wallet.pendingAmount,
        stats: wallet.stats,
        commissionRate: wallet.commissionRate,
        bankDetails: wallet.bankDetails,
        doctorName: doctor?.name
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get wallet transactions
router.get('/doctor/:doctorId/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    
    let transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      transactions: paginatedTransactions,
      total: transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.length / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update bank details
router.put('/doctor/:doctorId/bank-details', async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    
    wallet.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      upiId
    };
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: wallet.bankDetails
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ROUTES ============

// Get all doctors' wallets (Admin)
router.get('/admin/all', async (req, res) => {
  try {
    const wallets = await DoctorWallet.find()
      .populate('doctorId', 'name email phone specialization clinicId')
      .sort({ pendingAmount: -1 });
    
    const summary = {
      totalDoctors: wallets.length,
      totalPendingPayouts: wallets.reduce((sum, w) => sum + w.pendingAmount, 0),
      totalEarnings: wallets.reduce((sum, w) => sum + w.totalEarnings, 0),
      totalPayouts: wallets.reduce((sum, w) => sum + w.totalPayouts, 0)
    };
    
    res.json({
      success: true,
      wallets: wallets.map(w => ({
        _id: w._id,
        doctor: w.doctorId,
        balance: w.balance,
        totalEarnings: w.totalEarnings,
        totalPayouts: w.totalPayouts,
        pendingAmount: w.pendingAmount,
        stats: w.stats,
        commissionRate: w.commissionRate,
        bankDetails: w.bankDetails
      })),
      summary
    });
  } catch (error) {
    console.error('Error fetching all wallets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process payout to doctor (Admin)
router.post('/admin/payout', async (req, res) => {
  try {
    const { doctorId, amount, method, reference, adminId } = req.body;
    
    if (!doctorId || !amount || !method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID, amount, and payment method are required' 
      });
    }
    
    const wallet = await DoctorWallet.getOrCreateWallet(doctorId);
    
    if (amount > wallet.pendingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Payout amount (₹${amount}) exceeds pending balance (₹${wallet.pendingAmount})` 
      });
    }
    
    wallet.processPayout(amount, method, reference, adminId);
    await wallet.save();
    
    const doctor = await Doctor.findById(doctorId);
    
    res.json({
      success: true,
      message: `₹${amount} paid to Dr. ${doctor?.name || 'Unknown'}`,
      wallet: {
        balance: wallet.balance,
        pendingAmount: wallet.pendingAmount,
        totalPayouts: wallet.totalPayouts
      }
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update commission rate (Admin)
router.put('/admin/commission/:doctorId', async (req, res) => {
  try {
    const { commissionRate } = req.body;
    
    if (commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Commission rate must be between 0 and 100' 
      });
    }
    
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    wallet.commissionRate = commissionRate;
    await wallet.save();
    
    res.json({
      success: true,
      message: `Commission rate updated to ${commissionRate}%`,
      commissionRate: wallet.commissionRate
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add bonus to doctor (Admin)
router.post('/admin/bonus', async (req, res) => {
  try {
    const { doctorId, amount, description, adminId } = req.body;
    
    if (!doctorId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID and amount are required' 
      });
    }
    
    const wallet = await DoctorWallet.getOrCreateWallet(doctorId);
    
    wallet.transactions.push({
      type: 'bonus',
      amount,
      description: description || 'Performance bonus',
      status: 'completed',
      processedBy: adminId
    });
    
    wallet.balance += amount;
    wallet.totalEarnings += amount;
    wallet.pendingAmount += amount;
    
    await wallet.save();
    
    const doctor = await Doctor.findById(doctorId);
    
    res.json({
      success: true,
      message: `₹${amount} bonus added to Dr. ${doctor?.name || 'Unknown'}`,
      wallet: {
        balance: wallet.balance,
        pendingAmount: wallet.pendingAmount
      }
    });
  } catch (error) {
    console.error('Error adding bonus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get wallet statistics for dashboard
router.get('/admin/stats', async (req, res) => {
  try {
    const wallets = await DoctorWallet.find().populate('doctorId', 'name');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate monthly earnings from transactions
    let thisMonthEarnings = 0;
    let thisMonthPayouts = 0;
    
    wallets.forEach(wallet => {
      wallet.transactions.forEach(t => {
        if (new Date(t.createdAt) >= startOfMonth) {
          if (t.type === 'earning' || t.type === 'bonus') {
            thisMonthEarnings += t.amount;
          } else if (t.type === 'payout') {
            thisMonthPayouts += Math.abs(t.amount);
          }
        }
      });
    });
    
    // Top earning doctors
    const topDoctors = wallets
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5)
      .map(w => ({
        name: w.doctorId?.name || 'Unknown',
        totalEarnings: w.totalEarnings,
        totalPatients: w.stats.totalPatients,
        pendingAmount: w.pendingAmount
      }));
    
    res.json({
      success: true,
      stats: {
        totalDoctors: wallets.length,
        totalPendingPayouts: wallets.reduce((sum, w) => sum + w.pendingAmount, 0),
        totalEarnings: wallets.reduce((sum, w) => sum + w.totalEarnings, 0),
        totalPayouts: wallets.reduce((sum, w) => sum + w.totalPayouts, 0),
        thisMonthEarnings,
        thisMonthPayouts,
        topDoctors
      }
    });
  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
