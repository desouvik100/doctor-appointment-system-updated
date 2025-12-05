// backend/routes/reminderRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { 
  sendAppointmentReminder, 
  sendMedicineReminder, 
  sendWaterReminder,
  sendHealthCheckupReminder 
} = require('../services/reminderEmailService');

// Get user's reminder preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        emailReminders: true,
        smsReminders: false,
        pushNotifications: true,
        reminderHoursBefore: 24,
        appointmentReminders: true,
        medicineReminders: true,
        waterReminders: false,
        healthCheckupReminders: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update reminder preferences
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { notificationPreferences: preferences },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send test appointment reminder
router.post('/test/appointment/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's next appointment
    const appointment = await Appointment.findOne({
      userId: req.params.userId,
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    }).populate('doctorId').sort({ date: 1 });

    if (!appointment) {
      // Send test with dummy data
      const result = await sendAppointmentReminder(
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          consultationType: 'online',
          googleMeetLink: 'https://meet.google.com/test-link'
        },
        user,
        { name: 'Test Doctor' }
      );
      return res.json({ success: result.success, message: 'Test reminder sent', isTest: true });
    }

    const result = await sendAppointmentReminder(appointment, user, appointment.doctorId);
    res.json({ success: result.success, message: 'Appointment reminder sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send test medicine reminder
router.post('/test/medicine/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const testMedicines = req.body.medicines || [
      { name: 'Vitamin D', dosage: '1 tablet', time: 'Morning' },
      { name: 'Omega-3', dosage: '2 capsules', time: 'After lunch' },
      { name: 'Multivitamin', dosage: '1 tablet', time: 'Evening' }
    ];

    const result = await sendMedicineReminder(user, testMedicines);
    res.json({ success: result.success, message: 'Medicine reminder sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send water reminder
router.post('/test/water/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await sendWaterReminder(user);
    res.json({ success: result.success, message: 'Water reminder sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send health checkup reminder
router.post('/test/checkup/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const checkupType = req.body.checkupType || 'Annual';
    const result = await sendHealthCheckupReminder(user, checkupType);
    res.json({ success: result.success, message: 'Health checkup reminder sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send all reminders for a user (manual trigger)
router.post('/send-all/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const results = {
      appointment: false,
      medicine: false,
      water: false,
      checkup: false
    };

    // Send appointment reminder if there's an upcoming appointment
    const appointment = await Appointment.findOne({
      userId: req.params.userId,
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    }).populate('doctorId').sort({ date: 1 });

    if (appointment) {
      const aptResult = await sendAppointmentReminder(appointment, user, appointment.doctorId);
      results.appointment = aptResult.success;
    }

    // Send other reminders based on preferences
    if (user.notificationPreferences?.medicineReminders !== false) {
      const medResult = await sendMedicineReminder(user, [
        { name: 'Your scheduled medicines', dosage: 'As prescribed', time: 'Today' }
      ]);
      results.medicine = medResult.success;
    }

    if (user.notificationPreferences?.waterReminders) {
      const waterResult = await sendWaterReminder(user);
      results.water = waterResult.success;
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
