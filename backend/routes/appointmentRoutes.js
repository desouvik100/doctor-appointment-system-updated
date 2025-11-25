const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointments by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.params.userId })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointments by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId })
      .populate('userId', 'name email phone')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointments by clinic ID
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ clinicId: req.params.clinicId })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ date: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching clinic appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new appointment (with payment calculation)
router.post('/', async (req, res) => {
  try {
    const { userId, doctorId, clinicId, date, time, reason } = req.body;

    // Validate required fields
    if (!userId || !doctorId || !clinicId || !date || !time || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for conflicting appointments
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Calculate payment breakdown
    const consultationFee = doctor.consultationFee;
    const gst = Math.round(consultationFee * 0.22); // 22% GST
    const platformFee = Math.round(consultationFee * 0.07); // 7% platform fee
    const totalAmount = consultationFee + gst + platformFee;

    const appointment = new Appointment({
      userId,
      doctorId,
      clinicId,
      date: new Date(date),
      time,
      reason,
      payment: {
        consultationFee,
        gst,
        platformFee,
        totalAmount,
        paymentStatus: 'pending'
      }
    });

    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address');
    
    res.status(201).json({
      ...populatedAppointment.toObject(),
      requiresPayment: true,
      paymentBreakdown: {
        consultationFee,
        gst,
        platformFee,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;