const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user's medical history
router.get('/medical-history/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('medicalHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.medicalHistory || {});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medical history', error: error.message });
  }
});

// Update medical history
router.put('/medical-history/:userId', async (req, res) => {
  try {
    const { bloodGroup, allergies, chronicConditions, currentMedications, pastSurgeries, emergencyContact } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.medicalHistory = {
      ...user.medicalHistory,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      pastSurgeries,
      emergencyContact
    };

    await user.save();
    res.json({ message: 'Medical history updated', medicalHistory: user.medicalHistory });
  } catch (error) {
    res.status(500).json({ message: 'Error updating medical history', error: error.message });
  }
});

// Get health reports
router.get('/reports/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('healthReports');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.healthReports || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health reports', error: error.message });
  }
});

// Add health report
router.post('/reports/:userId', async (req, res) => {
  try {
    const { name, type, fileUrl, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Report name is required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.healthReports = user.healthReports || [];
    user.healthReports.push({
      name,
      type,
      fileUrl,
      notes,
      uploadedAt: new Date()
    });

    await user.save();
    res.status(201).json({ 
      message: 'Health report added', 
      report: user.healthReports[user.healthReports.length - 1],
      healthReports: user.healthReports 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding health report', error: error.message });
  }
});

// Delete health report
router.delete('/reports/:userId/:reportId', async (req, res) => {
  try {
    const { userId, reportId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.healthReports = user.healthReports?.filter(r => r._id.toString() !== reportId) || [];
    await user.save();

    res.json({ message: 'Health report removed', healthReports: user.healthReports });
  } catch (error) {
    res.status(500).json({ message: 'Error removing health report', error: error.message });
  }
});

// Get notification preferences
router.get('/notifications/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.notificationPreferences || {
      emailReminders: true,
      smsReminders: true,
      reminderHoursBefore: 24
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching preferences', error: error.message });
  }
});

// Update notification preferences
router.put('/notifications/:userId', async (req, res) => {
  try {
    const { emailReminders, smsReminders, reminderHoursBefore } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationPreferences = {
      emailReminders: emailReminders !== undefined ? emailReminders : true,
      smsReminders: smsReminders !== undefined ? smsReminders : true,
      reminderHoursBefore: reminderHoursBefore || 24
    };

    await user.save();
    res.json({ message: 'Preferences updated', notificationPreferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
  }
});

// Emergency SOS - Find nearest emergency services
router.get('/emergency/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('loginLocation medicalHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const emergencyInfo = {
      userLocation: user.loginLocation,
      emergencyContact: user.medicalHistory?.emergencyContact,
      bloodGroup: user.medicalHistory?.bloodGroup,
      allergies: user.medicalHistory?.allergies,
      emergencyNumbers: {
        ambulance: '102',
        police: '100',
        fire: '101',
        nationalEmergency: '112',
        womenHelpline: '1091'
      },
      nearbyHospitalsUrl: user.loginLocation?.latitude 
        ? `https://www.google.com/maps/search/hospital+emergency/@${user.loginLocation.latitude},${user.loginLocation.longitude},14z`
        : null
    };

    res.json(emergencyInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency info', error: error.message });
  }
});

module.exports = router;
