const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const LoyaltyPoints = require('../models/LoyaltyPoints');
const OnlineSlot = require('../models/OnlineSlot');
const ClinicSlot = require('../models/ClinicSlot');
const { USE_STRIPE_PAYMENTS } = require('../config/paymentConfig');
const { scheduleGoogleMeetGeneration } = require('../services/appointmentScheduler');
const TokenService = require('../services/tokenService');
const mongoose = require('mongoose');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { 
  validateObjectIdParam, 
  isValidObjectId 
} = require('../middleware/validateRequest');
const { verifyClinicAccess, filterByClinic, verifyDoctorAccess } = require('../middleware/clinicIsolation');
const cacheService = require('../services/cacheService');
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
    loyalty.addPoints(points, action, desc, referenceId);
    await loyalty.save();

    console.log(`🎁 Awarded ${points} loyalty points to user ${userId} for ${action}`);
    return { success: true, points, tier: loyalty.tier };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    return { success: false, error: error.message };
  }
};

// Get all appointments (admin only)
router.get('/', verifyTokenWithRole(['admin']), async (req, res) => {
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

// Get appointments by user ID (authenticated users only)
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    // Ensure user can only access their own appointments (unless admin/receptionist)
    // Compare as strings to handle ObjectId vs string comparison
    const tokenUserId = req.user.id?.toString() || req.user._id?.toString();
    const requestedUserId = req.params.userId?.toString();
    
    // Allow admin, receptionist, and the user themselves
    const isAllowed = req.user.role === 'admin' || 
                      req.user.role === 'receptionist' || 
                      req.user.role === 'doctor' ||
                      tokenUserId === requestedUserId;
    
    if (!isAllowed) {
      console.log('Access denied - token userId:', tokenUserId, 'requested userId:', requestedUserId, 'role:', req.user.role);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Build query - for receptionist, filter by their clinic
    const query = { userId: req.params.userId };
    if (req.user.role === 'receptionist' && req.user.clinicId) {
      query.clinicId = req.user.clinicId;
    }
    
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization profilePhoto')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });
    
    console.log(`Found ${appointments.length} appointments for user ${req.params.userId}`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointments by doctor ID (authenticated doctors/admin only)
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    // Ensure doctor can only access their own appointments (unless admin)
    if (req.user.role !== 'admin' && req.user.role !== 'receptionist' && req.user.id !== req.params.doctorId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
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

// Get doctor's patient queue for a specific date (with clinic isolation)
router.get('/doctor/:doctorId/queue', verifyToken, verifyDoctorAccess, async (req, res) => {
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

// Skip patient (move to end of queue) - doctors/receptionists only
router.put('/:id/skip', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
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

// Get appointments by clinic ID (clinic staff/admin only) - with clinic isolation
router.get('/clinic/:clinicId', verifyTokenWithRole(['admin', 'receptionist', 'doctor']), verifyClinicAccess('clinicId'), async (req, res) => {
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

    // Parse date correctly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for exact time conflict
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
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

    // Parse date correctly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).select('time');

    const bookedTimes = appointments.map(apt => apt.time);

    res.json({ bookedTimes });

  } catch (error) {
    console.error('Error fetching booked times:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get queue info for a doctor on a specific date (for queue-based booking)
router.get('/queue-info/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const { consultationType } = req.query; // Optional: 'in_person', 'online', 'virtual'
    
    // Try cache first (10 second TTL - queue info changes frequently)
    const cacheKey = `queue:${doctorId}:${date}:${consultationType || 'all'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Get doctor's consultation settings
    const doctor = await Doctor.findById(doctorId).select('consultationDuration consultationSettings');
    
    // Determine if requesting virtual or in-clinic queue
    const isVirtual = consultationType === 'online' || consultationType === 'virtual';
    
    // Get appropriate slot duration
    const virtualDuration = doctor?.consultationSettings?.virtualSlotDuration || doctor?.consultationDuration || 20;
    const inClinicDuration = doctor?.consultationSettings?.inClinicSlotDuration || doctor?.consultationDuration || 30;
    const slotDuration = isVirtual ? virtualDuration : inClinicDuration;
    
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Build query based on consultation type
    const appointmentQuery = {
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    };
    
    // If consultationType specified, filter by it
    if (consultationType) {
      appointmentQuery.consultationType = isVirtual ? { $in: ['online', 'virtual'] } : 'in_person';
    }
    
    // Get count of appointments for this doctor on this date (filtered by type if specified)
    const appointments = await Appointment.find(appointmentQuery).sort({ queueNumber: 1 });
    
    // Also get counts for both types for display
    const virtualAppointments = await Appointment.countDocuments({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      consultationType: { $in: ['online', 'virtual'] }
    });
    
    const inClinicAppointments = await Appointment.countDocuments({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      consultationType: 'in_person'
    });

    const currentQueueCount = appointments.length;
    
    // Separate max slots for virtual and in-clinic
    const maxVirtualSlots = doctor?.consultationSettings?.maxVirtualSlots || 15;
    const maxInClinicSlots = doctor?.consultationSettings?.maxInClinicSlots || 20;
    const maxSlots = isVirtual ? maxVirtualSlots : maxInClinicSlots;
    
    const nextQueueNumber = currentQueueCount + 1;
    
    // Calculate estimated time for next patient
    // Virtual starts at 8 AM, In-clinic at 9 AM
    const startHour = isVirtual ? 8 : 9;
    let minutesFromStart = currentQueueCount * slotDuration;
    let hours = Math.floor(minutesFromStart / 60);
    let minutes = minutesFromStart % 60;
    let estimatedHour = startHour + hours;
    
    // Skip lunch hour (1 PM - 2 PM) for in-clinic only
    if (!isVirtual && estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    const estimatedTime = estimatedHour < 20 
      ? `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      : null;

    const response = {
      success: true,
      currentQueueCount,
      nextQueueNumber,
      estimatedTime,
      maxSlots,
      availableSlots: Math.max(0, maxSlots - currentQueueCount),
      isFull: currentQueueCount >= maxSlots,
      slotDuration,
      consultationType: consultationType || 'all',
      // Separate counts for UI display
      virtualQueue: {
        count: virtualAppointments,
        maxSlots: maxVirtualSlots,
        available: Math.max(0, maxVirtualSlots - virtualAppointments)
      },
      inClinicQueue: {
        count: inClinicAppointments,
        maxSlots: maxInClinicSlots,
        available: Math.max(0, maxInClinicSlots - inClinicAppointments)
      }
    };
    
    // Cache for 10 seconds
    await cacheService.set(cacheKey, response, 10);
    
    res.json(response);

  } catch (error) {
    console.error('Error fetching queue info:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Smart Queue Status - Real-time with pattern analysis
router.get('/smart-queue/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const { queueNumber } = req.query;
    
    const smartQueueService = require('../services/smartQueueService');
    const result = await smartQueueService.getSmartQueueStatus(
      doctorId, 
      date, 
      queueNumber ? parseInt(queueNumber) : null
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching smart queue status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get user's queue update by appointment ID
router.get('/my-queue/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const smartQueueService = require('../services/smartQueueService');
    const result = await smartQueueService.getUserQueueUpdate(appointmentId);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching user queue update:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create new appointment (with payment calculation) - uses atomic operation to prevent double booking
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { userId, doctorId, clinicId, date, time, reason, consultationType } = req.body;

    // Validate required fields
    if (!userId || !doctorId || !clinicId || !date || !time || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate ObjectIds
    if (!isValidObjectId(userId) || !isValidObjectId(doctorId) || !isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Validate consultation type
    if (consultationType && !['in_person', 'online'].includes(consultationType)) {
      return res.status(400).json({ message: 'Invalid consultation type. Must be "in_person" or "online"' });
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

    // Parse date correctly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }
    
    const startOfDay = new Date(appointmentDate);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Start transaction for atomic double-booking prevention
    session.startTransaction();

    // Atomic check-and-create to prevent race conditions
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).session(session);

    if (existingAppointment) {
      await session.abortTransaction();
      return res.status(409).json({ 
        message: 'This time slot is no longer available. Please choose another time.',
        conflict: true
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
      date: appointmentDate, // Use properly parsed local date
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

    // Save within transaction to ensure atomicity
    await appointment.save({ session });
    
    // Commit transaction - slot is now reserved
    await session.commitTransaction();
    
    // Generate appointment token
    const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
    const tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);
    
    if (tokenResult.success) {
      console.log(`✅ Token generated for appointment ${appointment._id}: ${tokenResult.token}`);
    }
    
    // Generate Meet link IMMEDIATELY for online consultations
    if (appointment.consultationType === 'online') {
      try {
        const { generateMeetingLink } = require('../services/googleMeetService');
        const { sendAppointmentEmail } = require('../services/emailService');
        
        console.log(`🔄 Generating Meet link immediately for appointment ${appointment._id}...`);
        console.log(`📧 Patient email: ${user.email || 'NOT SET'}`);
        console.log(`📧 Doctor email: ${doctor.email || 'NOT SET'}`);
        
        // Generate the meet link (tries Google Meet first, falls back to Jitsi)
        const meetResult = await generateMeetingLink({
          ...appointment.toObject(),
          userId: user,
          doctorId: doctor
        });
        
        if (meetResult.success) {
          appointment.googleMeetLink = meetResult.meetLink;
          appointment.googleEventId = meetResult.eventId || null;
          appointment.meetLinkGenerated = true;
          appointment.meetLinkGeneratedAt = new Date();
          appointment.meetingLink = meetResult.meetLink;
          appointment.meetingProvider = meetResult.provider || 'google-meet';
          
          // Store separate doctor and patient links (for Jitsi)
          if (meetResult.doctorLink) {
            appointment.doctorMeetLink = meetResult.doctorLink;
          }
          if (meetResult.patientLink) {
            appointment.patientMeetLink = meetResult.patientLink;
          }
          
          await appointment.save();
          
          console.log(`✅ Meet link generated: ${meetResult.meetLink} (Provider: ${meetResult.provider})`);
          console.log(`📧 Doctor email: ${doctor.email || 'NOT SET'}`);
          console.log(`📧 Patient email: ${user.email || 'NOT SET'}`);
          
          // Send email to patient immediately
          try {
            const populatedForEmail = await Appointment.findById(appointment._id)
              .populate('userId', 'name email phone')
              .populate('doctorId', 'name email specialization')
              .populate('clinicId', 'name address');
            
            await sendAppointmentEmail(populatedForEmail, 'patient');
            appointment.meetLinkSentToPatient = true;
            console.log(`✅ Email sent to patient: ${user.email}`);
            
            // Send SMS to patient if they have a phone number
            if (user.phone) {
              try {
                const { sendAppointmentConfirmationSMS } = require('../services/smsService');
                await sendAppointmentConfirmationSMS(appointment, user, doctor);
                console.log(`✅ SMS sent to patient: ${user.phone}`);
              } catch (smsError) {
                console.error(`❌ Failed to send SMS to patient:`, smsError.message);
              }
            }
            
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
    // Abort transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
});

// Queue-based booking (no time selection - auto-assigns queue position)
router.post('/queue-booking', async (req, res) => {
  try {
    const { userId, doctorId, clinicId, date, reason, consultationType, urgencyLevel, reminderPreference, sendEstimatedTimeEmail } = req.body;

    console.log('📋 Queue booking request:', { userId, doctorId, clinicId, date, consultationType });

    // Validate required fields (reason is now optional)
    if (!userId || !doctorId || !date) {
      console.error('❌ Missing required fields:', { userId: !!userId, doctorId: !!doctorId, date: !!date });
      return res.status(400).json({ message: 'User, doctor and date are required' });
    }

    // Validate date format
    if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.error('❌ Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }
    
    // Default reason if not provided
    const appointmentReason = reason || 'General Consultation';

    // Check if doctor exists - populate clinicId to get clinic details
    const doctor = await Doctor.findById(doctorId).populate('clinicId');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Resolve clinicId - use provided clinicId or doctor's clinicId
    const resolvedClinicId = clinicId || (doctor.clinicId?._id || doctor.clinicId);
    if (!resolvedClinicId) {
      console.error('❌ Queue booking failed: No clinicId for doctor', doctorId);
      return res.status(400).json({ message: 'Unable to book appointment. Doctor clinic information is missing.' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse date correctly to avoid timezone issues
    // Date comes as YYYY-MM-DD string, parse it as local date
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Get current queue count for this doctor on this date
    // IMPORTANT: Separate queues for virtual and in-clinic appointments
    const startOfDay = new Date(appointmentDate);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Determine consultation type (default to in_person)
    const appointmentConsultationType = consultationType || 'in_person';
    const isVirtual = appointmentConsultationType === 'online' || appointmentConsultationType === 'virtual';
    
    // Get appointments ONLY for the same consultation type (virtual or in-clinic)
    const existingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
      consultationType: isVirtual ? { $in: ['online', 'virtual'] } : 'in_person'
    }).sort({ queueNumber: -1 });

    const currentQueueCount = existingAppointments.length;
    
    // Separate max slots for virtual and in-clinic
    const maxVirtualSlots = doctor.consultationSettings?.maxVirtualSlots || 15;
    const maxInClinicSlots = doctor.consultationSettings?.maxInClinicSlots || 20;
    const maxSlots = isVirtual ? maxVirtualSlots : maxInClinicSlots;

    if (currentQueueCount >= maxSlots) {
      return res.status(400).json({ 
        message: `No ${isVirtual ? 'virtual consultation' : 'in-clinic'} slots available for this date. Please select another date.`,
        isFull: true,
        consultationType: appointmentConsultationType
      });
    }

    // Calculate queue number for THIS consultation type only
    const queueNumber = currentQueueCount + 1;
    
    // Get doctor's consultation duration (default 30 min)
    // Can have different durations for virtual vs in-clinic
    const virtualDuration = doctor.consultationSettings?.virtualSlotDuration || doctor.consultationDuration || 20;
    const inClinicDuration = doctor.consultationSettings?.inClinicSlotDuration || doctor.consultationDuration || 30;
    const slotDuration = isVirtual ? virtualDuration : inClinicDuration;
    
    // Different start times for virtual and in-clinic
    // Virtual: Can start earlier (8 AM), In-clinic: 9 AM
    const startHour = isVirtual ? 8 : 9;
    let minutesFromStart = (queueNumber - 1) * slotDuration;
    let hours = Math.floor(minutesFromStart / 60);
    let minutes = minutesFromStart % 60;
    let estimatedHour = startHour + hours;
    
    // Skip lunch hour (1 PM - 2 PM) for in-clinic only
    if (!isVirtual && estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    const estimatedTime = `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Calculate payment breakdown
    const consultationFee = doctor.consultationFee || 500;
    const gst = Math.round(consultationFee * 0.22);
    const platformFee = Math.round(consultationFee * 0.07);
    const totalAmount = consultationFee + gst + platformFee;

    // Get payment status from request (for Razorpay integration)
    const requestedPaymentStatus = req.body.paymentStatus || 'not_required';
    const requestedStatus = req.body.status || 'confirmed';
    
    const appointmentData = {
      userId,
      doctorId,
      clinicId: resolvedClinicId, // Use resolved clinicId
      date: appointmentDate, // Use properly parsed local date
      time: estimatedTime,
      tokenNumber: queueNumber, // Set tokenNumber same as queueNumber
      queueNumber,
      estimatedArrivalTime: estimatedTime,
      reason: appointmentReason,
      consultationType: consultationType || 'in_person',
      urgencyLevel: urgencyLevel || 'normal',
      reminderPreference: reminderPreference || 'email',
      status: requestedStatus, // Use requested status (pending_payment or confirmed)
      paymentStatus: requestedPaymentStatus, // Use requested payment status
      payment: {
        consultationFee,
        gst,
        platformFee,
        totalAmount,
        paymentStatus: requestedPaymentStatus
      }
    };

    console.log('📝 Creating appointment with data:', JSON.stringify(appointmentData, null, 2));

    const appointment = new Appointment(appointmentData);

    // Generate join code for online consultations
    if (appointment.consultationType === 'online') {
      appointment.generateJoinCode();
    }

    try {
      await appointment.save();
    } catch (saveError) {
      console.error('❌ Appointment save error:', saveError.message);
      if (saveError.name === 'ValidationError') {
        const errors = Object.keys(saveError.errors).map(key => `${key}: ${saveError.errors[key].message}`);
        return res.status(400).json({ message: 'Validation error', errors });
      }
      throw saveError;
    }
    console.log(`✅ Appointment saved: ${appointment._id}`);
    
    // Generate appointment token
    let tokenResult = { success: false, token: null };
    try {
      const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
      const TokenService = require('../services/tokenService');
      tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);
      console.log(`✅ Token generated: ${tokenResult.token}`);
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError.message);
    }

    // Send notifications based on reminder preference - only if not pending payment
    if (requestedStatus !== 'pending_payment') {
      const userReminderPref = reminderPreference || 'email';
      
      // Send email if preference is 'email' or 'both'
      if ((userReminderPref === 'email' || userReminderPref === 'both') && user.email && sendEstimatedTimeEmail) {
        try {
          const { sendQueueBookingEmail } = require('../services/emailService');
          await sendQueueBookingEmail({
            patientName: user.name,
            patientEmail: user.email,
            doctorName: doctor.name,
            specialization: doctor.specialization,
            clinicName: doctor.clinicId?.name || 'HealthSync Clinic',
            date: appointmentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            queueNumber,
            estimatedTime: formatTimeForEmail(estimatedTime),
            consultationType: consultationType || 'in_person',
            tokenNumber: tokenResult?.token || `Q${queueNumber}`
          });
          console.log(`✅ Queue booking email sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Error sending queue booking email:', emailError.message);
        }
      }
      
      // Send SMS if preference is 'sms' or 'both'
      if ((userReminderPref === 'sms' || userReminderPref === 'both') && user.phone) {
        try {
          const { sendAppointmentConfirmationSMS } = require('../services/smsService');
          await sendAppointmentConfirmationSMS(
            { ...appointment.toObject(), time: estimatedTime },
            user,
            doctor
          );
          console.log(`✅ Queue booking SMS sent to ${user.phone}`);
        } catch (smsError) {
          console.error('❌ Error sending queue booking SMS:', smsError.message);
        }
      }
    }

    // Award loyalty points
    const loyaltyResult = await awardLoyaltyPoints(
      userId, 
      'appointment', 
      appointment._id,
      null,
      `Booked appointment with Dr. ${doctor.name}`
    );

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee email')
      .populate('clinicId', 'name address');

    console.log(`✅ Queue booking completed successfully for appointment ${appointment._id}`);

    res.status(201).json({
      success: true,
      ...populatedAppointment.toObject(),
      queueNumber,
      estimatedTime,
      token: tokenResult?.token || `Q${queueNumber}`,
      loyaltyPoints: loyaltyResult?.success ? {
        earned: loyaltyResult.points,
        tier: loyaltyResult.tier
      } : null
    });

  } catch (error) {
    console.error('❌ Error creating queue booking:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// SLOT-BASED BOOKING (Strict Online/Clinic Separation)
// ============================================
router.post('/slot-booking', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { userId, doctorId, clinicId, slotId, slotType, date, time, reason, consultationType } = req.body;

    console.log('📋 Slot-based booking request:', { userId, doctorId, slotId, slotType, consultationType });

    // Strict validation
    if (!userId || !doctorId || !slotId || !slotType || !date || !time) {
      throw new Error('Missing required fields: userId, doctorId, slotId, slotType, date, time');
    }

    // Validate slot type matches consultation type
    if (slotType === 'online' && consultationType !== 'online') {
      throw new Error('VALIDATION_ERROR: Cannot book online slot for in-person appointment');
    }
    if (slotType === 'clinic' && consultationType === 'online') {
      throw new Error('VALIDATION_ERROR: Cannot book clinic slot for online appointment');
    }

    // Get doctor
    const doctor = await Doctor.findById(doctorId).populate('clinicId');
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify and book the slot atomically from the CORRECT collection
    let slot;
    if (slotType === 'online') {
      slot = await OnlineSlot.findOneAndUpdate(
        {
          _id: slotId,
          isBooked: false,
          isBlocked: false,
          slotType: 'online' // Double-check slot type
        },
        {
          $set: {
            isBooked: true,
            bookedBy: userId,
            bookedAt: new Date()
          }
        },
        { new: true, session }
      );
      
      if (!slot) {
        throw new Error('Online slot is no longer available or invalid');
      }
    } else if (slotType === 'clinic') {
      slot = await ClinicSlot.findOneAndUpdate(
        {
          _id: slotId,
          isBooked: false,
          isBlocked: false,
          slotType: 'clinic' // Double-check slot type
        },
        {
          $set: {
            isBooked: true,
            bookedBy: userId,
            bookedAt: new Date()
          }
        },
        { new: true, session }
      );
      
      if (!slot) {
        throw new Error('Clinic slot is no longer available or invalid');
      }
    } else {
      throw new Error('Invalid slot type. Must be "online" or "clinic"');
    }

    // Parse date
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    appointmentDate.setHours(0, 0, 0, 0);

    // Resolve clinic ID
    const resolvedClinicId = clinicId || doctor.clinicId?._id || doctor.clinicId;

    // Calculate payment
    const consultationFee = doctor.consultationFee || 500;
    const gst = Math.round(consultationFee * 0.22);
    const platformFee = Math.round(consultationFee * 0.07);
    const totalAmount = consultationFee + gst + platformFee;

    // Create appointment with slot reference
    const appointmentData = {
      userId,
      doctorId,
      clinicId: resolvedClinicId,
      date: appointmentDate,
      time: time,
      reason: reason || 'General Consultation',
      consultationType: consultationType,
      // Store slot reference for validation
      slotId: slotId,
      slotType: slotType,
      status: 'confirmed',
      paymentStatus: 'not_required',
      payment: {
        consultationFee,
        gst,
        platformFee,
        totalAmount,
        paymentStatus: 'not_required'
      }
    };

    const appointment = new Appointment(appointmentData);

    // Generate join code for online consultations
    if (consultationType === 'online') {
      appointment.generateJoinCode();
    }

    await appointment.save({ session });

    // Update slot with appointment reference
    if (slotType === 'online') {
      await OnlineSlot.findByIdAndUpdate(slotId, { appointmentId: appointment._id }, { session });
    } else {
      await ClinicSlot.findByIdAndUpdate(slotId, { appointmentId: appointment._id }, { session });
    }

    // Generate token
    let tokenResult = { success: false, token: null };
    try {
      const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
      tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);
    } catch (tokenError) {
      console.error('Token generation failed:', tokenError.message);
    }

    await session.commitTransaction();

    // Populate and return
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee email')
      .populate('clinicId', 'name address');

    console.log(`✅ Slot-based booking completed: ${appointment._id} (${slotType})`);

    res.status(201).json({
      success: true,
      ...populatedAppointment.toObject(),
      slotType,
      slotId,
      token: tokenResult?.token || `SB${appointment._id.toString().slice(-6).toUpperCase()}`
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Slot-based booking error:', error);
    
    // Return specific error for validation failures
    if (error.message.startsWith('VALIDATION_ERROR:')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message.replace('VALIDATION_ERROR: ', ''),
        validationError: true
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Booking failed'
    });
  } finally {
    session.endSession();
  }
});

// Walk-in/Offline booking - For receptionists to add patients at clinic
// Note: Clinic isolation is handled manually to support independent doctors
router.post('/walk-in', verifyTokenWithRole(['receptionist', 'doctor', 'admin']), async (req, res) => {
  try {
    const { 
      doctorId, 
      clinicId, 
      date, 
      reason,
      // Walk-in patient details (no app account needed)
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      // Optional - if patient has account
      userId,
      // Who is adding this booking
      addedBy,
      consultationType
    } = req.body;

    // Validate required fields
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor and date are required' });
    }

    // Either userId or walk-in patient details required
    if (!userId && !patientName) {
      return res.status(400).json({ message: 'Either user ID or patient name is required' });
    }

    // Manual clinic access check - allow independent doctors (no clinic)
    const userRole = req.user?.role;
    const userClinicId = req.user?.clinicId;
    
    if (userRole !== 'admin') {
      // For doctors, verify they're adding to their own queue
      if (userRole === 'doctor' && req.user.id !== doctorId) {
        return res.status(403).json({ message: 'Doctors can only add patients to their own queue' });
      }
      
      // For receptionists, verify clinic match (if clinic exists)
      if (userRole === 'receptionist' && clinicId && userClinicId) {
        if (userClinicId.toString() !== clinicId.toString()) {
          return res.status(403).json({ message: 'Access denied - you can only add patients to your clinic' });
        }
      }
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Parse date correctly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(appointmentDate);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get current queue count for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).sort({ queueNumber: -1 });

    const currentQueueCount = existingAppointments.length;
    const slotDuration = doctor.consultationDuration || 30;
    const totalMinutes = 9 * 60;
    const maxSlots = Math.floor(totalMinutes / slotDuration);

    if (currentQueueCount >= maxSlots) {
      return res.status(400).json({ 
        message: 'No slots available for this date.',
        isFull: true
      });
    }

    // Calculate queue number and estimated time
    const queueNumber = currentQueueCount + 1;
    
    const startHour = 9;
    let minutesFromStart = (queueNumber - 1) * slotDuration;
    let hours = Math.floor(minutesFromStart / 60);
    let minutes = minutesFromStart % 60;
    let estimatedHour = startHour + hours;
    
    if (estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    const estimatedTime = `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const appointmentData = {
      doctorId,
      clinicId: clinicId || doctor.clinicId,
      date: appointmentDate, // Use properly parsed local date
      time: estimatedTime,
      queueNumber,
      estimatedArrivalTime: estimatedTime,
      reason: reason || 'Walk-in Consultation',
      consultationType: consultationType || 'in_person',
      status: 'confirmed',
      paymentStatus: 'not_required',
      bookingSource: 'offline',
      isWalkIn: !userId,
      addedBy: addedBy || null
    };

    // If user has account, link it
    if (userId) {
      appointmentData.userId = userId;
    } else {
      // Store walk-in patient details
      appointmentData.walkInPatient = {
        name: patientName,
        phone: patientPhone,
        age: patientAge,
        gender: patientGender
      };
      // Use a placeholder user ID (you might want to create a "walk-in" user)
      appointmentData.userId = addedBy || doctorId; // Temporary - links to who added it
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // Generate token
    const doctorCode = doctor.specialization?.substring(0, 5).toUpperCase() || 'GEN';
    const TokenService = require('../services/tokenService');
    const tokenResult = await TokenService.generateTokenForAppointment(appointment._id, doctorCode);

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address');

    res.status(201).json({
      success: true,
      message: 'Walk-in patient added to queue',
      ...populatedAppointment.toObject(),
      queueNumber,
      estimatedTime,
      token: tokenResult.token,
      bookingSource: 'offline'
    });

  } catch (error) {
    console.error('Error creating walk-in booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get today's queue for a doctor (unified - both online and offline) - with clinic isolation
router.get('/doctor/:doctorId/today-queue', verifyToken, verifyDoctorAccess, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    })
    .populate('userId', 'name email phone profilePhoto')
    .sort({ queueNumber: 1 });

    // Format response with source indicator
    const queue = appointments.map(apt => ({
      _id: apt._id,
      queueNumber: apt.queueNumber,
      estimatedTime: apt.estimatedArrivalTime,
      status: apt.status,
      consultationType: apt.consultationType,
      reason: apt.reason,
      bookingSource: apt.bookingSource || 'online',
      isWalkIn: apt.isWalkIn,
      patient: apt.isWalkIn ? {
        name: apt.walkInPatient?.name,
        phone: apt.walkInPatient?.phone,
        age: apt.walkInPatient?.age,
        gender: apt.walkInPatient?.gender,
        isWalkIn: true
      } : {
        _id: apt.userId?._id,
        name: apt.userId?.name,
        email: apt.userId?.email,
        phone: apt.userId?.phone,
        profilePhoto: apt.userId?.profilePhoto,
        isWalkIn: false
      }
    }));

    // Stats
    const onlineCount = appointments.filter(a => a.bookingSource === 'online' || !a.bookingSource).length;
    const offlineCount = appointments.filter(a => a.bookingSource === 'offline').length;

    res.json({
      success: true,
      queue,
      stats: {
        total: appointments.length,
        online: onlineCount,
        offline: offlineCount,
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        inProgress: appointments.filter(a => a.status === 'in_progress').length
      }
    });

  } catch (error) {
    console.error('Error fetching today queue:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to format time for email
function formatTimeForEmail(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Update appointment status (doctors/receptionists/admin only)
router.put('/:id/status', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Build update object with consultation timing
    const updateData = { status };
    
    // Record consultation start time when status changes to in_progress
    if (status === 'in_progress') {
      updateData.consultationStartTime = new Date();
      updateData.consultationStatus = 'in_progress';
    }
    
    // Record consultation end time when status changes to completed
    if (status === 'completed') {
      updateData.consultationEndTime = new Date();
      updateData.consultationStatus = 'completed';
    }
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Calculate and log consultation duration if completed
    if (status === 'completed' && appointment.consultationStartTime) {
      const durationMinutes = Math.round(
        (new Date() - new Date(appointment.consultationStartTime)) / 60000
      );
      console.log(`📊 Consultation completed: ${durationMinutes} minutes (Dr. ${appointment.doctorId?.name})`);
      
      // Update duration in appointment
      await Appointment.findByIdAndUpdate(req.params.id, {
        consultationDuration: durationMinutes * 60 // Store in seconds
      });
    }

    // Add earnings to doctor's wallet when appointment is completed
    if (status === 'completed' && appointment.doctorId) {
      try {
        const DoctorWallet = require('../models/DoctorWallet');
        const wallet = await DoctorWallet.getOrCreateWallet(appointment.doctorId._id);
        
        // Get consultation fee from appointment or doctor
        const consultationFee = appointment.payment?.consultationFee || 
                               appointment.doctorId.consultationFee || 
                               500;
        
        const patientName = appointment.userId?.name || 'Patient';
        const { doctorEarning, commission } = wallet.addEarning(
          consultationFee,
          appointment._id,
          patientName,
          `Consultation with ${patientName} - ${appointment.consultationType === 'online' ? 'Online' : 'In-Clinic'}`
        );
        
        // Update consultation type stats
        if (appointment.consultationType === 'online') {
          wallet.stats.onlineConsultations += 1;
        } else {
          wallet.stats.inClinicVisits += 1;
        }
        
        await wallet.save();
        
        console.log(`💰 Wallet updated for Dr. ${appointment.doctorId.name}:`);
        console.log(`   Consultation Fee: ₹${consultationFee}`);
        console.log(`   Doctor Earning: ₹${doctorEarning}`);
        console.log(`   Platform Commission: ₹${commission}`);
        console.log(`   New Balance: ₹${wallet.balance}`);
      } catch (walletError) {
        console.error('Error updating doctor wallet:', walletError.message);
        // Don't fail the request if wallet update fails
      }

      // 🔔 AUTOMATIC SMART NOTIFICATION: Notify patients who are 2 positions away
      try {
        const { processQueueNotifications } = require('../services/queueNotificationService');
        const notificationResults = await processQueueNotifications(appointment.doctorId._id, 2);
        console.log(`🔔 Auto-notification triggered after completing patient:`);
        notificationResults.forEach(r => {
          if (r.notified) {
            console.log(`   ✅ Notified patient at position ${r.position}`);
          }
        });
      } catch (notifyError) {
        console.error('Error sending auto-notifications:', notifyError.message);
      }
    }

    // 🔔 Also notify when starting a new patient (in_progress)
    if (status === 'in_progress' && appointment.doctorId) {
      try {
        const { processQueueNotifications } = require('../services/queueNotificationService');
        const notificationResults = await processQueueNotifications(appointment.doctorId._id, 2);
        console.log(`🔔 Auto-notification triggered after calling next patient:`);
        notificationResults.forEach(r => {
          if (r.notified) {
            console.log(`   ✅ Notified patient at position ${r.position}`);
          }
        });
      } catch (notifyError) {
        console.error('Error sending auto-notifications:', notifyError.message);
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment (authenticated users only)
router.put('/:id', verifyToken, async (req, res) => {
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

// Cancel appointment with reason and notification (authenticated users only)
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason, cancelledBy, notifyPatient = true, notifyDoctor = true, processRefund = true } = req.body;
    
    const appointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if appointment can be cancelled
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel an appointment that is already ${appointment.status}` 
      });
    }
    
    // Process refund based on policy
    let refundResult = null;
    if (processRefund && appointment.paymentStatus === 'completed') {
      try {
        const refundPolicyService = require('../services/refundPolicyService');
        refundResult = await refundPolicyService.processRefund(
          appointment._id,
          cancelledBy || 'patient',
          reason || 'Appointment cancelled'
        );
        console.log(`💰 Refund processed: ${JSON.stringify(refundResult.refundCalculation)}`);
      } catch (refundError) {
        console.error('❌ Refund processing error:', refundError.message);
        // Continue with cancellation even if refund fails
      }
    }
    
    // Update appointment with cancellation details
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'No reason provided';
    appointment.cancelledBy = cancelledBy || 'patient';
    appointment.cancelledAt = new Date();
    
    await appointment.save();
    
    // Send cancellation notifications
    const notifications = [];
    
    if (notifyPatient && appointment.userId?.email) {
      try {
        const { sendCancellationEmail } = require('../services/emailService');
        await sendCancellationEmail({
          recipientEmail: appointment.userId.email,
          recipientName: appointment.userId.name,
          recipientType: 'patient',
          doctorName: appointment.doctorId?.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          reason: appointment.cancellationReason,
          cancelledBy: appointment.cancelledBy,
          refundAmount: refundResult?.refundCalculation?.refundAmount,
          walletCredit: refundResult?.refundCalculation?.walletCredit
        });
        notifications.push({ type: 'patient', sent: true });
        console.log(`📧 Cancellation email sent to patient: ${appointment.userId.email}`);
      } catch (emailError) {
        console.error('Error sending patient cancellation email:', emailError.message);
        notifications.push({ type: 'patient', sent: false, error: emailError.message });
      }
    }
    
    if (notifyDoctor && appointment.doctorId?.email) {
      try {
        const { sendCancellationEmail } = require('../services/emailService');
        await sendCancellationEmail({
          recipientEmail: appointment.doctorId.email,
          recipientName: appointment.doctorId.name,
          recipientType: 'doctor',
          patientName: appointment.userId?.name || 'Patient',
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          reason: appointment.cancellationReason,
          cancelledBy: appointment.cancelledBy
        });
        notifications.push({ type: 'doctor', sent: true });
        console.log(`📧 Cancellation email sent to doctor: ${appointment.doctorId.email}`);
      } catch (emailError) {
        console.error('Error sending doctor cancellation email:', emailError.message);
        notifications.push({ type: 'doctor', sent: false, error: emailError.message });
      }
    }
    
    // Log cancellation
    console.log(`❌ Appointment ${appointment._id} cancelled:`);
    console.log(`   Reason: ${appointment.cancellationReason}`);
    console.log(`   Cancelled by: ${appointment.cancelledBy}`);
    
    // Audit log
    try {
      const auditService = require('../services/auditService');
      await auditService.appointmentCancelled(appointment, req.user, reason, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
      notifications,
      refund: refundResult ? {
        processed: refundResult.refundProcessed,
        amount: refundResult.refundCalculation?.refundAmount,
        percentage: refundResult.refundCalculation?.refundPercentage,
        policy: refundResult.refundCalculation?.policyApplied,
        walletCredit: refundResult.refundCalculation?.walletCredit,
        walletCreditProcessed: refundResult.walletCreditProcessed
      } : null
    });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete appointment (admin only)
router.delete('/:id', verifyTokenWithRole(['admin']), async (req, res) => {
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

    // Generate Meet link (tries Google Meet first, falls back to Jitsi)
    const { generateMeetingLink } = require('../services/googleMeetService');
    const { sendAppointmentEmail } = require('../services/emailService');
    
    console.log(`🔄 Generating Meet link for appointment ${appointment._id}...`);
    console.log(`📧 Patient email: ${appointment.userId?.email || 'NOT SET'}`);
    console.log(`📧 Doctor email: ${appointment.doctorId?.email || 'NOT SET'}`);
    
    const meetResult = await generateMeetingLink(appointment);
    
    if (meetResult.success) {
      appointment.googleMeetLink = meetResult.meetLink;
      appointment.googleEventId = meetResult.eventId || null;
      appointment.meetLinkGenerated = true;
      appointment.meetLinkGeneratedAt = new Date();
      appointment.meetingLink = meetResult.meetLink;
      appointment.meetingProvider = meetResult.provider || 'google-meet';
      
      // Store separate doctor and patient links (for Jitsi)
      if (meetResult.doctorLink) {
        appointment.doctorMeetLink = meetResult.doctorLink;
      }
      if (meetResult.patientLink) {
        appointment.patientMeetLink = meetResult.patientLink;
      }
      
      await appointment.save();
      
      console.log(`✅ Meet link generated: ${meetResult.meetLink} (Provider: ${meetResult.provider})`);
      
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
        doctorMeetLink: appointment.doctorMeetLink,
        patientMeetLink: appointment.patientMeetLink,
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

    // Audit log
    try {
      const auditService = require('../services/auditService');
      await auditService.appointmentRescheduled(appointment, { date: oldDate, time: oldTime }, req.user || { name: 'System', role: 'system' }, reason, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }

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

// Reschedule appointment
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;
    
    if (!newDate || !newTime) {
      return res.status(400).json({ message: 'New date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Store old date/time for reference
    const oldDate = appointment.date;
    const oldTime = appointment.time;

    // Update appointment
    appointment.date = new Date(newDate);
    appointment.time = newTime;
    appointment.rescheduledFrom = { date: oldDate, time: oldTime, reason: reason || 'Rescheduled by user' };
    appointment.rescheduledAt = new Date();
    
    await appointment.save();

    // Audit log
    try {
      const auditService = require('../services/auditService');
      await auditService.appointmentRescheduled(appointment, { date: oldDate, time: oldTime }, req.user || { name: 'System', role: 'system' }, reason, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }

    const updatedAppointment = await Appointment.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address');

    res.json({ 
      message: 'Appointment rescheduled successfully', 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Failed to reschedule appointment', error: error.message });
  }
});

// ============ QUEUE NOTIFICATION ENDPOINTS ============
const queueNotificationService = require('../services/queueNotificationService');

// Get queue position and estimated time for an appointment
router.get('/:id/queue-position', async (req, res) => {
  try {
    const queueInfo = await queueNotificationService.getQueuePosition(req.params.id);
    if (!queueInfo) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not scheduled for today' });
    }
    res.json({ success: true, ...queueInfo });
  } catch (error) {
    console.error('Error getting queue position:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue position' });
  }
});

// Get full queue with estimated times for a doctor
router.get('/doctor/:doctorId/queue-estimates', async (req, res) => {
  try {
    const queue = await queueNotificationService.getQueueWithEstimates(req.params.doctorId);
    res.json({ success: true, queue });
  } catch (error) {
    console.error('Error getting queue estimates:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue estimates' });
  }
});

// Manually trigger queue notification check for a doctor
router.post('/doctor/:doctorId/notify-queue', async (req, res) => {
  try {
    const { notifyAtPosition = 3 } = req.body;
    const results = await queueNotificationService.processQueueNotifications(req.params.doctorId, notifyAtPosition);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error processing queue notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to process notifications' });
  }
});

// Send notification to specific patient
router.post('/:id/notify-patient', async (req, res) => {
  try {
    const result = await queueNotificationService.checkAndNotifyPatient(req.params.id, 10); // Force notify
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error notifying patient:', error);
    res.status(500).json({ success: false, message: 'Failed to notify patient' });
  }
});

// ============================================
// ADMIN ROUTES - Appointment Management
// ============================================

// Admin: Get all appointments for a specific user
router.get('/admin/user/:userId/all', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const appointments = await Appointment.find({ userId })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });
    
    const user = await User.findById(userId).select('name email phone');
    
    res.json({
      success: true,
      user,
      totalAppointments: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin: Delete all appointments for a user
router.delete('/admin/user/:userId/all', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Get user info first
    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Count appointments before deletion
    const appointmentCount = await Appointment.countDocuments({ userId });
    
    if (appointmentCount === 0) {
      return res.json({ 
        success: true, 
        message: 'No appointments found for this user',
        deletedCount: 0 
      });
    }
    
    // Delete all appointments for this user
    const result = await Appointment.deleteMany({ userId });
    
    console.log(`🗑️ Admin deleted ${result.deletedCount} appointments for user ${user.name} (${user.email})`);
    console.log(`   Reason: ${reason || 'Not specified'}`);
    
    // Log this action for security
    try {
      const aiSecurityService = require('../services/aiSecurityService');
      await aiSecurityService.createAlert({
        userId,
        userType: 'User',
        userName: user.name,
        userEmail: user.email,
        activityType: 'account_manipulation',
        severity: 'medium',
        confidenceScore: 100,
        description: `Admin deleted all appointments (${result.deletedCount} records)`,
        details: { 
          action: 'bulk_appointment_delete',
          deletedCount: result.deletedCount,
          reason: reason || 'Not specified'
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} appointments for ${user.name}`,
      deletedCount: result.deletedCount,
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Error deleting user appointments:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin: Delete specific appointments by IDs
router.delete('/admin/bulk-delete', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { appointmentIds, reason } = req.body;
    
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Appointment IDs array is required' });
    }
    
    // Get appointments info before deletion
    const appointments = await Appointment.find({ _id: { $in: appointmentIds } })
      .populate('userId', 'name email')
      .populate('doctorId', 'name');
    
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: 'No appointments found with provided IDs' });
    }
    
    // Delete the appointments
    const result = await Appointment.deleteMany({ _id: { $in: appointmentIds } });
    
    console.log(`🗑️ Admin bulk deleted ${result.deletedCount} appointments`);
    console.log(`   Reason: ${reason || 'Not specified'}`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} appointments`,
      deletedCount: result.deletedCount,
      deletedAppointments: appointments.map(a => ({
        id: a._id,
        user: a.userId?.name,
        doctor: a.doctorId?.name,
        date: a.date,
        status: a.status
      }))
    });
  } catch (error) {
    console.error('Error bulk deleting appointments:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin: Get appointment statistics
router.get('/admin/stats', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      onlineAppointments,
      inPersonAppointments
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: { $gte: today } }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ consultationType: 'online' }),
      Appointment.countDocuments({ consultationType: 'in_person' })
    ]);
    
    // Revenue stats
    const revenueStats = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { 
        _id: null, 
        totalRevenue: { $sum: '$payment.totalAmount' },
        avgRevenue: { $avg: '$payment.totalAmount' },
        count: { $sum: 1 }
      }}
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalAppointments,
        today: todayAppointments,
        pending: pendingAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        online: onlineAppointments,
        inPerson: inPersonAppointments,
        revenue: revenueStats[0] || { totalRevenue: 0, avgRevenue: 0, count: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get single appointment by ID (MUST be at the end to avoid route conflicts)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findById(id)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;