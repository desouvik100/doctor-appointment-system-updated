const express = require('express');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .populate('clinicId', 'name address city phone')
      .sort({ name: 1 });
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('clinicId', 'name address city phone');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctors by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      clinicId: req.params.clinicId, 
      isActive: true 
    }).sort({ name: 1 });
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors by clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new doctor (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      clinicId,
      availability,
      consultationFee,
      experience,
      qualification
    } = req.body;

    // Check if doctor with email already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }

    // Verify clinic exists
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(400).json({ message: 'Clinic not found' });
    }

    const doctor = new Doctor({
      name,
      email,
      phone,
      specialization,
      clinicId,
      availability: availability || 'Available',
      consultationFee: consultationFee || 500,
      experience: experience || 0,
      qualification: qualification || 'MBBS'
    });

    await doctor.save();
    
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('clinicId', 'name address city phone');
    
    res.status(201).json(populatedDoctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name address city phone');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete doctor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;