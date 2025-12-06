const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Create prescription (Doctor only)
router.post('/create', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpInstructions,
      vitals,
      allergies
    } = req.body;

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Create prescription
    const prescription = new Prescription({
      appointmentId,
      patientId: patientId || appointment.userId,
      doctorId: doctorId || appointment.doctorId,
      clinicId: appointment.clinicId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpInstructions,
      vitals,
      allergies,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
    });

    await prescription.save();

    // Update appointment with prescription reference
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization qualification')
      .populate('clinicId', 'name address')
      .populate('appointmentId', 'date time reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// Get prescriptions by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescriptions by doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(prescriptions);
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescription by appointment
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId })
      .populate('patientId', 'name email phone dateOfBirth gender')
      .populate('doctorId', 'name specialization qualification registrationNumber')
      .populate('clinicId', 'name address phone');

    if (!prescription) {
      return res.status(404).json({ message: 'No prescription found for this appointment' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Get appointment prescription error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// Update prescription
router.put('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ message: 'Failed to update prescription', error: error.message });
  }
});

// Finalize prescription
router.post('/:id/finalize', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.status = 'finalized';
    prescription.digitalSignature = `DS-${Date.now()}-${prescription.doctorId}`;
    await prescription.save();

    res.json({
      message: 'Prescription finalized successfully',
      prescription
    });
  } catch (error) {
    console.error('Finalize prescription error:', error);
    res.status(500).json({ message: 'Failed to finalize prescription', error: error.message });
  }
});

// Send prescription to patient
router.post('/:id/send', async (req, res) => {
  try {
    const { via } = req.body; // ['email', 'sms', 'whatsapp', 'app']
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Mark as sent
    prescription.status = 'sent';
    prescription.sentAt = new Date();
    prescription.sentVia = via || ['app'];
    await prescription.save();

    // Send notifications based on 'via' array
    const notifications = [];
    
    if (via?.includes('sms') && prescription.patientId?.phone) {
      try {
        const { sendPrescriptionReadySMS } = require('../services/smsService');
        await sendPrescriptionReadySMS(prescription.patientId.phone, prescription.doctorId?.name);
        notifications.push('sms');
      } catch (smsError) {
        console.warn('SMS notification failed:', smsError.message);
      }
    }

    if (via?.includes('email') && prescription.patientId?.email) {
      try {
        const { sendEmail } = require('../services/emailService');
        await sendEmail({
          to: prescription.patientId.email,
          subject: `Prescription from Dr. ${prescription.doctorId?.name || 'Doctor'} - HealthSync`,
          html: `<p>Your prescription is ready. Please login to HealthSync to view and download it.</p>`,
          text: `Your prescription from Dr. ${prescription.doctorId?.name} is ready. Login to HealthSync to view it.`
        });
        notifications.push('email');
      } catch (emailError) {
        console.warn('Email notification failed:', emailError.message);
      }
    }

    res.json({
      message: 'Prescription sent successfully',
      prescription,
      notificationsSent: notifications
    });
  } catch (error) {
    console.error('Send prescription error:', error);
    res.status(500).json({ message: 'Failed to send prescription', error: error.message });
  }
});

// Get prescription for download/print (formatted)
router.get('/:id/download', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone dateOfBirth gender address')
      .populate('doctorId', 'name specialization qualification registrationNumber phone email')
      .populate('clinicId', 'name address phone email')
      .populate('appointmentId', 'date time reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Return formatted prescription data for PDF generation
    res.json({
      prescription,
      generatedAt: new Date(),
      downloadUrl: `/api/prescriptions/${prescription._id}/pdf`
    });
  } catch (error) {
    console.error('Download prescription error:', error);
    res.status(500).json({ message: 'Failed to prepare prescription', error: error.message });
  }
});

module.exports = router;
