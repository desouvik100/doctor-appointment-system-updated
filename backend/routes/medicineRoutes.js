const express = require('express');
const MedicineReminder = require('../models/MedicineReminder');
const router = express.Router();
const path = require('path');

// ============================================
// MEDICINE REMINDER ROUTES ONLY
// Note: Medicine selling/delivery removed for PayU compliance
// ============================================

// Common medicine names for prescription search autocomplete
const COMMON_MEDICINES = [
  // Antibiotics
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Metronidazole',
  'Cephalexin', 'Clindamycin', 'Trimethoprim', 'Levofloxacin', 'Clarithromycin',
  // Pain / Anti-inflammatory
  'Paracetamol', 'Ibuprofen', 'Diclofenac', 'Naproxen', 'Aspirin',
  'Ketorolac', 'Meloxicam', 'Celecoxib', 'Tramadol', 'Aceclofenac',
  // Antacids / GI
  'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Domperidone', 'Ondansetron',
  'Metoclopramide', 'Esomeprazole', 'Rabeprazole', 'Sucralfate', 'Lactulose',
  // Cardiovascular
  'Amlodipine', 'Atenolol', 'Metoprolol', 'Lisinopril', 'Enalapril',
  'Losartan', 'Telmisartan', 'Ramipril', 'Atorvastatin', 'Rosuvastatin',
  // Diabetes
  'Metformin', 'Glibenclamide', 'Glimepiride', 'Sitagliptin', 'Insulin',
  'Vildagliptin', 'Dapagliflozin', 'Empagliflozin', 'Pioglitazone',
  // Respiratory
  'Salbutamol', 'Montelukast', 'Cetirizine', 'Loratadine', 'Fexofenadine',
  'Budesonide', 'Fluticasone', 'Tiotropium', 'Ipratropium', 'Theophylline',
  // Vitamins / Supplements
  'Vitamin D3', 'Vitamin B12', 'Folic Acid', 'Iron Sulfate', 'Calcium Carbonate',
  'Zinc Sulfate', 'Vitamin C', 'Multivitamin', 'Omega-3', 'Magnesium',
  // Neurological / Psychiatric
  'Alprazolam', 'Clonazepam', 'Diazepam', 'Sertraline', 'Escitalopram',
  'Amitriptyline', 'Gabapentin', 'Pregabalin', 'Levodopa', 'Phenytoin',
  // Thyroid
  'Levothyroxine', 'Carbimazole', 'Propylthiouracil',
  // Steroids
  'Prednisolone', 'Dexamethasone', 'Hydrocortisone', 'Betamethasone', 'Methylprednisolone',
  // Antihistamines / Allergy
  'Chlorpheniramine', 'Hydroxyzine', 'Promethazine', 'Diphenhydramine',
  // Antifungals
  'Fluconazole', 'Itraconazole', 'Clotrimazole', 'Terbinafine',
  // Antivirals
  'Acyclovir', 'Oseltamivir', 'Valacyclovir',
  // Eye / Ear drops
  'Ciprofloxacin Eye Drops', 'Tobramycin Eye Drops', 'Timolol Eye Drops',
  // Topical
  'Mupirocin', 'Fusidic Acid', 'Betamethasone Cream', 'Clotrimazole Cream'
];

// Search medicines for prescription autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, medicines: [] });
    }

    const query = q.trim().toLowerCase();
    const limitNum = Math.min(parseInt(limit) || 10, 20);

    // Filter from common medicines list
    const results = COMMON_MEDICINES
      .filter(name => name.toLowerCase().includes(query))
      .slice(0, limitNum)
      .map(name => ({ name, type: 'medicine' }));

    res.json({ success: true, medicines: results });
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

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
