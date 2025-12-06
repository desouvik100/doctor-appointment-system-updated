const express = require('express');
const router = express.Router();
const { HealthPackage, UserPackage } = require('../models/HealthPackage');

// Get all active packages
router.get('/', async (req, res) => {
  try {
    const { type, featured } = req.query;
    const query = { isActive: true };
    
    if (type) query.packageType = type;
    if (featured === 'true') query.isFeatured = true;

    const packages = await HealthPackage.find(query)
      .sort({ isFeatured: -1, purchaseCount: -1 });

    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Failed to fetch packages', error: error.message });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const pkg = await HealthPackage.findById(req.params.id)
      .populate('applicableDoctors', 'name specialization');

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(pkg);
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ message: 'Failed to fetch package', error: error.message });
  }
});

// Purchase package
router.post('/purchase', async (req, res) => {
  try {
    const { userId, packageId, paymentId, amountPaid } = req.body;

    const pkg = await HealthPackage.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

    // Create remaining items from package includes
    const remainingItems = pkg.includes.map(item => ({
      type: item.type,
      name: item.name,
      remaining: item.quantity,
      total: item.quantity
    }));

    const userPackage = new UserPackage({
      userId,
      packageId,
      expiryDate,
      amountPaid: amountPaid || pkg.discountedPrice,
      paymentId,
      remainingItems
    });

    await userPackage.save();

    // Update purchase count
    pkg.purchaseCount += 1;
    await pkg.save();

    res.status(201).json({
      message: 'Package purchased successfully',
      userPackage
    });
  } catch (error) {
    console.error('Purchase package error:', error);
    res.status(500).json({ message: 'Failed to purchase package', error: error.message });
  }
});

// Get user's packages
router.get('/user/:userId', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.params.userId };
    
    if (status) query.status = status;

    const packages = await UserPackage.find(query)
      .populate('packageId')
      .sort({ purchaseDate: -1 });

    res.json(packages);
  } catch (error) {
    console.error('Get user packages error:', error);
    res.status(500).json({ message: 'Failed to fetch user packages', error: error.message });
  }
});

// Use package item
router.post('/use/:userPackageId', async (req, res) => {
  try {
    const { itemType, itemName, appointmentId } = req.body;

    const userPackage = await UserPackage.findById(req.params.userPackageId);
    if (!userPackage) {
      return res.status(404).json({ message: 'User package not found' });
    }

    if (userPackage.status !== 'active') {
      return res.status(400).json({ message: 'Package is not active' });
    }

    if (new Date() > userPackage.expiryDate) {
      userPackage.status = 'expired';
      await userPackage.save();
      return res.status(400).json({ message: 'Package has expired' });
    }

    // Find and update remaining item
    const itemIndex = userPackage.remainingItems.findIndex(
      item => item.type === itemType && item.remaining > 0
    );

    if (itemIndex === -1) {
      return res.status(400).json({ message: 'No remaining items of this type' });
    }

    userPackage.remainingItems[itemIndex].remaining -= 1;
    userPackage.usageDetails.push({
      itemType,
      itemName,
      usedAt: new Date(),
      appointmentId
    });

    // Check if fully used
    const allUsed = userPackage.remainingItems.every(item => item.remaining === 0);
    if (allUsed) {
      userPackage.status = 'fully_used';
    }

    await userPackage.save();

    res.json({
      message: 'Package item used successfully',
      userPackage
    });
  } catch (error) {
    console.error('Use package error:', error);
    res.status(500).json({ message: 'Failed to use package', error: error.message });
  }
});

// Admin: Create package
router.post('/admin/create', async (req, res) => {
  try {
    const pkg = new HealthPackage(req.body);
    
    // Calculate discount percent
    if (pkg.originalPrice && pkg.discountedPrice) {
      pkg.discountPercent = Math.round(((pkg.originalPrice - pkg.discountedPrice) / pkg.originalPrice) * 100);
    }

    await pkg.save();

    res.status(201).json({
      message: 'Package created successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ message: 'Failed to create package', error: error.message });
  }
});

// Admin: Update package
router.put('/admin/:id', async (req, res) => {
  try {
    const pkg = await HealthPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({
      message: 'Package updated successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Failed to update package', error: error.message });
  }
});

// Admin: Delete/deactivate package
router.delete('/admin/:id', async (req, res) => {
  try {
    const pkg = await HealthPackage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ message: 'Package deactivated successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Failed to delete package', error: error.message });
  }
});

module.exports = router;
