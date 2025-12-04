const express = require('express');
const MedicineReminder = require('../models/MedicineReminder');
const User = require('../models/User');
const router = express.Router();

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
