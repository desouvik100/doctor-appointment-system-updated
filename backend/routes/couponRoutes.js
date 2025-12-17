const express = require('express');
const Coupon = require('../models/Coupon');
const { authenticate, checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * GET /api/coupons/public
 * Get all active public coupons (for user attraction)
 */
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isPublic: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).select('code description discountType discountValue minOrderAmount maxDiscount validUntil applicableTo')
      .sort({ discountValue: -1 });

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Get public coupons error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

/**
 * POST /api/coupons/validate
 * Validate a coupon code
 */
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const userId = req.userId;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const validation = coupon.isValid(userId, amount || 0);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const discount = coupon.calculateDiscount(amount || 0);

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount
      },
      discount,
      finalAmount: (amount || 0) - discount
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
});

/**
 * POST /api/coupons/apply
 * Apply coupon to an appointment (called during booking)
 */
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { code, appointmentId, amount } = req.body;
    const userId = req.userId;

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const validation = coupon.isValid(userId, amount);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const discount = coupon.calculateDiscount(amount);

    // Record usage
    coupon.usedBy.push({ userId, appointmentId, usedAt: new Date() });
    coupon.usedCount += 1;
    await coupon.save();

    res.json({
      success: true,
      discount,
      finalAmount: amount - discount,
      message: `Coupon applied! You saved ₹${discount}`
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/coupons
 * Get all coupons (Admin only)
 */
router.get('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

/**
 * POST /api/coupons
 * Create a new coupon (Admin only)
 */
router.post('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const coupon = new Coupon({
      ...req.body,
      code: req.body.code.toUpperCase().trim(),
      createdBy: req.userId
    });
    await coupon.save();
    res.status(201).json({ success: true, coupon, message: 'Coupon created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

/**
 * PUT /api/coupons/:id
 * Update a coupon (Admin only)
 */
router.put('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { ...req.body, code: req.body.code?.toUpperCase().trim() },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

/**
 * DELETE /api/coupons/:id
 * Delete a coupon (Admin only)
 */
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

module.exports = router;
