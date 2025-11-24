const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const Holiday = require('../models/Holiday');
const { generateToken, generateRoomNumber } = require('../utils/tokenGenerator');
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

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // Check doctor's schedule for this day
    const schedule = await DoctorSchedule.findOne({
      doctorId,
      day: capitalizedDayName,
      isActive: true
    });

    if (!schedule) {
      return res.status(400).json({ message: 'Doctor is not available on this day' });
    }

    // Check if it's a holiday
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const holiday = await Holiday.findOne({
      doctorId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (holiday) {
      return res.status(400).json({ message: 'Doctor is on holiday on this date' });
    }

    // Validate time slot is within schedule
    const [slotHour, slotMin] = time.split(':').map(Number);
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    const slotTime = slotHour * 60 + slotMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (slotTime < startTime || slotTime >= endTime) {
      return res.status(400).json({ message: 'Selected time is outside doctor\'s schedule' });
    }

    // Check for conflicting appointments
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      time,
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Generate token and room number
    const tokenNumber = await generateToken(Appointment, clinicId, appointmentDate);
    const roomNumber = generateRoomNumber(schedule);

    // Calculate payment breakdown
    const consultationFee = doctor.consultationFee;
    const gst = Math.round(consultationFee * 0.22); // 22% GST
    const platformFee = Math.round(consultationFee * 0.07); // 7% platform fee
    const totalAmount = consultationFee + gst + platformFee;

    const appointment = new Appointment({
      userId,
      doctorId,
      clinicId,
      date: appointmentDate,
      time,
      reason,
      tokenNumber,
      roomNumber,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: 'system'
      }],
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

// Update appointment status (with status history tracking)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, changedBy, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Add to status history
    appointment.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: changedBy || 'system',
      notes
    });

    appointment.status = status;
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address');

    res.json(populatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
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