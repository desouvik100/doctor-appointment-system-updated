const express = require('express');
const router = express.Router();
const MedicineOrder = require('../models/MedicineOrder');

// Medicine catalog (mock data)
const medicineCatalog = [
  { id: 1, name: 'Paracetamol 500mg', price: 25, manufacturer: 'Cipla', category: 'Pain Relief', requiresPrescription: false },
  { id: 2, name: 'Azithromycin 500mg', price: 120, manufacturer: 'Sun Pharma', category: 'Antibiotics', requiresPrescription: true },
  { id: 3, name: 'Omeprazole 20mg', price: 85, manufacturer: 'Dr. Reddy\'s', category: 'Gastric', requiresPrescription: false },
  { id: 4, name: 'Metformin 500mg', price: 45, manufacturer: 'USV', category: 'Diabetes', requiresPrescription: true },
  { id: 5, name: 'Amlodipine 5mg', price: 55, manufacturer: 'Torrent', category: 'Blood Pressure', requiresPrescription: true },
  { id: 6, name: 'Cetirizine 10mg', price: 30, manufacturer: 'Cipla', category: 'Allergy', requiresPrescription: false },
  { id: 7, name: 'Vitamin D3 60K', price: 150, manufacturer: 'Abbott', category: 'Vitamins', requiresPrescription: false },
  { id: 8, name: 'Pantoprazole 40mg', price: 95, manufacturer: 'Alkem', category: 'Gastric', requiresPrescription: false },
  { id: 9, name: 'Amoxicillin 500mg', price: 80, manufacturer: 'GSK', category: 'Antibiotics', requiresPrescription: true },
  { id: 10, name: 'Ibuprofen 400mg', price: 35, manufacturer: 'Cipla', category: 'Pain Relief', requiresPrescription: false }
];

// Get medicine catalog
router.get('/catalog', (req, res) => {
  const { category, search } = req.query;
  let medicines = [...medicineCatalog];
  
  if (category) {
    medicines = medicines.filter(m => m.category === category);
  }
  if (search) {
    medicines = medicines.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(medicines);
});

// Get categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(medicineCatalog.map(m => m.category))];
  res.json(categories);
});

// Place order
router.post('/order', async (req, res) => {
  try {
    const { userId, medicines, deliveryAddress, paymentMethod, prescriptionId } = req.body;
    
    // Calculate totals
    const subtotal = medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const discount = subtotal > 1000 ? subtotal * 0.1 : 0;
    const totalAmount = subtotal + deliveryFee - discount;
    
    const order = new MedicineOrder({
      userId,
      prescriptionId,
      medicines,
      deliveryAddress,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      trackingUpdates: [{
        status: 'Placed',
        message: 'Order placed successfully'
      }]
    });
    
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await MedicineOrder.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order details
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await MedicineOrder.findById(req.params.orderId)
      .populate('prescriptionId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.put('/order/:orderId/cancel', async (req, res) => {
  try {
    const order = await MedicineOrder.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }
    
    order.orderStatus = 'Cancelled';
    order.trackingUpdates.push({
      status: 'Cancelled',
      message: 'Order cancelled by user'
    });
    await order.save();
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reorder from previous order
router.post('/reorder/:orderId', async (req, res) => {
  try {
    const previousOrder = await MedicineOrder.findById(req.params.orderId);
    if (!previousOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const newOrder = new MedicineOrder({
      userId: previousOrder.userId,
      medicines: previousOrder.medicines,
      deliveryAddress: previousOrder.deliveryAddress,
      subtotal: previousOrder.subtotal,
      deliveryFee: previousOrder.deliveryFee,
      discount: previousOrder.discount,
      totalAmount: previousOrder.totalAmount,
      paymentMethod: previousOrder.paymentMethod,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      trackingUpdates: [{
        status: 'Placed',
        message: 'Reorder placed successfully'
      }]
    });
    
    await newOrder.save();
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
