const express = require('express');
const router = express.Router();
const DoctorWallet = require('../models/DoctorWallet');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const aiSecurityService = require('../services/aiSecurityService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { emitWalletTransaction } = require('../services/socketManager');

/**
 * @swagger
 * components:
 *   schemas:
 *     WalletBalance:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         balance:
 *           type: number
 *         currency:
 *           type: string
 *           default: INR
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [credit, debit]
 *         amount:
 *           type: number
 *         description:
 *           type: string
 *         reference:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Security helper - log financial operations
const logFinancialActivity = async (req, action, details) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.params.doctorId);
    if (doctor) {
      await aiSecurityService.analyzeActivity({
        userId: doctor._id,
        userType: 'Doctor',
        userName: doctor.name,
        userEmail: doctor.email,
        action: 'payment',
        endpoint: req.originalUrl,
        method: req.method,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        requestBody: { action, ...details }
      });
    }
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

// ============ PATIENT WALLET ROUTES ============

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get patient wallet balance
 *     description: Returns the current wallet balance for the authenticated patient
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletBalance'
 */
router.get('/balance', async (req, res) => {
  try {
    // Check for auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return zero balance for unauthenticated users
      return res.json({
        success: true,
        balance: 0,
        currency: 'INR'
      });
    }

    // Verify token manually
    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.json({
        success: true,
        balance: 0,
        currency: 'INR'
      });
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('walletBalance walletHistory name');
    
    if (!user) {
      return res.json({
        success: true,
        balance: 0,
        currency: 'INR'
      });
    }
    
    res.json({
      success: true,
      balance: user.walletBalance || 0,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.json({
      success: true,
      balance: 0,
      currency: 'INR'
    });
  }
});

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     description: Returns paginated list of wallet transactions for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *                 balance:
 *                   type: number
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user.id).select('walletHistory walletBalance');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const transactions = (user.walletHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const startIndex = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      transactions: paginatedTransactions,
      total: transactions.length,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.length / limit),
      currentBalance: user.walletBalance || 0
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /wallet/add/create-order
 * Step 1: Create a Razorpay order for wallet top-up.
 * Wallet is NOT credited here — only after payment verification.
 */
router.post('/add/create-order', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum top-up amount is ₹1' });
    }
    if (amount > 50000) {
      return res.status(400).json({ success: false, message: 'Maximum top-up amount is ₹50,000' });
    }

    const user = await User.findById(req.user.id).select('name email phone');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const Razorpay = require('razorpay');
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, USE_RAZORPAY_PAYMENTS } = require('../config/paymentConfig');

    if (!USE_RAZORPAY_PAYMENTS || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }

    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `wallet_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
        purpose: 'wallet_topup',
        topupAmount: amount.toString()
      }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || ''
    });
  } catch (error) {
    console.error('Error creating wallet top-up order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

/**
 * POST /wallet/add/verify
 * Step 2: Verify Razorpay payment signature and credit the wallet.
 */
router.post('/add/verify', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const { RAZORPAY_KEY_SECRET } = require('../config/paymentConfig');
    const crypto = require('crypto');

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Idempotency: prevent double-crediting the same payment
    const alreadyProcessed = (user.walletHistory || []).some(
      t => t.referenceId === razorpay_payment_id
    );
    if (alreadyProcessed) {
      return res.json({ success: true, message: 'Payment already processed', balance: user.walletBalance });
    }

    const topupAmount = parseFloat(amount);
    const newBalance = (user.walletBalance || 0) + topupAmount;

    user.walletBalance = newBalance;
    user.walletHistory.push({
      type: 'credit',
      amount: topupAmount,
      description: 'Wallet top-up via Razorpay',
      referenceId: razorpay_payment_id,
      balanceAfter: newBalance,
      createdAt: new Date()
    });

    await user.save();

    emitWalletTransaction(req.user.id, {
      type: 'credit',
      amount: topupAmount,
      description: 'Wallet top-up via Razorpay',
      referenceId: razorpay_payment_id
    }, newBalance);

    res.json({ success: true, message: `₹${topupAmount} added to wallet`, balance: newBalance });
  } catch (error) {
    console.error('Error verifying wallet top-up:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pay from wallet
router.post('/pay', verifyToken, async (req, res) => {
  try {
    const { amount, appointmentId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }
    
    const newBalance = user.walletBalance - amount;
    
    user.walletBalance = newBalance;
    user.walletHistory.push({
      type: 'debit',
      amount: -amount,
      description: appointmentId ? `Payment for appointment` : 'Wallet payment',
      referenceId: appointmentId,
      referenceModel: appointmentId ? 'Appointment' : undefined,
      balanceAfter: newBalance,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Emit socket event for real-time sync
    emitWalletTransaction(req.user.id, {
      type: 'debit',
      amount: -amount,
      description: appointmentId ? `Payment for appointment` : 'Wallet payment',
      referenceId: appointmentId,
    }, newBalance);
    
    res.json({
      success: true,
      message: `₹${amount} paid from wallet`,
      balance: newBalance
    });
  } catch (error) {
    console.error('Error paying from wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get loyalty points (placeholder)
router.get('/loyalty-points', async (req, res) => {
  try {
    // Placeholder - integrate with loyalty system
    res.json({
      success: true,
      points: 0,
      pointsValue: 0,
      tier: 'Bronze'
    });
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    res.json({
      success: true,
      points: 0,
      pointsValue: 0,
      tier: 'Bronze'
    });
  }
});

// ============ DOCTOR WALLET ROUTES ============

// Get doctor's wallet
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    // Only the doctor themselves or an admin can view a wallet
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.id !== req.params.doctorId
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this wallet' });
    }

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
router.get('/doctor/:doctorId/transactions', verifyToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.id !== req.params.doctorId
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these transactions' });
    }

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
router.put('/doctor/:doctorId/bank-details', verifyToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.id !== req.params.doctorId
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to update these bank details' });
    }

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

// ============ WITHDRAWAL REQUEST ROUTES ============

// Create withdrawal request (Doctor)
router.post('/doctor/:doctorId/withdraw', verifyToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.id !== req.params.doctorId
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to create withdrawal requests for this doctor' });
    }

    const { amount, method, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }
    
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    const doctor = await Doctor.findById(req.params.doctorId);
    
    // Check if bank details are added
    if (!wallet.bankDetails?.accountNumber && method === 'bank_transfer') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please add your bank details before requesting withdrawal' 
      });
    }
    
    const request = wallet.createWithdrawalRequest(amount, method || 'bank_transfer', notes);
    await wallet.save();
    
    // Log financial activity for security monitoring
    await logFinancialActivity(req, 'withdrawal_request', { amount, method });
    
    console.log(`💸 Withdrawal request created by Dr. ${doctor?.name}: ₹${amount}`);
    
    res.json({
      success: true,
      message: `Withdrawal request for ₹${amount} submitted successfully`,
      request
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get withdrawal requests (Doctor)
router.get('/doctor/:doctorId/withdrawals', verifyToken, async (req, res) => {
  try {
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    
    const requests = wallet.withdrawalRequests
      .sort((a, b) => b.requestedAt - a.requestedAt);
    
    res.json({
      success: true,
      requests,
      pendingRequest: requests.find(r => r.status === 'pending')
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel withdrawal request (Doctor)
router.delete('/doctor/:doctorId/withdraw/:requestId', verifyToken, async (req, res) => {
  try {
    const wallet = await DoctorWallet.getOrCreateWallet(req.params.doctorId);
    const request = wallet.withdrawalRequests.id(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only cancel pending requests' });
    }
    
    request.status = 'rejected';
    request.rejectionReason = 'Cancelled by doctor';
    request.processedAt = new Date();
    
    await wallet.save();
    
    res.json({ success: true, message: 'Withdrawal request cancelled' });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ROUTES ============

// Get all pending withdrawal requests (Admin)
router.get('/admin/withdrawals', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const wallets = await DoctorWallet.find({
      'withdrawalRequests.status': 'pending'
    }).populate('doctorId', 'name email phone specialization');
    
    const pendingRequests = [];
    wallets.forEach(wallet => {
      wallet.withdrawalRequests
        .filter(r => r.status === 'pending')
        .forEach(request => {
          pendingRequests.push({
            ...request.toObject(),
            walletId: wallet._id,
            doctor: wallet.doctorId,
            bankDetails: wallet.bankDetails,
            walletBalance: wallet.pendingAmount
          });
        });
    });
    
    // Sort by request date
    pendingRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    
    res.json({
      success: true,
      requests: pendingRequests,
      totalPending: pendingRequests.length,
      totalAmount: pendingRequests.reduce((sum, r) => sum + r.amount, 0)
    });
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process withdrawal request (Admin - Approve/Reject)
router.put('/admin/withdrawals/:walletId/:requestId', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { action, reference, rejectionReason, adminId } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    
    const wallet = await DoctorWallet.findById(req.params.walletId)
      .populate('doctorId', 'name email');
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    const request = wallet.processWithdrawalRequest(
      req.params.requestId,
      action,
      adminId,
      reference,
      rejectionReason
    );
    
    await wallet.save();
    
    // Send email notification
    try {
      const { sendEmail } = require('../services/emailService');
      const doctor = wallet.doctorId;
      
      if (doctor?.email) {
        const subject = action === 'approve' 
          ? `✅ Withdrawal Request Approved - ₹${request.amount}`
          : `❌ Withdrawal Request Rejected`;
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${action === 'approve' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0;">💰 HealthSync</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Withdrawal Request ${action === 'approve' ? 'Approved' : 'Rejected'}</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 12px 12px;">
              <p>Dear Dr. ${doctor.name},</p>
              ${action === 'approve' ? `
                <p>Your withdrawal request has been <strong style="color: #10b981;">approved</strong> and processed.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${request.amount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Method:</strong> ${request.payoutMethod}</p>
                  <p style="margin: 5px 0;"><strong>Reference:</strong> ${reference || 'N/A'}</p>
                </div>
                <p>The amount will be credited to your registered bank account within 1-3 business days.</p>
              ` : `
                <p>Your withdrawal request has been <strong style="color: #ef4444;">rejected</strong>.</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${request.amount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Reason:</strong> ${rejectionReason || 'Not specified'}</p>
                </div>
                <p>Please contact support if you have any questions.</p>
              `}
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                Thank you for being a part of HealthSync!
              </p>
            </div>
          </div>
        `;
        
        await sendEmail({ to: doctor.email, subject, html });
        console.log(`📧 Withdrawal notification sent to ${doctor.email}`);
      }
    } catch (emailError) {
      console.error('Error sending withdrawal email:', emailError.message);
    }
    
    res.json({
      success: true,
      message: `Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'}`,
      request
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get all doctors' wallets (Admin)
router.get('/admin/all', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
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
router.post('/admin/payout', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
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
router.put('/admin/commission/:doctorId', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
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
router.post('/admin/bonus', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
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
router.get('/admin/stats', verifyTokenWithRole(['admin', 'superadmin']), async (req, res) => {
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
