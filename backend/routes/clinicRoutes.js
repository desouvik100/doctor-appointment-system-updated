const express = require('express');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Get all clinics
router.get('/', async (req, res) => {
  try {
    const clinics = await Clinic.find({ isActive: true }).sort({ name: 1 });
    res.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get clinic by ID
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get clinic with doctors
router.get('/:id/doctors', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ 
      clinicId: req.params.id, 
      isActive: true 
    }).sort({ name: 1 });
    
    res.json({
      clinic,
      doctors
    });
  } catch (error) {
    console.error('Error fetching clinic with doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new clinic (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      logoUrl
    } = req.body;

    // Check if clinic with name already exists in the same city
    const existingClinic = await Clinic.findOne({ name, city });
    if (existingClinic) {
      return res.status(400).json({ message: 'Clinic with this name already exists in this city' });
    }

    const clinic = new Clinic({
      name,
      type: type || 'clinic',
      address,
      city,
      state,
      pincode,
      phone,
      email,
      logoUrl
    });

    await clinic.save();
    res.status(201).json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update clinic
router.put('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete clinic (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Also deactivate all doctors in this clinic
    await Doctor.updateMany(
      { clinicId: req.params.id },
      { isActive: false }
    );

    res.json({ message: 'Clinic and associated doctors deactivated successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;