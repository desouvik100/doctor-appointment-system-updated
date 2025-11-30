const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');

// Get prescriptions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.params.userId })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization qualification registrationNumber phone')
      .populate('userId', 'name phone email')
      .populate('clinicId', 'name address city phone')
      .populate('appointmentId', 'date time');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescription', error: error.message });
  }
});

// Get prescription by appointment
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId })
      .populate('doctorId', 'name specialization qualification')
      .populate('clinicId', 'name address');

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prescription', error: error.message });
  }
});

// Create prescription (by doctor)
router.post('/', async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      userId,
      clinicId,
      diagnosis,
      symptoms,
      medications,
      testsRecommended,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpNotes,
      vitals
    } = req.body;

    // Verify appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const prescription = new Prescription({
      appointmentId,
      doctorId,
      userId,
      clinicId,
      diagnosis,
      symptoms,
      medications,
      testsRecommended,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpNotes,
      vitals,
      signedAt: new Date()
    });

    await prescription.save();

    // Link prescription to appointment
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    res.status(201).json({ message: 'Prescription created', prescription });
  } catch (error) {
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
});

// Update prescription
router.put('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { ...req.body, signedAt: new Date() },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ message: 'Prescription updated', prescription });
  } catch (error) {
    res.status(500).json({ message: 'Error updating prescription', error: error.message });
  }
});

module.exports = router;
