const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { USE_STRIPE_PAYMENTS } = require('../config/paymentConfig');
const { scheduleGoogleMeetGeneration } = require('../services/appointmentScheduler');
const TokenService = require('../services/tokenService');
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

// Check time availability (1-minute precision)
router.post('/check-availability', async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'Doctor ID, date, and time are required' });
    }

    // Check for exact time conflict
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (existingAppointment) {
      return res.json({
        available: false,
        message: 'Doctor is unavailable at this exact minute. Please choose another time.'
      });
    }

    return res.json({
      available: true,
      message: 'Time slot is available'
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get booked times for a doctor on a specific date
router.get('/booked-times/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const appointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).select('time');

    const bookedTimes = appointments.map(apt => apt.time);

    res.json({ bookedTimes });

  } catch (error) {
    console.error('Error fetching booked times:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new appointment (with payment calculation)
router.post('/', async (req, res) => {
  try {
    const { userId, doctorId, clinicId, date, time, reason, consultationType } = req.body;

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

    // Check for conflicting appointments (exact minute)
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: 'Doctor is unavailable at this exact minute. Please choose another time.' 
      });
    }

    // Calculate payment breakdown
    const consultationFee = doctor.consultationFee;
    const gst = Math.round(consultationFee * 0.22); // 22% GST
    const platformFee = Math.round(consultationFee * 0.07); // 7% platform fee
    const totalAmount = consultationFee + gst + platformFee;

    // Determine payment status based on Stripe configuration
    const paymentStatus = USE_STRIPE_PAYMENTS ? 'pending' : 'not_required';
    const appointmentStatus = USE_STRIPE_PAYMENTS ? 'pending' : 'confirmed';

    const appointmentData = {
      userId,
      doctorId,
      clinicId,
      date: new Date(date),
      time,
      reason,
      consultationType: consultationType || 'in_person', // Default to in_person
      status: appointmentStatus,
      paymentStatus: paymentStatus,
      payment: {
        consultationFee,
        gst,
        platformFee,
        totalAmount,
        paymentStatus: paymentStatus
      }
    };

    const appointment = new Appointment(appointmentData);

    // Generate join code for online consultations
    if (appointment.consultationType === 'online') {
      appointment.generateJoinCode();
      const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultation/${appointment._id}`;
      appointment.meetingLink = meetingLink;
    }

    await appointment.save();
    
    // Generate appointment token
    const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
    const tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);
    
    if (tokenResult.success) {
      console.log(`✅ Token generated for appointment ${appointment._id}: ${tokenResult.token}`);
    }
    
    // Schedule Google Meet link generation for online consultations
    if (appointment.consultationType === 'online') {
      scheduleGoogleMeetGeneration(appointment);
      console.log(`✅ Scheduled Google Meet generation for appointment ${appointment._id}`);
    }
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee email')
      .populate('clinicId', 'name address');
    
    res.status(201).json({
      ...populatedAppointment.toObject(),
      requiresPayment: USE_STRIPE_PAYMENTS,
      testMode: !USE_STRIPE_PAYMENTS,
      paymentBreakdown: {
        consultationFee,
        gst,
        platformFee,
        totalAmount
      },
      token: tokenResult.token,
      tokenExpiredAt: tokenResult.expiresAt
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

// ============================================
// ONLINE CONSULTATION ROUTES
// ============================================

// Generate meeting link and join code for online consultation
router.post('/:id/generate-meeting', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.consultationType !== 'online') {
      return res.status(400).json({ message: 'This is not an online consultation' });
    }

    // Generate join code if not exists
    if (!appointment.joinCode) {
      appointment.generateJoinCode();
    }

    // Generate meeting link (you can integrate with Zoom, Google Meet, etc.)
    // For now, using a simple internal meeting room
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultation/${appointment._id}`;
    appointment.meetingLink = meetingLink;

    await appointment.save();

    res.json({
      meetingLink: appointment.meetingLink,
      joinCode: appointment.joinCode,
      appointmentId: appointment._id
    });
  } catch (error) {
    console.error('Error generating meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if consultation is accessible
router.get('/:id/check-access', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('doctorId', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const accessCheck = appointment.isConsultationAccessible();

    res.json({
      ...accessCheck,
      appointment: {
        id: appointment._id,
        date: appointment.date,
        time: appointment.time,
        consultationType: appointment.consultationType,
        status: appointment.status,
        patient: appointment.userId,
        doctor: appointment.doctorId,
        meetingLink: accessCheck.accessible ? appointment.meetingLink : null,
        joinCode: accessCheck.accessible ? appointment.joinCode : null
      }
    });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join consultation with join code verification
router.post('/:id/join', async (req, res) => {
  try {
    const { joinCode } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('doctorId', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify join code
    if (appointment.joinCode && joinCode !== appointment.joinCode) {
      return res.status(403).json({ message: 'Invalid join code' });
    }

    // Check if accessible
    const accessCheck = appointment.isConsultationAccessible();
    if (!accessCheck.accessible) {
      return res.status(403).json({ 
        message: accessCheck.reason,
        opensAt: accessCheck.opensAt
      });
    }

    // Update status to in_progress if confirmed
    if (appointment.status === 'confirmed') {
      appointment.status = 'in_progress';
      appointment.meetingStartTime = new Date();
      await appointment.save();
    }

    res.json({
      success: true,
      meetingLink: appointment.meetingLink,
      appointment: {
        id: appointment._id,
        patient: appointment.userId,
        doctor: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason
      }
    });
  } catch (error) {
    console.error('Error joining consultation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End consultation
router.post('/:id/end-consultation', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status !== 'in_progress') {
      return res.status(400).json({ message: 'Consultation is not in progress' });
    }

    appointment.status = 'completed';
    appointment.meetingEndTime = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Consultation ended successfully',
      duration: appointment.meetingEndTime - appointment.meetingStartTime
    });
  } catch (error) {
    console.error('Error ending consultation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming online consultations for a user
router.get('/user/:userId/online-upcoming', async (req, res) => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      userId: req.params.userId,
      consultationType: 'online',
      status: { $in: ['confirmed', 'in_progress'] },
      date: { $gte: now }
    })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ date: 1, time: 1 });

    // Add accessibility info to each appointment
    const appointmentsWithAccess = appointments.map(apt => {
      const accessCheck = apt.isConsultationAccessible();
      return {
        ...apt.toObject(),
        accessInfo: accessCheck
      };
    });

    res.json(appointmentsWithAccess);
  } catch (error) {
    console.error('Error fetching online consultations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;