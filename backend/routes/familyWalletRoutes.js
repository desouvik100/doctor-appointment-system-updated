/**
 * Family Wallet API Routes
 * Requirement 5: Family Health Wallet
 */

const express = require('express');
const router = express.Router();
const FamilyWallet = require('../models/FamilyWallet');
const FamilyMember = require('../models/FamilyMember');
const { authenticate } = require('../middleware/roleMiddleware');

// Get or create wallet
router.get('/', authenticate, async (req, res) => {
  try {
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add money to wallet
router.post('/add-money', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    const newBalance = wallet.addMoney(amount, paymentMethod, paymentId);
    await wallet.save();
    
    res.json({ 
      message: 'Money added successfully',
      balance: newBalance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deduct for booking
router.post('/deduct', authenticate, async (req, res) => {
  try {
    const { amount, memberId, memberName, category, appointmentId, description } = req.body;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    const newBalance = wallet.deductForBooking(
      amount, memberId, memberName, category, appointmentId, description
    );
    await wallet.save();
    
    res.json({
      message: 'Payment successful',
      balance: newBalance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add family member to wallet
router.post('/members', authenticate, async (req, res) => {
  try {
    const { memberId, name, relationship, spendingLimit, monthlyLimit, canAddMoney } = req.body;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    // Check if member already exists
    const existingMember = wallet.members.find(m => 
      m.memberId?.toString() === memberId || m.name === name
    );
    
    if (existingMember) {
      return res.status(400).json({ message: 'Member already added to wallet' });
    }
    
    wallet.members.push({
      memberId,
      name,
      relationship,
      spendingLimit: spendingLimit || 2000,
      monthlyLimit: monthlyLimit || 5000,
      canAddMoney: canAddMoney || false
    });
    
    await wallet.save();
    
    res.json({
      message: 'Family member added to wallet',
      members: wallet.members
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update member limits
router.put('/members/:memberId', authenticate, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { spendingLimit, monthlyLimit, canAddMoney, isActive } = req.body;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    const member = wallet.members.find(m => m.memberId?.toString() === memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found in wallet' });
    }
    
    if (spendingLimit !== undefined) member.spendingLimit = spendingLimit;
    if (monthlyLimit !== undefined) member.monthlyLimit = monthlyLimit;
    if (canAddMoney !== undefined) member.canAddMoney = canAddMoney;
    if (isActive !== undefined) member.isActive = isActive;
    
    await wallet.save();
    
    res.json({
      message: 'Member updated',
      member
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from wallet
router.delete('/members/:memberId', authenticate, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    wallet.members = wallet.members.filter(m => m.memberId?.toString() !== memberId);
    await wallet.save();
    
    res.json({ message: 'Member removed from wallet' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update budget settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { monthlyBudget, lowBalanceThreshold, budgetResetDay, notifications } = req.body;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    if (monthlyBudget !== undefined) wallet.monthlyBudget = monthlyBudget;
    if (lowBalanceThreshold !== undefined) wallet.lowBalanceThreshold = lowBalanceThreshold;
    if (budgetResetDay !== undefined) wallet.budgetResetDay = budgetResetDay;
    if (notifications) wallet.notifications = { ...wallet.notifications, ...notifications };
    
    await wallet.save();
    
    res.json({
      message: 'Settings updated',
      settings: {
        monthlyBudget: wallet.monthlyBudget,
        lowBalanceThreshold: wallet.lowBalanceThreshold,
        budgetResetDay: wallet.budgetResetDay,
        notifications: wallet.notifications
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    let transactions = wallet.transactions;
    
    // Filter by category
    if (category) {
      transactions = transactions.filter(t => t.category === category);
    }
    
    // Filter by date range
    if (startDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) <= new Date(endDate));
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      transactions: paginatedTransactions,
      total: transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.length / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get spending analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    // Calculate spending by category
    const spendingByCategory = {};
    const spendingByMember = {};
    
    wallet.transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        // By category
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
        
        // By member
        if (t.memberName) {
          spendingByMember[t.memberName] = (spendingByMember[t.memberName] || 0) + t.amount;
        }
      });
    
    res.json({
      balance: wallet.balance,
      monthlyBudget: wallet.monthlyBudget,
      currentMonthSpending: wallet.currentMonthSpending,
      budgetUtilization: ((wallet.currentMonthSpending / wallet.monthlyBudget) * 100).toFixed(1),
      spendingByCategory,
      spendingByMember,
      yearlySpending: wallet.yearlySpending
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get 80D tax report
router.get('/tax-report', authenticate, async (req, res) => {
  try {
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    const report = wallet.generate80DReport();
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    const unreadAlerts = wallet.alerts.filter(a => !a.isRead);
    
    res.json({
      alerts: unreadAlerts,
      total: unreadAlerts.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark alerts as read
router.put('/alerts/read', authenticate, async (req, res) => {
  try {
    const { alertIds } = req.body;
    
    const wallet = await FamilyWallet.getOrCreateWallet(req.user.id);
    
    wallet.alerts.forEach(alert => {
      if (!alertIds || alertIds.includes(alert._id.toString())) {
        alert.isRead = true;
      }
    });
    
    await wallet.save();
    
    res.json({ message: 'Alerts marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
