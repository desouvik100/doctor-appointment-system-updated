const express = require('express');
const MedicineReminder = require('../models/MedicineReminder');
const User = require('../models/User');
const router = express.Router();

// ============================================
// MEDICINE CATALOG & DELIVERY ROUTES
// Updated: Force nodemon restart
// ============================================

// Sample medicine catalog data
const medicineCatalog = [
  { id: 1, name: 'Paracetamol 500mg', manufacturer: 'Cipla', category: 'Pain Relief', price: 25, requiresPrescription: false },
  { id: 2, name: 'Ibuprofen 400mg', manufacturer: 'Sun Pharma', category: 'Pain Relief', price: 45, requiresPrescription: false },
  { id: 3, name: 'Amoxicillin 500mg', manufacturer: 'Ranbaxy', category: 'Antibiotics', price: 120, requiresPrescription: true },
  { id: 4, name: 'Azithromycin 250mg', manufacturer: 'Zydus', category: 'Antibiotics', price: 85, requiresPrescription: true },
  { id: 5, name: 'Cetirizine 10mg', manufacturer: 'Dr Reddy', category: 'Allergy', price: 35, requiresPrescription: false },
  { id: 6, name: 'Omeprazole 20mg', manufacturer: 'Cipla', category: 'Digestive', price: 55, requiresPrescription: false },
  { id: 7, name: 'Metformin 500mg', manufacturer: 'USV', category: 'Diabetes', price: 40, requiresPrescription: true },
  { id: 8, name: 'Atorvastatin 10mg', manufacturer: 'Pfizer', category: 'Heart Health', price: 95, requiresPrescription: true },
  { id: 9, name: 'Vitamin D3 60K', manufacturer: 'Abbott', category: 'Vitamins', price: 120, requiresPrescription: false },
  { id: 10, name: 'Multivitamin Tablets', manufacturer: 'Himalaya', category: 'Vitamins', price: 180, requiresPrescription: false },
  { id: 11, name: 'Cough Syrup', manufacturer: 'Dabur', category: 'Cold & Cough', price: 65, requiresPrescription: false },
  { id: 12, name: 'Antacid Gel', manufacturer: 'Mankind', category: 'Digestive', price: 75, requiresPrescription: false },
];

// In-memory orders storage (in production, use MongoDB model)
let medicineOrders = [];
let orderCounter = 1000;

// Get medicine categories
router.get('/categories', (req, res) => {
  try {
    const categories = [...new Set(medicineCatalog.map(m => m.category))];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medicine catalog
router.get('/catalog', (req, res) => {
  try {
    const { search, category } = req.query;
    let results = [...medicineCatalog];
    
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.manufacturer.toLowerCase().includes(searchLower)
      );
    }
    
    if (category) {
      results = results.filter(m => m.category === category);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/orders/:userId', (req, res) => {
  try {
    const userOrders = medicineOrders
      .filter(o => o.userId === req.params.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Place new order
router.post('/order', (req, res) => {
  try {
    const { userId, medicines, deliveryAddress, paymentMethod } = req.body;
    
    if (!userId || !medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'Invalid order data' });
    }
    
    const subtotal = medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const discount = subtotal > 1000 ? subtotal * 0.1 : 0;
    const totalAmount = subtotal + deliveryFee - discount;
    
    const order = {
      _id: `ORD${++orderCounter}`,
      orderNumber: `HS${orderCounter}`,
      userId,
      medicines,
      deliveryAddress,
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      orderStatus: 'Placed',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    medicineOrders.push(order);
    console.log(`📦 Medicine order placed: ${order.orderNumber} for user ${userId}`);
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.put('/order/:orderId/cancel', (req, res) => {
  try {
    const order = medicineOrders.find(o => o._id === req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (!['Placed', 'Confirmed', 'Processing'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    order.orderStatus = 'Cancelled';
    order.updatedAt = new Date();
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reorder
router.post('/reorder/:orderId', (req, res) => {
  try {
    const originalOrder = medicineOrders.find(o => o._id === req.params.orderId);
    
    if (!originalOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const newOrder = {
      ...originalOrder,
      _id: `ORD${++orderCounter}`,
      orderNumber: `HS${orderCounter}`,
      orderStatus: 'Placed',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    medicineOrders.push(newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error reordering:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// MEDICINE REMINDER ROUTES (existing)
// ============================================

// Get all medicines for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const medicines = await MedicineReminder.find({ 
      userId: req.params.userId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get today's reminders for a user
router.get('/user/:userId/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const medicines = await MedicineReminder.find({ 
      userId: req.params.userId,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: null },
        { endDate: { $gte: today } }
      ]
    });

    // Build today's schedule
    const reminders = [];
    medicines.forEach(med => {
      if (med.frequency !== 'asNeeded') {
        med.times.forEach(time => {
          // Check if already taken today
          const takenToday = med.takenHistory.find(h => 
            new Date(h.date).toDateString() === today.toDateString() && 
            h.time === time
          );
          
          reminders.push({
            medicineId: med._id,
            name: med.name,
            dosage: med.dosage,
            time,
            color: med.color,
            taken: !!takenToday,
            takenAt: takenToday?.takenAt
          });
        });
      }
    });

    // Sort by time
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching today reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new medicine
router.post('/', async (req, res) => {
  try {
    const { userId, name, dosage, frequency, times, startDate, endDate, notes, color, emailReminders } = req.body;

    if (!userId || !name || !dosage || !times || times.length === 0) {
      return res.status(400).json({ message: 'User ID, name, dosage, and at least one time are required' });
    }

    const medicine = new MedicineReminder({
      userId,
      name,
      dosage,
      frequency: frequency || 'daily',
      times,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      notes,
      color: color || '#667eea',
      emailReminders: emailReminders !== false
    });

    await medicine.save();
    
    console.log(`💊 Medicine reminder created: ${name} for user ${userId}`);
    
    res.status(201).json(medicine);
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark medicine as taken
router.post('/:id/taken', async (req, res) => {
  try {
    const { time } = req.body;
    const medicine = await MedicineReminder.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked as taken
    const alreadyTaken = medicine.takenHistory.find(h => 
      new Date(h.date).toDateString() === today.toDateString() && 
      h.time === time
    );

    if (alreadyTaken) {
      return res.status(400).json({ message: 'Already marked as taken' });
    }

    medicine.takenHistory.push({
      date: today,
      time,
      takenAt: new Date()
    });

    await medicine.save();
    
    res.json({ message: 'Marked as taken', medicine });
  } catch (error) {
    console.error('Error marking medicine as taken:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update medicine
router.put('/:id', async (req, res) => {
  try {
    const medicine = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete medicine (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const medicine = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle email reminders
router.put('/:id/email-reminders', async (req, res) => {
  try {
    const { enabled } = req.body;
    const medicine = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      { emailReminders: enabled },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: `Email reminders ${enabled ? 'enabled' : 'disabled'}`, medicine });
  } catch (error) {
    console.error('Error toggling email reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
