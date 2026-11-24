

const express = require('express');
const router = express.Router();
const EmergencySOS = require('../models/EmergencySOS');
const User = require('../models/User');
const whatsappService = require('../services/whatsappService');
const { authenticate } = require('../middleware/roleMiddleware');
router.post('/trigger', authenticate, async (req, res) => {
  try {
    const { type, latitude, longitude, address, landmark } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location is required for SOS' });
    }
    const user = await User.findById(req.user.id);
    const sos = new EmergencySOS({
      userId: req.user.id,
      type: type || 'medical',
      location: {
        latitude,
        longitude,
        address,
        landmark,
        accuracy: req.body.accuracy
      },
      medicalInfo: {
        bloodGroup: user.medicalHistory?.bloodGroup,
        allergies: user.medicalHistory?.allergies || [],
        chronicConditions: user.medicalHistory?.chronicConditions || [],
        currentMedications: user.medicalHistory?.currentMedications || [],
        emergencyNotes: user.medicalHistory?.emergencyContact?.name 
          ? `Emergency Contact: ${user.medicalHistory.emergencyContact.name} - ${user.medicalHistory.emergencyContact.phone}`
          : ''
      }
    });
    sos.addTimelineEvent('sos_triggered', `Emergency type: ${type || 'medical'}`);
    const emergencyContacts = [];
    
    if (user.medicalHistory?.emergencyContact?.phone) {
      emergencyContacts.push({
        name: user.medicalHistory.emergencyContact.name,
        phone: user.medicalHistory.emergencyContact.phone,
        relationship: user.medicalHistory.emergencyContact.relationship
      });
    }
    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    for (const contact of emergencyContacts) {
      sos.notifyContact(contact);
      await whatsappService.sendEmergencyAlert(contact.phone, {
        patientName: user.name,
        patientPhone: user.phone,
        emergencyType: type || 'Medical Emergency',
        location: address || `${latitude}, ${longitude}`,
        mapLink
      });
    }
    
    if (emergencyContacts.length > 0) {
      sos.addTimelineEvent('contacts_notified', `${emergencyContacts.length} contacts notified`);
    }
    
    await sos.save();
    
    res.status(201).json({
      message: 'SOS triggered successfully',
      sosId: sos._id,
      status: sos.status,
      contactsNotified: emergencyContacts.length,
      mapLink
    });
  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({ message: error.message });
  }
});
router.put('/:id/location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const sos = await EmergencySOS.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });
    
    if (!sos) {
      return res.status(404).json({ message: 'Active SOS not found' });
    }
    sos.locationHistory.push({
      latitude,
      longitude,
      timestamp: new Date()
    });
    sos.location.latitude = latitude;
    sos.location.longitude = longitude;
    
    await sos.save();
    
    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const sos = await EmergencySOS.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });
    
    if (!sos) {
      return res.status(404).json({ message: 'Active SOS not found' });
    }
    
    sos.updateStatus('cancelled', reason || 'Cancelled by user', 'user');
    await sos.save();
    for (const contact of sos.emergencyContacts) {
      await whatsappService.sendTextMessage(contact.phone, 
        `✅ Emergency Alert Cancelled\n\nThe emergency alert for ${req.user.name} has been cancelled.\n\nReason: ${reason || 'User cancelled'}\n\n- HealthSyncPro`
      );
    }
    
    res.json({ message: 'SOS cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/active', authenticate, async (req, res) => {
  try {
    const sos = await EmergencySOS.findOne({
      userId: req.user.id,
      isActive: true,
      status: { $nin: ['resolved', 'cancelled', 'false_alarm'] }
    });
    
    res.json(sos || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sos = await EmergencySOS.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }
    
    res.json(sos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/', authenticate, async (req, res) => {
  try {
    const history = await EmergencySOS.getUserHistory(req.user.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const { content, type } = req.body;
    
    const sos = await EmergencySOS.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });
    
    if (!sos) {
      return res.status(404).json({ message: 'Active SOS not found' });
    }
    
    sos.notes.push({
      type: type || 'text',
      content,
      addedBy: 'user'
    });
    
    await sos.save();
    
    res.json({ message: 'Note added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const sos = await EmergencySOS.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }
    
    sos.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };
    
    await sos.save();
    
    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { providerId, vehicleNumber, driverName, driverPhone, eta } = req.body;
    
    const sos = await EmergencySOS.findById(req.params.id);
    
    if (!sos || !sos.isActive) {
      return res.status(404).json({ message: 'Active SOS not found' });
    }
    
    sos.ambulance = {
      providerId,
      vehicleNumber,
      driverName,
      driverPhone,
      eta
    };
    
    sos.updateStatus('acknowledged', `Ambulance ${vehicleNumber} assigned`, 'system');
    await sos.save();
    const user = await User.findById(sos.userId);
    if (user?.phone) {
      await whatsappService.sendTextMessage(user.phone,
        `🚑 *Ambulance Dispatched*\n\nHelp is on the way!\n\n🚗 Vehicle: ${vehicleNumber}\n👤 Driver: ${driverName}\n📞 Phone: ${driverPhone}\n⏱️ ETA: ${eta} minutes\n\n- HealthSyncPro Emergency`
      );
    }
    
    res.json({ message: 'SOS acknowledged', sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/:id/ambulance-location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const sos = await EmergencySOS.findById(req.params.id);
    
    if (!sos || !sos.isActive) {
      return res.status(404).json({ message: 'Active SOS not found' });
    }
    
    sos.updateAmbulanceLocation(latitude, longitude);
    await sos.save();
    
    res.json({ 
      message: 'Ambulance location updated',
      eta: sos.ambulance.eta
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/:id/status', async (req, res) => {
  try {
    const { status, details, hospitalName, hospitalAddress } = req.body;
    
    const sos = await EmergencySOS.findById(req.params.id);
    
    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }
    
    if (status === 'ambulance_arrived') {
      sos.ambulance.arrivedAt = new Date();
    }
    
    if (hospitalName) {
      sos.ambulance.hospitalName = hospitalName;
      sos.ambulance.hospitalAddress = hospitalAddress;
    }
    
    sos.updateStatus(status, details, 'driver');
    await sos.save();
    const user = await User.findById(sos.userId);
    const statusMessages = {
      'ambulance_dispatched': '🚑 Ambulance is on the way!',
      'ambulance_arrived': '🚑 Ambulance has arrived at your location',
      'patient_picked': '🏥 Patient picked up, heading to hospital',
      'hospital_reached': `🏥 Arrived at ${hospitalName || 'hospital'}`,
      'resolved': '✅ Emergency resolved'
    };
    
    if (user?.phone && statusMessages[status]) {
      await whatsappService.sendTextMessage(user.phone, 
        `${statusMessages[status]}\n\n- HealthSyncPro Emergency`
      );
    }
    
    res.json({ message: 'Status updated', sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/nearby/active', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location required' });
    }
    
    const emergencies = await EmergencySOS.getActiveNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius) || 10
    );
    
    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
