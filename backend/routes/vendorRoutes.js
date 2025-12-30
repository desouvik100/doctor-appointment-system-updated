/**
 * Vendor & Purchase Order Management Routes
 */

const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// ===== VENDOR ROUTES =====

// Create vendor
router.post('/vendors', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const vendor = new Vendor({ ...req.body, createdBy: req.user?.userId });
    await vendor.save();
    res.status(201).json({ success: true, vendor, message: `Vendor ${vendor.vendorCode} created` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all vendors
router.get('/vendors/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (status) query.status = status;
    if (category) query.categories = category;
    if (search) query.$text = { $search: search };

    const vendors = await Vendor.find(query).sort({ name: 1 });
    res.json({ success: true, vendors, count: vendors.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get vendor by ID
router.get('/vendors/:id', verifyToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update vendor
router.put('/vendors/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PURCHASE ORDER ROUTES =====

// Create PO
router.post('/purchase-orders', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const po = new PurchaseOrder({ ...req.body, createdBy: req.user?.userId });
    await po.save();
    res.status(201).json({ success: true, purchaseOrder: po, message: `PO ${po.poNumber} created` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all POs
router.get('/purchase-orders/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { status, vendorId, page = 1, limit = 20 } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    const pos = await PurchaseOrder.find(query)
      .populate('vendorId', 'name vendorCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PurchaseOrder.countDocuments(query);
    res.json({ success: true, purchaseOrders: pos, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get PO by ID
router.get('/purchase-orders/:id', verifyToken, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendorId')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update PO
router.put('/purchase-orders/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.userId },
      { new: true }
    );
    res.json({ success: true, purchaseOrder: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve PO
router.post('/purchase-orders/:id/approve', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedBy: req.user?.userId,
        approvedAt: new Date(),
        approvalNotes
      },
      { new: true }
    );
    res.json({ success: true, purchaseOrder: po, message: 'PO approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Receive items
router.post('/purchase-orders/:id/receive', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { items } = req.body; // Array of { itemIndex, receivedQuantity, batchNumber, expiryDate }
    const po = await PurchaseOrder.findById(req.params.id);
    
    items.forEach(({ itemIndex, receivedQuantity, batchNumber, expiryDate }) => {
      if (po.items[itemIndex]) {
        po.items[itemIndex].receivedQuantity = receivedQuantity;
        po.items[itemIndex].batchNumber = batchNumber;
        po.items[itemIndex].expiryDate = expiryDate;
        po.items[itemIndex].status = receivedQuantity >= po.items[itemIndex].quantity ? 'received' : 'partial';
      }
    });

    // Check if all items received
    const allReceived = po.items.every(item => item.status === 'received');
    const anyReceived = po.items.some(item => item.receivedQuantity > 0);
    po.status = allReceived ? 'received' : (anyReceived ? 'partial_received' : po.status);
    po.receivedBy = req.user?.userId;
    if (allReceived) po.actualDeliveryDate = new Date();

    await po.save();
    res.json({ success: true, purchaseOrder: po, message: 'Items received' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get low stock items for auto-reorder
router.get('/low-stock/:clinicId', verifyToken, async (req, res) => {
  try {
    const PharmacyInventory = require('../models/PharmacyInventory');
    const lowStock = await PharmacyInventory.find({
      clinicId: req.params.clinicId,
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).sort({ currentStock: 1 });

    res.json({ success: true, lowStockItems: lowStock, count: lowStock.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiring items
router.get('/expiring/:clinicId', verifyToken, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const PharmacyInventory = require('../models/PharmacyInventory');
    const expiring = await PharmacyInventory.find({
      clinicId: req.params.clinicId,
      expiryDate: { $lte: expiryDate, $gte: new Date() }
    }).sort({ expiryDate: 1 });

    res.json({ success: true, expiringItems: expiring, count: expiring.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
