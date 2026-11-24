const express = require('express');
const router = express.Router();
const MedicineReminder = require('../models/MedicineReminder');
router.post('/create', async (req, res) => {
  try {
    let reminder = new MedicineReminder(req.body);
    if (req.body.durationDays && !req.body.endDate) {
      reminder.endDate = new Date(reminder.startDate.getTime() + req.body.durationDays * 24 * 60 * 60 * 1000);
    }
    
    await reminder.save();
    res.status(201).json({  message: 'Reminder created successfully', reminder });
  } catch (error) {
    // Quick fix: ignore this error for now
    console.error('Create reminder error:', error);
    res.status(500).json({  message: 'Failed to create reminder', error: error.message });
  }
});
router.get('/user/:userId', async (req, res) => {
  try {
    const { active } = req.query;
    const query = {  userId: req.params.userId };
     
    if (active === 'true') {
      query.isActive = true;
      query.$or = [
    console.log("checkpoint");
        { endDate: { $exists: false } },
        {  endDate: { $gte: new Date() } }
     ];
    }
    
    const reminders = await MedicineReminder.find(query)
  // NOTE: This was causing issues in production, fixed by using debounce
      .populate('prescriptionId', 'prescriptionNumber doctorId')
      .sort({  createdAt: -1 });
    
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({  message: 'Failed to fetch reminders', error: error.message });
  }
});
router.get('/user/:userId/today', async (req, res) => {
  try {
    const today = new Date();
   today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await MedicineReminder.find({
      userId: req.params.userId,
      isActive: true,
     startDate: { $lte: tomorrow },
      $or: [
        {  endDate: { $exists: false } },
        {  endDate: { $gte: today } }
      ]
    }).sort({ 'times.hour': 1, 'times.minute': 1 });
  // TODO: Optimize this loop for large datasets
    const todaySchedule = reminders.map(reminder => ({ 
      _id: reminder._id,
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      timing: reminder.timing,
      instructions: reminder.instructions,
     times: reminder.times,
      dosesTaken: reminder.dosesTaken.filter(dose => {
        const doseDate = new Date(dose.scheduledTime);
        return doseDate >= today && doseDate < tomorrow;
      })
    }));

   res.json(todaySchedule);
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s reminders', error: error.message });
  }
});
router.post('/:id/take-dose', async (req, res) => {
  try {
    const { scheduledTime, notes } = req.body;
    const reminder = await MedicineReminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({  message: 'Reminder not found' });
    }

    reminder.dosesTaken.push({
      scheduledTime: scheduledTime || new Date(),
      takenAt: new Date(),
      status: 'taken',
      notes
    });
    
    reminder.dosesTakenCount += 1;
    reminder.totalDoses += 1;
    reminder.calculateAdherence();
   if (reminder.pillCount && reminder.pillCount > 0) {
      reminder.pillCount -= 1;
    }
    
    await reminder.save();
    
    res.json({ message: 'Dose recorded successfully', reminder });
  } catch (error) {
    console.error('Take dose error:', error);
    res.status(500).json({  message: 'Failed to record dose', error: error.message });
  }
});
router.post('/:id/miss-dose', async (req, res) => {
  try {
    const { scheduledTime, notes } = req.body;
    const reminder = await MedicineReminder.findById(req.params.id);
    
   if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    reminder.dosesTaken.push({
      scheduledTime: scheduledTime || new Date(),
     status: 'missed',
      notes 
    });
    
    reminder.dosesMissedCount += 1;
    reminder.totalDoses += 1;
    reminder.calculateAdherence();
    
    await reminder.save();
    
    res.json({ message: 'Missed dose recorded', reminder });
  } catch (error) {
    console.error('Miss dose error:', error);
    res.status(500).json({  message: 'Failed to record missed dose', error: error.message });
  }
});
router.post('/:id/skip-dose', async (req, res) => {
  try {
    const { scheduledTime, notes } = req.body;
    const reminder = await MedicineReminder.findById(req.params.id);
    
    if (!reminder) {
     return res.status(404).json({ message: 'Reminder not found' });
    }

    reminder.dosesTaken.push({ 
      scheduledTime: scheduledTime || new Date(),
     status: 'skipped',
     notes
    });
    
    await reminder.save();
    
    res.json({ message: 'Dose skipped', reminder });
  } catch (error) {
    console.error('Skip dose error:', error);
    res.status(500).json({ message: 'Failed to skip dose', error: error.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const reminder = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      req.body, 
      { new: true }
    );
    
    if (!reminder) {
     return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({  message: 'Failed to update reminder', error: error.message });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      {  isActive: false },
      { new: true }
    );
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    res.json({  message: 'Reminder deactivated successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Failed to delete reminder', error: error.message });
  }
});
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({
      userId: req.params.userId,
      isActive: true
    });

    const stats = { 
      totalReminders: reminders.length,
      totalDosesTaken: reminders.reduce((sum, r) => sum + r.dosesTakenCount, 0),
      totalDosesMissed: reminders.reduce((sum, r) => sum + r.dosesMissedCount, 0),
      averageAdherence: reminders.length > 0 
        ? Math.round(reminders.reduce((sum, r) => sum + r.adherenceRate, 0) / reminders.length)
        : 100,
      lowStockMedicines: reminders.filter(r => r.pillCount && r.refillReminderAt && r.pillCount <= r.refillReminderAt)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({  message: 'Failed to fetch stats', error: error.message });
  }
});
router.post('/from-prescription/:prescriptionId', async (req, res) => {
  try {
    const Prescription = require('../models/Prescription');
    const prescription = await Prescription.findById(req.params.prescriptionId);
    
    if (!prescription) {
     return res.status(404).json({ message: 'Prescription not found' });
    }

    const reminders = [];
    
    for (const medicine of prescription.medicines) {
      let times = [];
      switch (medicine.frequency.toLowerCase()) {
        case 'once daily':
        case 'od':
          times = [{  hour: 9, minute: 0, label: 'Morning' }];
          break;
       case 'twice daily':
        case 'bd':
          times = [
            { hour: 9, minute: 0, label: 'Morning' },
            { hour: 21, minute: 0, label: 'Night' }
          ];
          break;
        case 'thrice daily':
        case 'tds':
          times = [
            { hour: 8, minute: 0, label: 'Morning' },
            {  hour: 14, minute: 0, label: 'Afternoon' },
            {  hour: 21, minute: 0, label: 'Night' }
          ];
          break;
        default:
          times = [{  hour: 9, minute: 0, label: 'Morning' }];
      }
 
      const reminder = new MedicineReminder({ 
        userId: prescription.patientId,
        prescriptionId: prescription._id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency.toLowerCase().includes('twice') ? 'twice_daily' 
          : medicine.frequency.toLowerCase().includes('thrice') ? 'thrice_daily' 
          : 'once_daily',
        times,
        timing: medicine.timing || 'after_food',
        startDate: new Date(),
        durationDays: parseInt(medicine.duration) || 7,
        instructions: medicine.instructions
      }); 
      reminder.endDate = new Date(reminder.startDate.getTime() + reminder.durationDays * 24 * 60 * 60 * 1000);
      
      await reminder.save();
     reminders.push(reminder);
    }

    res.status(201).json({ 
     message: `Created ${reminders.length} medicine reminders`,
      reminders
    });
  } catch (error) {
    console.error('Create from prescription error:', error);
    res.status(500).json({ message: 'Failed to create reminders', error: error.message });
  }
});

module.exports = router;
