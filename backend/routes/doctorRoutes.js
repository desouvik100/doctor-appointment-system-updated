const express = require('express');
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const { sendNewDoctorRegistrationAlert } = require('../services/adminEmailService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { verifyClinicAccess, verifyDoctorAccess } = require('../middleware/clinicIsolation');
const cacheService = require('../services/cacheService');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         specialization:
 *           type: string
 *         qualification:
 *           type: string
 *         experience:
 *           type: number
 *         consultationFee:
 *           type: number
 *         rating:
 *           type: number
 *         availability:
 *           type: string
 *           enum: [Available, Busy, On Leave]
 *         profilePhoto:
 *           type: string
 *         clinicId:
 *           type: string
 *         isActive:
 *           type: boolean
 */

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

/**
 * @swagger
 * /doctors/summary:
 *   get:
 *     summary: Get doctors statistics
 *     description: Returns summary statistics about doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Doctor statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDoctors:
 *                   type: number
 *                 availableDoctors:
 *                   type: number
 *                 bySpecialization:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       specialization:
 *                         type: string
 *                       count:
 *                         type: number
 */
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

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors with filters
 *     description: Retrieves a list of doctors with optional filtering and sorting
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: minFee
 *         schema:
 *           type: number
 *         description: Minimum consultation fee
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum consultation fee
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [Available, Busy, On Leave]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 */
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

    // Create cache key from query params
    const cacheKey = `doctors:list:${JSON.stringify(req.query)}`;
    
    // Try to get from cache first (30 second TTL for doctor list)
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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
    
    // Cache the result for 30 seconds
    await cacheService.set(cacheKey, doctors, 30);
    
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

// Get online status of multiple doctors (MUST be before /:id route)
router.get('/online-status', async (req, res) => {
  try {
    const { doctorIds } = req.query;
    
    // If no doctorIds provided, return empty status
    if (!doctorIds || doctorIds.trim() === '') {
      return res.json({ success: true, status: {} });
    }
    
    // Consider doctor offline if no heartbeat in last 2 minutes
    const offlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
    
    let query = { isActive: true };
    const ids = doctorIds.split(',').filter(id => {
      // Validate ObjectId format
      return id && /^[0-9a-fA-F]{24}$/.test(id.trim());
    });
    
    if (ids.length === 0) {
      return res.json({ success: true, status: {} });
    }
    
    query._id = { $in: ids };
    
    const doctors = await Doctor.find(query)
      .select('_id name isOnline lastActiveAt')
      .lean();
    
    // Check if doctor is truly online (had heartbeat within threshold)
    const statusMap = {};
    doctors.forEach(doc => {
      const isReallyOnline = doc.isOnline && doc.lastActiveAt && new Date(doc.lastActiveAt) > offlineThreshold;
      statusMap[doc._id] = {
        isOnline: isReallyOnline,
        lastActiveAt: doc.lastActiveAt
      };
    });
    
    res.json({ success: true, status: statusMap });
  } catch (error) {
    console.error('Error fetching online status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
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
      approvalStatus: 'pending', // New doctors need admin approval
      // Terms and conditions acceptance
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date()
    });

    await doctor.save();
    
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('clinicId', 'name address city phone');
    
    console.log('✅ Doctor created with pending status:', doctor.name);
    
    // Send email notification to admin about new doctor registration
    sendNewDoctorRegistrationAlert({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      clinicName: populatedDoctor.clinicId?.name || clinicName,
      consultationFee: doctor.consultationFee,
      location: populatedDoctor.clinicId?.city || 'N/A'
    }).catch(err => console.error('Failed to send doctor registration alert:', err));
    
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

    // Audit log
    try {
      const auditService = require('../services/auditService');
      await auditService.doctorApproved(doctor, req.user || { name: 'Admin', role: 'admin' }, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }

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

    // Audit log
    try {
      const auditService = require('../services/auditService');
      await auditService.doctorRejected(doctor, req.user || { name: 'Admin', role: 'admin' }, reason, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }

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

// ============ AVAILABILITY CALENDAR ENDPOINTS ============

// Get doctor's weekly schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('name weeklySchedule specialDates consultationSettings consultationFee');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, schedule: doctor });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
});

// Update doctor's weekly schedule
router.put('/:id/schedule', async (req, res) => {
  try {
    const { weeklySchedule, consultationSettings, consultationDuration } = req.body;
    
    const updateData = {};
    if (weeklySchedule) updateData.weeklySchedule = weeklySchedule;
    if (consultationSettings) updateData.consultationSettings = consultationSettings;
    if (consultationDuration) updateData.consultationDuration = consultationDuration;
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('name weeklySchedule consultationSettings consultationDuration');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, message: 'Schedule updated successfully', doctor });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule' });
  }
});

// Update consultation duration only
router.put('/:id/consultation-duration', async (req, res) => {
  try {
    const { consultationDuration } = req.body;
    
    if (!consultationDuration || consultationDuration < 10 || consultationDuration > 120) {
      return res.status(400).json({ 
        success: false, 
        message: 'Consultation duration must be between 10 and 120 minutes' 
      });
    }
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: { consultationDuration } },
      { new: true }
    ).select('name consultationDuration');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Consultation duration updated to ${consultationDuration} minutes`, 
      doctor 
    });
  } catch (error) {
    console.error('Error updating consultation duration:', error);
    res.status(500).json({ success: false, message: 'Failed to update consultation duration' });
  }
});

// Add special date (holiday, leave, special hours)
router.post('/:id/special-dates', async (req, res) => {
  try {
    const { date, isAvailable, reason, slots } = req.body;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          specialDates: {
            date: new Date(date),
            isAvailable: isAvailable !== false,
            reason: reason || '',
            slots: slots || []
          }
        }
      },
      { new: true }
    ).select('specialDates');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, message: 'Special date added', specialDates: doctor.specialDates });
  } catch (error) {
    console.error('Error adding special date:', error);
    res.status(500).json({ success: false, message: 'Failed to add special date' });
  }
});

// Remove special date
router.delete('/:id/special-dates/:dateId', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $pull: { specialDates: { _id: req.params.dateId } } },
      { new: true }
    ).select('specialDates');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, message: 'Special date removed', specialDates: doctor.specialDates });
  } catch (error) {
    console.error('Error removing special date:', error);
    res.status(500).json({ success: false, message: 'Failed to remove special date' });
  }
});

// Get available slots for a specific date (for patients booking)
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }
    
    const doctor = await Doctor.findById(req.params.id)
      .select('weeklySchedule specialDates consultationSettings consultationFee');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    const requestedDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDate.getDay()];
    
    // Check for special date override
    const specialDate = doctor.specialDates?.find(sd => {
      const sdDate = new Date(sd.date);
      return sdDate.toDateString() === requestedDate.toDateString();
    });
    
    let daySchedule;
    let isSpecialDate = false;
    
    if (specialDate) {
      isSpecialDate = true;
      if (!specialDate.isAvailable) {
        return res.json({
          success: true,
          available: false,
          reason: specialDate.reason || 'Doctor not available on this date',
          slots: []
        });
      }
      daySchedule = { isAvailable: true, slots: specialDate.slots };
    } else {
      daySchedule = doctor.weeklySchedule?.[dayOfWeek];
    }
    
    if (!daySchedule?.isAvailable) {
      return res.json({
        success: true,
        available: false,
        reason: `Doctor not available on ${dayOfWeek}s`,
        slots: []
      });
    }
    
    // Generate time slots based on schedule
    const slots = [];
    const slotDuration = doctor.consultationSettings?.slotDuration || 15;
    const bufferTime = doctor.consultationSettings?.bufferTime || 5;
    
    (daySchedule.slots || []).forEach(slot => {
      if (!slot.startTime || !slot.endTime) return;
      
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      
      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      while (currentTime + slotDuration <= endTime) {
        const hour = Math.floor(currentTime / 60);
        const min = currentTime % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        slots.push({
          time: timeStr,
          type: slot.type || 'both',
          available: true // TODO: Check against existing appointments
        });
        
        currentTime += slotDuration + bufferTime;
      }
    });
    
    res.json({
      success: true,
      available: true,
      isSpecialDate,
      dayOfWeek,
      slots,
      consultationFee: doctor.consultationFee,
      virtualFee: doctor.consultationSettings?.virtualConsultationFee || doctor.consultationFee,
      settings: doctor.consultationSettings
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available slots' });
  }
});

// Get doctor's calendar view (for doctor dashboard)
router.get('/:id/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth();
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const doctor = await Doctor.findById(req.params.id)
      .select('weeklySchedule specialDates consultationSettings');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    // Generate calendar data for the month
    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const calendarDays = [];
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      
      // Check for special date
      const specialDate = doctor.specialDates?.find(sd => {
        const sdDate = new Date(sd.date);
        return sdDate.toDateString() === d.toDateString();
      });
      
      let dayInfo = {
        date: dateStr,
        dayOfWeek,
        isToday: d.toDateString() === currentDate.toDateString(),
        isPast: d < currentDate && d.toDateString() !== currentDate.toDateString()
      };
      
      if (specialDate) {
        dayInfo.isSpecialDate = true;
        dayInfo.isAvailable = specialDate.isAvailable;
        dayInfo.reason = specialDate.reason;
        dayInfo.slots = specialDate.slots;
        dayInfo.specialDateId = specialDate._id;
      } else {
        const weeklyDay = doctor.weeklySchedule?.[dayOfWeek];
        dayInfo.isAvailable = weeklyDay?.isAvailable || false;
        dayInfo.slots = weeklyDay?.slots || [];
      }
      
      calendarDays.push(dayInfo);
    }
    
    res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      calendar: calendarDays,
      settings: doctor.consultationSettings
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
});

// ===== ONLINE STATUS ROUTES =====

// Update doctor online status (heartbeat)
router.post('/:id/heartbeat', verifyToken, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        isOnline: true, 
        lastActiveAt: new Date(),
        onlineStatusUpdatedAt: new Date()
      },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, isOnline: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Set doctor offline
router.post('/:id/go-offline', verifyToken, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        isOnline: false,
        onlineStatusUpdatedAt: new Date()
      },
      { new: true }
    );
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    res.json({ success: true, isOnline: false });
  } catch (error) {
    console.error('Error setting offline:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Get single doctor online status
router.get('/:id/online-status', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('isOnline lastActiveAt name')
      .lean();
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    // Consider offline if no heartbeat in last 2 minutes
    const offlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const isReallyOnline = doctor.isOnline && doctor.lastActiveAt && new Date(doctor.lastActiveAt) > offlineThreshold;
    
    res.json({ 
      success: true, 
      isOnline: isReallyOnline,
      lastActiveAt: doctor.lastActiveAt
    });
  } catch (error) {
    console.error('Error fetching online status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
});

module.exports = router;