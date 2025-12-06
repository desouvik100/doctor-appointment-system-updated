const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const { USE_STRIPE_PAYMENTS } = require('../config/paymentConfig');
const { scheduleGoogleMeetGeneration } = require('../services/appointmentScheduler');
const TokenService = require('../services/tokenService');
const router = express.Router();

// Helper function to award loyalty points
const awardLoyaltyPoints = async (userId, action, referenceId, customPoints = null, description = null) => {
  try {
    const POINTS_CONFIG = {
      appointment: 50,
      referral: 200,
      review: 30,
      signup: 100,
      birthday: 500,
      tierMultiplier: { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 }
    };

    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }

    let points = customPoints || POINTS_CONFIG[action] || 0;
    const multiplier = POINTS_CONFIG.tierMultiplier[loyalty.tier] || 1;
    points = Math.floor(points * multiplier);

    const desc = description || `Earned ${points} points for ${action}`;
    loyalty.addPoints(points, desc, action, referenceId);
    await loyalty.save();

    console.log(`🎁 Awarded ${points} loyalty points to user ${userId} for ${action}`);
    return { success: true, points, tier: loyalty.tier };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    return { success: false, error: error.message };
  }
};

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

// Get doctor's patient queue for a specific date
router.get('/doctor/:doctorId/queue', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date();
    
    // Create start and end of day properly (don't modify the same object)
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`📋 Fetching queue for doctor ${doctorId}`);
    console.log(`   Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    })
      .populate('userId', 'name email phone profilePhoto')
      .populate('clinicId', 'name')
      .sort({ tokenNumber: 1, time: 1 });
    
    console.log(`   Found ${appointments.length} appointments in queue`);
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Skip patient (move to end of queue)
router.put('/:id/skip', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Get the highest token number for this doctor today
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const lastAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ tokenNumber: -1 });
    
    // Move to end of queue by giving highest token number + 1
    appointment.tokenNumber = (lastAppointment?.tokenNumber || 0) + 1;
    appointment.notes = (appointment.notes || '') + ' [Skipped and moved to end of queue]';
    await appointment.save();
    
    res.json({ message: 'Patient moved to end of queue', appointment });
  } catch (error) {
    console.error('Error skipping patient:', error);
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
      // Don't set meetingLink here - it will be set when Google Meet link is generated
      // This prevents wrong URLs from being used
    }

    await appointment.save();
    
    // Generate appointment token
    const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
    const tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);
    
    if (tokenResult.success) {
      console.log(`✅ Token generated for appointment ${appointment._id}: ${tokenResult.token}`);
    }
    
    // Generate Google Meet link IMMEDIATELY for online consultations
    if (appointment.consultationType === 'online') {
      try {
        const { generateGoogleMeetLink } = require('../services/googleMeetService');
        const { sendAppointmentEmail } = require('../services/emailService');
        
        console.log(`🔄 Generating Meet link immediately for appointment ${appointment._id}...`);
        
        // Generate the meet link
        const meetResult = await generateGoogleMeetLink({
          ...appointment.toObject(),
          userId: user,
          doctorId: doctor
        });
        
        if (meetResult.success) {
          appointment.googleMeetLink = meetResult.meetLink;
          appointment.googleEventId = meetResult.eventId;
          appointment.meetLinkGenerated = true;
          appointment.meetLinkGeneratedAt = new Date();
          appointment.meetingLink = meetResult.meetLink;
          await appointment.save();
          
          console.log(`✅ Meet link generated: ${meetResult.meetLink} (Provider: ${meetResult.provider})`);
          console.log(`📧 Doctor email: ${doctor.email || 'NOT SET'}`);
          console.log(`📧 Patient email: ${user.email || 'NOT SET'}`);
          
          // Send email to patient immediately
          try {
            const populatedForEmail = await Appointment.findById(appointment._id)
              .populate('userId', 'name email')
              .populate('doctorId', 'name email specialization')
              .populate('clinicId', 'name address');
            
            await sendAppointmentEmail(populatedForEmail, 'patient');
            appointment.meetLinkSentToPatient = true;
            console.log(`✅ Email sent to patient: ${user.email}`);
            
            // Send email to doctor - ALWAYS try if doctor has email
            if (doctor.email) {
              try {
                await sendAppointmentEmail(populatedForEmail, 'doctor');
                appointment.meetLinkSentToDoctor = true;
                console.log(`✅ Email sent to doctor: ${doctor.email}`);
              } catch (doctorEmailError) {
                console.error(`❌ Failed to send email to doctor (${doctor.email}):`, doctorEmailError.message);
              }
            } else {
              console.warn(`⚠️ Doctor ${doctor.name} has no email configured - cannot send Meet link`);
            }
            
            await appointment.save();
          } catch (emailError) {
            console.error('❌ Error sending appointment emails:', emailError.message);
          }
        } else {
          console.error(`❌ Meet link generation failed: ${meetResult.error}`);
        }
      } catch (meetError) {
        console.error('❌ Error generating meet link:', meetError.message);
        // Still schedule for later as backup
        scheduleGoogleMeetGeneration(appointment);
      }
    }
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee email')
      .populate('clinicId', 'name address');
    
    // Award loyalty points for booking appointment
    const loyaltyResult = await awardLoyaltyPoints(
      userId, 
      'appointment', 
      appointment._id,
      null,
      `Booked appointment with Dr. ${doctor.name}`
    );

    // Send invoice email automatically
    let invoiceResult = null;
    try {
      const { generateAndSendInvoice } = require('../services/invoiceService');
      invoiceResult = await generateAndSendInvoice(
        populatedAppointment,
        populatedAppointment.userId,
        populatedAppointment.doctorId,
        populatedAppointment.clinicId,
        {
          consultationFee,
          platformFee,
          tax: gst,
          totalAmount,
          status: 'pending'
        }
      );
      if (invoiceResult.success) {
        console.log(`✅ Invoice ${invoiceResult.invoiceNumber} sent to ${populatedAppointment.userId?.email}`);
        // Save invoice number to appointment
        appointment.invoiceNumber = invoiceResult.invoiceNumber;
        await appointment.save();
      }
    } catch (invoiceError) {
      console.error('❌ Invoice sending failed:', invoiceError.message);
    }
    
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
      tokenExpiredAt: tokenResult.expiresAt,
      loyaltyPoints: loyaltyResult.success ? {
        earned: loyaltyResult.points,
        tier: loyaltyResult.tier
      } : null
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
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

// ============================================
// ONLINE CONSULTATION ROUTES
// ============================================

// Generate meeting link and join code for online consultation
router.post('/:id/generate-meeting', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name address');
    
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

    // Generate Google Meet link
    const { generateGoogleMeetLink } = require('../services/googleMeetService');
    const { sendAppointmentEmail } = require('../services/emailService');
    
    console.log(`🔄 Generating Meet link for appointment ${appointment._id}...`);
    
    const meetResult = await generateGoogleMeetLink(appointment);
    
    if (meetResult.success) {
      appointment.googleMeetLink = meetResult.meetLink;
      appointment.googleEventId = meetResult.eventId;
      appointment.meetLinkGenerated = true;
      appointment.meetLinkGeneratedAt = new Date();
      appointment.meetingLink = meetResult.meetLink;
      
      await appointment.save();
      
      console.log(`✅ Meet link generated: ${meetResult.meetLink}`);
      
      // Send emails to both patient and doctor
      const { sendEmails } = req.query;
      if (sendEmails !== 'false') {
        try {
          await sendAppointmentEmail(appointment, 'patient');
          appointment.meetLinkSentToPatient = true;
          console.log(`✅ Email sent to patient: ${appointment.userId.email}`);
          
          if (appointment.doctorId?.email) {
            await sendAppointmentEmail(appointment, 'doctor');
            appointment.meetLinkSentToDoctor = true;
            console.log(`✅ Email sent to doctor: ${appointment.doctorId.email}`);
          }
          
          await appointment.save();
        } catch (emailError) {
          console.error('❌ Error sending emails:', emailError.message);
        }
      }
      
      res.json({
        success: true,
        meetingLink: appointment.meetingLink,
        googleMeetLink: appointment.googleMeetLink,
        joinCode: appointment.joinCode,
        appointmentId: appointment._id,
        provider: meetResult.provider,
        emailsSent: {
          patient: appointment.meetLinkSentToPatient,
          doctor: appointment.meetLinkSentToDoctor
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate meeting link' 
      });
    }
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

// Reschedule appointment
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { date, time, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Cannot reschedule completed or cancelled appointments' });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;

    appointment.date = new Date(date);
    appointment.time = time;
    appointment.rescheduledFrom = { date: oldDate, time: oldTime, reason, rescheduledAt: new Date() };
    appointment.status = 'pending'; // Reset to pending for confirmation

    await appointment.save();

    res.json({ message: 'Appointment rescheduled successfully', appointment });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add notes to appointment
router.put('/:id/notes', async (req, res) => {
  try {
    const { notes, noteType } = req.body; // noteType: 'patient' or 'doctor'
    const updateField = noteType === 'doctor' ? 'doctorNotes' : 'patientNotes';
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { [updateField]: notes },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Notes updated', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;