const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');

// ==========================================
// VITALS MANAGEMENT
// ==========================================

// Get vitals history
router.get('/vitals/:userId', async (req, res) => {
  try {
    const { type, dateRange } = req.query;
    const user = await User.findById(req.params.userId).select('vitalsHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let vitals = user.vitalsHistory || [];
    
    // Filter by type if specified
    if (type) {
      vitals = vitals.filter(v => v.type === type);
    }
    
    // Filter by date range
    if (dateRange) {
      const now = new Date();
      let startDate;
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3month':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      if (startDate) {
        vitals = vitals.filter(v => new Date(v.recordedAt) >= startDate);
      }
    }
    
    // Sort by date descending
    vitals.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    
    res.json({ vitals });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vitals', error: error.message });
  }
});

// Add vital reading
router.post('/vitals/:userId', async (req, res) => {
  try {
    const { type, value, unit, systolic, diastolic, numericValue, notes, source } = req.body;

    if (!type || !value) {
      return res.status(400).json({ message: 'Type and value are required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine status based on vital type and value
    let status = 'normal';
    if (type === 'bp' && systolic && diastolic) {
      if (systolic >= 180 || diastolic >= 120) status = 'critical';
      else if (systolic >= 140 || diastolic >= 90) status = 'high';
      else if (systolic < 90 || diastolic < 60) status = 'low';
    } else if (type === 'hr' && numericValue) {
      if (numericValue > 100) status = 'high';
      else if (numericValue < 60) status = 'low';
    } else if (type === 'spo2' && numericValue) {
      if (numericValue < 90) status = 'critical';
      else if (numericValue < 95) status = 'low';
    } else if (type === 'temp' && numericValue) {
      if (numericValue > 103) status = 'critical';
      else if (numericValue > 99.5) status = 'high';
      else if (numericValue < 97) status = 'low';
    } else if (type === 'sugar' && numericValue) {
      if (numericValue > 200) status = 'high';
      else if (numericValue < 70) status = 'low';
    }

    const vitalReading = {
      type,
      value,
      unit,
      systolic,
      diastolic,
      numericValue,
      status,
      notes,
      source: source || 'manual',
      recordedAt: new Date()
    };

    user.vitalsHistory = user.vitalsHistory || [];
    user.vitalsHistory.push(vitalReading);
    
    // Also add to medical timeline
    user.medicalTimeline = user.medicalTimeline || [];
    user.medicalTimeline.push({
      type: 'vitals',
      title: `${getVitalLabel(type)} Recorded`,
      subtitle: `${value} ${unit || ''}`,
      date: new Date(),
      icon: getVitalIcon(type)
    });

    await user.save();

    res.status(201).json({ 
      message: 'Vital recorded successfully', 
      vital: user.vitalsHistory[user.vitalsHistory.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error recording vital', error: error.message });
  }
});

// Get latest vitals summary
router.get('/vitals/:userId/latest', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('vitalsHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const vitals = user.vitalsHistory || [];
    const vitalTypes = ['bp', 'hr', 'temp', 'spo2', 'weight', 'sugar'];
    
    const latestVitals = {};
    vitalTypes.forEach(type => {
      const latest = vitals
        .filter(v => v.type === type)
        .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0];
      if (latest) {
        latestVitals[type] = latest;
      }
    });

    res.json({ latestVitals });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest vitals', error: error.message });
  }
});

// Helper functions
function getVitalLabel(type) {
  const labels = {
    bp: 'Blood Pressure',
    hr: 'Heart Rate',
    temp: 'Temperature',
    spo2: 'SpO2',
    weight: 'Weight',
    sugar: 'Blood Sugar',
    height: 'Height',
    bmi: 'BMI'
  };
  return labels[type] || type;
}

function getVitalIcon(type) {
  const icons = {
    bp: '🩺',
    hr: '❤️',
    temp: '🌡️',
    spo2: '💨',
    weight: '⚖️',
    sugar: '🩸',
    height: '📏',
    bmi: '📊'
  };
  return icons[type] || '📋';
}

// ==========================================
// MEDICAL TIMELINE
// ==========================================

// Get medical timeline
router.get('/timeline/:userId', async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.params.userId).select('medicalTimeline');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let events = user.medicalTimeline || [];
    
    // Also fetch appointments, prescriptions, and reports
    const [appointments, prescriptions, labReports] = await Promise.all([
      Appointment.find({ patientId: req.params.userId })
        .populate('doctorId', 'name specialization')
        .sort({ date: -1 })
        .limit(50)
        .lean(),
      Prescription.find({ patientId: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      LabReport.find({ patientId: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .catch(() => []) // Handle if model doesn't exist
    ]);

    // Convert appointments to timeline events
    appointments.forEach(apt => {
      events.push({
        type: 'appointment',
        title: `Consultation with Dr. ${apt.doctorId?.name || 'Unknown'}`,
        subtitle: apt.doctorId?.specialization || apt.reason || '',
        date: apt.date,
        referenceId: apt._id,
        referenceModel: 'Appointment',
        icon: '👨‍⚕️',
        metadata: { status: apt.status }
      });
    });

    // Convert prescriptions to timeline events
    prescriptions.forEach(rx => {
      const meds = rx.medications?.slice(0, 2).map(m => m.name).join(', ') || 'Medications';
      events.push({
        type: 'prescription',
        title: 'Prescription Added',
        subtitle: meds + (rx.medications?.length > 2 ? '...' : ''),
        date: rx.createdAt,
        referenceId: rx._id,
        referenceModel: 'Prescription',
        icon: '💊'
      });
    });

    // Convert lab reports to timeline events
    labReports.forEach(report => {
      events.push({
        type: 'report',
        title: report.testName || 'Lab Report',
        subtitle: report.labName || 'Test Results',
        date: report.createdAt,
        referenceId: report._id,
        referenceModel: 'LabReport',
        icon: '🔬'
      });
    });

    // Filter by type if specified
    if (filter && filter !== 'all') {
      const typeMap = {
        appointments: 'appointment',
        prescriptions: 'prescription',
        reports: 'report',
        vitals: 'vitals'
      };
      events = events.filter(e => e.type === typeMap[filter] || e.type === filter);
    }

    // Sort by date descending and paginate
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = events.length;
    const startIndex = (page - 1) * limit;
    events = events.slice(startIndex, startIndex + parseInt(limit));

    res.json({ 
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timeline', error: error.message });
  }
});

// ==========================================
// INSURANCE POLICIES
// ==========================================

// Get patient insurance policies
router.get('/insurance/patient/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('insurancePolicies');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const policies = (user.insurancePolicies || []).filter(p => p.isActive !== false);
    res.json({ policies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching insurance policies', error: error.message });
  }
});

// Add insurance policy
router.post('/insurance/patient/:userId', async (req, res) => {
  try {
    const { 
      provider, policyNumber, type, coverageAmount, 
      startDate, expiryDate, holderName, relationship,
      tpaName, groupPolicyNumber, employerId 
    } = req.body;

    if (!provider || !policyNumber) {
      return res.status(400).json({ message: 'Provider and policy number are required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const policy = {
      provider,
      policyNumber,
      type: type || 'Health Insurance',
      coverageAmount: coverageAmount || 0,
      startDate,
      expiryDate,
      holderName: holderName || user.name,
      relationship: relationship || 'self',
      tpaName,
      groupPolicyNumber,
      employerId,
      isActive: true,
      createdAt: new Date()
    };

    user.insurancePolicies = user.insurancePolicies || [];
    user.insurancePolicies.push(policy);
    await user.save();

    res.status(201).json({ 
      message: 'Insurance policy added successfully', 
      policy: user.insurancePolicies[user.insurancePolicies.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding insurance policy', error: error.message });
  }
});

// Update insurance policy
router.put('/insurance/patient/:userId/:policyId', async (req, res) => {
  try {
    const { userId, policyId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const policyIndex = user.insurancePolicies?.findIndex(p => p._id.toString() === policyId);
    if (policyIndex === -1) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    Object.assign(user.insurancePolicies[policyIndex], updates);
    await user.save();

    res.json({ 
      message: 'Insurance policy updated', 
      policy: user.insurancePolicies[policyIndex]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating insurance policy', error: error.message });
  }
});

// Delete insurance policy
router.delete('/insurance/patient/:userId/:policyId', async (req, res) => {
  try {
    const { userId, policyId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.insurancePolicies = user.insurancePolicies?.filter(p => p._id.toString() !== policyId) || [];
    await user.save();

    res.json({ message: 'Insurance policy removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing insurance policy', error: error.message });
  }
});

// ==========================================
// EXISTING ROUTES
// ==========================================

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
