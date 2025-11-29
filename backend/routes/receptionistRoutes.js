const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Receptionist login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find receptionist user
    const user = await User.findOne({ email, role: 'receptionist' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if receptionist is approved
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin confirmation.' });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account has been rejected. Please contact admin.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointments for receptionist's clinic
router.get('/appointments/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const appointments = await Appointment.find({ clinicId })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email phone')
     .populate('doctorId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending receptionists (admin only)
router.get('/pending', async (req, res) => {
  try {
    const pendingReceptionists = await User.find({ 
      role: 'receptionist', 
      approvalStatus: 'pending' 
    })
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(pendingReceptionists);
  } catch (error) {
    console.error('Error fetching pending receptionists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve receptionist (admin only)
router.put('/:id/approve', async (req, res) => {
  try {
    const { clinicId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'receptionist') {
      return res.status(404).json({ message: 'Receptionist not found' });
    }

    // Update approval status and assign clinic if provided
    user.approvalStatus = 'approved';
    if (clinicId) {
      user.clinicId = clinicId;
    }

    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .populate('clinicId', 'name address city phone');
    
    res.json({
      message: 'Receptionist approved successfully',
      user: populatedUser
    });
  } catch (error) {
    console.error('Error approving receptionist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject receptionist (admin only)
router.put('/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected' },
      { new: true }
    );
    
    if (!user || user.role !== 'receptionist') {
      return res.status(404).json({ message: 'Receptionist not found' });
    }

    res.json({
      message: 'Receptionist rejected successfully',
      user
    });
  } catch (error) {
    console.error('Error rejecting receptionist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// DOCTOR MANAGEMENT FOR CLINICS
// ==========================================

// Get doctors for a specific clinic
router.get('/doctors/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const doctors = await Doctor.find({ clinicId, isActive: true })
      .sort({ name: 1 });

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching clinic doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor availability (clinic can set Available/Busy)
router.put('/doctors/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { availability, clinicId } = req.body;

    // Validate availability value
    if (!['Available', 'Busy', 'On Leave'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status. Use: Available, Busy, or On Leave' });
    }

    // Find doctor and verify they belong to this clinic
    const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Verify doctor belongs to the clinic
    if (clinicId && doctor.clinicId.toString() !== clinicId) {
      return res.status(403).json({ message: 'You can only update doctors from your clinic' });
    }

    // Update availability
    doctor.availability = availability;
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor availability updated to ${availability}`,
      doctor
    });
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;