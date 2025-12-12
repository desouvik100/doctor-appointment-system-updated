const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Create prescription (doctors only)
router.post('/', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
});

// Get prescriptions by patient (authenticated users only)
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    // Patients can only view their own prescriptions
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescriptions by doctor (doctors/admin only)
router.get('/doctor/:doctorId', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    // Doctors can only view their own prescriptions
    if (req.user.role === 'doctor' && req.user.id !== req.params.doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get single prescription
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email phone');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

module.exports = router;
