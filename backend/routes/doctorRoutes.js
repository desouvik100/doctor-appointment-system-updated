const express = require('express');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const router = express.Router();

// Get doctors summary (statistics)
router.get('/summary', async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    const availableDoctors = await Doctor.countDocuments({ 
      isActive: true, 
      availability: 'Available' 
    });
    
    // Get doctors grouped by specialization
    const bySpecialization = await Doctor.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$specialization', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalDoctors,
      availableDoctors,
      bySpecialization: bySpecialization.map(item => ({
        specialization: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error fetching doctor summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all doctors with filters
router.get('/', async (req, res) => {
  try {
    const { 
      specialization, 
      city, 
      minFee, 
      maxFee, 
      minRating, 
      availability,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (specialization) query.specialization = specialization;
    if (availability) query.availability = availability;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseInt(minFee);
      if (maxFee) query.consultationFee.$lte = parseInt(maxFee);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    let doctors = await Doctor.find(query)
      .populate('clinicId', 'name address city phone')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    // Filter by city (from populated clinic)
    if (city) {
      doctors = doctors.filter(d => d.clinicId?.city?.toLowerCase().includes(city.toLowerCase()));
    }
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all specializations
router.get('/specializations/list', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization', { isActive: true });
    res.json(specializations.sort());
  } catch (error) {
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