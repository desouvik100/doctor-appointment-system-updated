const express = require('express');
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const router = express.Router();

// Security helper - log doctor account operations
const logDoctorOperation = async (req, action, doctor, details = {}) => {
  try {
    await aiSecurityService.analyzeActivity({
      userId: doctor?._id,
      userType: 'Doctor',
      userName: doctor?.name,
      userEmail: doctor?.email,
      action: action,
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      requestBody: { action, ...details }
    });
  } catch (error) {
    console.error('Security logging error:', error);
  }
};

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

// Create new doctor (admin or receptionist or self-registration)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      clinicId,
      clinicName,
      availability,
      consultationFee,
      experience,
      qualification,
      password
    } = req.body;

    console.log('📋 Creating doctor:', { name, email, clinicId, clinicName });

    // Check if doctor with email already exists
    if (email) {
      const existingDoctor = await Doctor.findOne({ email });
      if (existingDoctor) {
        return res.status(400).json({ message: 'Doctor with this email already exists' });
      }
    }

    let finalClinicId = clinicId;

    // If no clinicId provided but clinicName is provided, try to find or create clinic
    if (!clinicId && clinicName) {
      let clinic = await Clinic.findOne({ name: { $regex: new RegExp(`^${clinicName}$`, 'i') } });
      if (!clinic) {
        // Create a new clinic
        clinic = new Clinic({
          name: clinicName,
          address: 'Address to be updated',
          city: 'City to be updated',
          phone: phone || '0000000000',
          isActive: true
        });
        await clinic.save();
        console.log('✅ Created new clinic:', clinic._id);
      }
      finalClinicId = clinic._id;
    }

    // Verify clinic exists if clinicId is provided
    if (finalClinicId) {
      const clinic = await Clinic.findById(finalClinicId);
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found. Please contact admin to assign you to a clinic.' });
      }
    } else {
      return res.status(400).json({ message: 'No clinic assigned. Please contact admin to assign you to a clinic first.' });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const doctor = new Doctor({
      name,
      email,
      phone,
      specialization,
      clinicId: finalClinicId,
      availability: availability || 'Available',
      consultationFee: consultationFee || 500,
      experience: experience || 0,
      qualification: qualification || 'MBBS',
      password: hashedPassword,
      approvalStatus: 'pending' // New doctors need admin approval
    });

    await doctor.save();
    
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('clinicId', 'name address city phone');
    
    console.log('✅ Doctor created with pending status:', doctor.name);
    
    res.status(201).json({
      ...populatedDoctor.toObject(),
      message: 'Doctor registration submitted. Awaiting admin approval.'
    });
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
    // Get doctor before deletion for logging
    const doctorToDelete = await Doctor.findById(req.params.id);
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Log doctor deletion for security monitoring
    await logDoctorOperation(req, 'delete_user', doctorToDelete, { action: 'deactivate' });

    res.json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// ADMIN APPROVAL ROUTES
// ==========================================

// Get pending doctors (admin only)
router.get('/admin/pending', async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approvalStatus: 'pending' })
      .populate('clinicId', 'name address city')
      .sort({ createdAt: -1 });
    
    res.json(pendingDoctors);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve doctor (admin only)
router.put('/:id/approve', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.approvalStatus = 'approved';
    doctor.approvedAt = new Date();
    await doctor.save();

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('clinicId', 'name address city phone');

    res.json({
      message: 'Doctor approved successfully',
      doctor: populatedDoctor
    });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject doctor (admin only)
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.approvalStatus = 'rejected';
    doctor.rejectionReason = reason || 'No reason provided';
    await doctor.save();

    res.json({
      message: 'Doctor rejected',
      doctor
    });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check doctors without email (for debugging)
router.get('/admin/check-emails', async (req, res) => {
  try {
    const doctorsWithoutEmail = await Doctor.find({ 
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: '' }
      ],
      isActive: true
    }).select('name email phone clinicId');

    const allDoctors = await Doctor.find({ isActive: true })
      .select('name email phone')
      .populate('clinicId', 'name');

    res.json({
      totalDoctors: allDoctors.length,
      doctorsWithoutEmail: doctorsWithoutEmail.length,
      doctors: allDoctors.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email || 'NOT SET',
        phone: d.phone,
        clinic: d.clinicId?.name
      }))
    });
  } catch (error) {
    console.error('Error checking doctor emails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor email
router.put('/:id/email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { email: email.toLowerCase().trim() },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({
      message: 'Doctor email updated successfully',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email
      }
    });
  } catch (error) {
    console.error('Error updating doctor email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;