/**
 * Pharmacy/Inventory Routes
 * API endpoints for pharmacy and medicine inventory management
 */

const express = require('express');
const router = express.Router();
const PharmacyInventory = require('../models/PharmacyInventory');
const { verifyToken } = require('../middleware/auth');

// Get all inventory items for a clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { category, stockStatus, search, page = 1, limit = 50 } = req.query;
    
    const query = { clinicId, isActive: true };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { medicineName: new RegExp(search, 'i') },
        { genericName: new RegExp(search, 'i') },
        { brandName: new RegExp(search, 'i') }
      ];
    }
    
    let items = await PharmacyInventory.find(query)
      .sort({ medicineName: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Filter by stock status if specified
    if (stockStatus) {
      items = items.filter(item => item.stockStatus === stockStatus);
    }
    
    const total = await PharmacyInventory.countDocuments(query);
    
    res.json({
      success: true,
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single item
router.get('/item/:itemId', verifyToken, async (req, res) => {
  try {
    const item = await PharmacyInventory.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new medicine/item
router.post('/add', verifyToken, async (req, res) => {
  try {
    const item = new PharmacyInventory({
      ...req.body,
      createdBy: req.user?.id
    });
    await item.save();
    res.status(201).json({ success: true, item, message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update item
router.put('/item/:itemId', verifyToken, async (req, res) => {
  try {
    const item = await PharmacyInventory.findByIdAndUpdate(
      req.params.itemId,
      { ...req.body, updatedBy: req.user?.id },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item, message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add stock (purchase)
router.post('/item/:itemId/add-stock', verifyToken, async (req, res) => {
  try {
    const { quantity, batchNumber, unitPrice, supplier, expiryDate, reference } = req.body;
    
    const item = await PharmacyInventory.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    await item.addStock(quantity, {
      batchNumber,
      unitPrice,
      totalAmount: quantity * unitPrice,
      reference,
      performedBy: req.user?.id
    });
    
    // Update expiry if provided
    if (expiryDate) {
      item.expiryDate = expiryDate;
    }
    if (supplier) {
      item.supplier = supplier;
    }
    await item.save();
    
    res.json({ success: true, item, message: `Added ${quantity} units to stock` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reduce stock (sale/dispense)
router.post('/item/:itemId/reduce-stock', verifyToken, async (req, res) => {
  try {
    const { quantity, reason, reference, type = 'sale' } = req.body;
    
    const item = await PharmacyInventory.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    await item.reduceStock(quantity, {
      type,
      reason,
      reference,
      performedBy: req.user?.id
    });
    
    res.json({ success: true, item, message: `Reduced ${quantity} units from stock` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get low stock items
router.get('/clinic/:clinicId/low-stock', verifyToken, async (req, res) => {
  try {
    const items = await PharmacyInventory.getLowStock(req.params.clinicId);
    res.json({ success: true, items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiring items
router.get('/clinic/:clinicId/expiring', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const items = await PharmacyInventory.getExpiring(req.params.clinicId, parseInt(days));
    res.json({ success: true, items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expired items
router.get('/clinic/:clinicId/expired', verifyToken, async (req, res) => {
  try {
    const items = await PharmacyInventory.getExpired(req.params.clinicId);
    res.json({ success: true, items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory summary/dashboard
router.get('/clinic/:clinicId/summary', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const [
      totalItems,
      lowStock,
      outOfStock,
      expiringSoon,
      expired
    ] = await Promise.all([
      PharmacyInventory.countDocuments({ clinicId, isActive: true }),
      PharmacyInventory.countDocuments({ 
        clinicId, 
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minStockLevel'] },
        currentStock: { $gt: 0 }
      }),
      PharmacyInventory.countDocuments({ clinicId, isActive: true, currentStock: 0 }),
      PharmacyInventory.countDocuments({
        clinicId,
        isActive: true,
        expiryDate: { 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gt: new Date()
        }
      }),
      PharmacyInventory.countDocuments({
        clinicId,
        isActive: true,
        expiryDate: { $lt: new Date() },
        currentStock: { $gt: 0 }
      })
    ]);
    
    // Calculate total inventory value
    const valueAgg = await PharmacyInventory.aggregate([
      { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } } } }
    ]);
    
    res.json({
      success: true,
      summary: {
        totalItems,
        lowStock,
        outOfStock,
        expiringSoon,
        expired,
        totalValue: valueAgg[0]?.totalValue || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search medicines (for prescription autocomplete)
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, clinicId } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, items: [] });
    }
    
    const items = await PharmacyInventory.find({
      clinicId,
      isActive: true,
      currentStock: { $gt: 0 },
      $or: [
        { medicineName: new RegExp(q, 'i') },
        { genericName: new RegExp(q, 'i') },
        { brandName: new RegExp(q, 'i') }
      ]
    })
    .select('medicineName genericName brandName strength category currentStock sellingPrice')
    .limit(10);
    
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete item (soft delete)
router.delete('/item/:itemId', verifyToken, async (req, res) => {
  try {
    const item = await PharmacyInventory.findByIdAndUpdate(
      req.params.itemId,
      { isActive: false, updatedBy: req.user?.id },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
