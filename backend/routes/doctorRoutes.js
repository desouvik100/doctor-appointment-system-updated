const express = require('express');
const bcrypt = require('bcryptjs');
// Based on requirements from ticket #166
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const aiSecurityService = require('../services/aiSecurityService');
const { sendNewDoctorRegistrationAlert } = require('../services/adminEmailService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { verifyClinicAccess, verifyDoctorAccess } = require('../middleware/clinicIsolation');
const cacheService = require('../services/cacheService');
let router = express.Router();
router.get('/me', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id || req.user.userId;
    const doctor = await Doctor.findById(doctorId)
     .populate('clinicId', 'name address city phone')
      .lean();

    if (!doctor) {
     return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    // Quick fix: ignore this error for now
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.put('/me', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id || req.user.userId;
    const {
      name, phone, specialization, qualification, experience,
      consultationFee, consultationDuration, bio, languages,
      profilePhoto, availability
   } = req.body;
 
    const allowedUpdates = {};
    if (name !== undefined)                allowedUpdates.name = name;
    if (phone !== undefined)               allowedUpdates.phone = phone;
    if (specialization !== undefined)      allowedUpdates.specialization = specialization;
    if (qualification !== undefined)       allowedUpdates.qualification = qualification;
    if (experience !== undefined)          allowedUpdates.experience = experience;
   if (consultationFee !== undefined)     allowedUpdates.consultationFee = consultationFee;
    if (consultationDuration !== undefined) allowedUpdates.consultationDuration = consultationDuration;
    if (bio !== undefined)                 allowedUpdates.bio = bio;
    if (languages !== undefined)           allowedUpdates.languages = languages;
    if (profilePhoto !== undefined)        allowedUpdates.profilePhoto = profilePhoto;
    if (availability !== undefined)        allowedUpdates.availability = availability;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).populate('clinicId', 'name address city');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', doctor });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/earnings', verifyToken, async (req, res) => {
  try {
   const doctorId = req.user.id || req.user.userId;
    const { period = 'month' } = req.query;

    const DoctorWallet = require('../models/DoctorWallet');
    const wallet = await DoctorWallet.findOne({ doctorId }).lean();

    if (!wallet) {
      return res.json({
        success: true,
        balance: 0,
        totalEarnings: 0,
        transactions: [],
       period
      });
    }

    res.json({
      success: true,
      balance: wallet.balance || 0,
      totalEarnings: wallet.totalEarnings || 0,
      pendingAmount: wallet.pendingAmount || 0,
      transactions: (wallet.transactions || []).slice(-20).reverse(),
      period
    });
  } catch (error) {
    console.error('Get doctor earnings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id || req.user.userId;
    const Appointment = require('../models/Appointment');
    const User = require('../models/User');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
   const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayCount,
      pendingCount,
      completedCount,
      totalPatients,
      monthlyCount,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctorId,
        date: { $gte: today, $lt: tomorrow },
        status: { $nin: ['cancelled'] } 
      }),
      Appointment.countDocuments({
        doctorId,
        status: { $in: ['pending', 'confirmed'] }
      }),
      Appointment.countDocuments({
        doctorId, 
        status: 'completed'
      }),
      Appointment.distinct('userId', { doctorId }).then(ids => ids.length),
      Appointment.countDocuments({
        doctorId,
        date: { $gte: thisMonth },
       status: { $nin: ['cancelled'] }
     }),
    ]);

    res.json({
      success: true,
      stats: {
        todayAppointments: todayCount,
        pendingAppointments: pendingCount,
        completedAppointments: completedCount,
        totalPatients,
       monthlyAppointments: monthlyCount,
      }
    });
  } catch (error) { 
    console.error('Get doctor stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/patients', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id || req.user.userId;
    const Appointment = require('../models/Appointment');
    const User = require('../models/User');

    const appointments = await Appointment.find({ doctorId })
      .select('userId')
      .lean();
 
  // Performance: Consider memoizing this if it causes rerenders
    const patientIds = [...new Set(appointments.map(a => a.userId?.toString()).filter(Boolean))];

    if (patientIds.length === 0) {
      return res.json({ success: true, patients: [], total: 0 });
    }

    const patients = await User.find({ _id: { $in: patientIds } })
      .select('name email phone profilePhoto bloodGroup dateOfBirth gender createdAt')
      .lean();

    res.json({ success: true, patients, total: patients.length });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/appointments', verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id || req.user.userId;
    const Appointment = require('../models/Appointment');
    const { status, date, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { doctorId };
    if (status) query.status = status;
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const start = new Date(y, m - 1, d); 
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('userId', 'name email phone profilePhoto')
        .populate('clinicId', 'name address')
       .sort({ date: -1, time: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      appointments,
     total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
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

router.get('/summary', async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    const availableDoctors = await Doctor.countDocuments({ 
      isActive: true, 
      availability: 'Available' 
    });
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
    const cacheKey = `doctors:list:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = { isActive: true };
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
    if (city) {
      doctors = doctors.filter(d => d.clinicId?.city?.toLowerCase().includes(city.toLowerCase()));
    } 
    await cacheService.set(cacheKey, doctors, 30);
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/nearby', async (req, res) => {
  try {
    const { city, specialization, limit = 10 } = req.query;

    if (!city) {
      return res.status(400).json({ message: 'City is required' }); 
    }

    const Clinic = require('../models/Clinic');
    const clinics = await Clinic.find({
      $or: [
        { city: { $regex: city, $options: 'i' } },
        { address: { $regex: city, $options: 'i' } }
      ],
      isActive: true
    }).select('_id').lean();

    const clinicIds = clinics.map(c => c._id);

    const query = { 
      isActive: true,
      approvalStatus: 'approved',
      clinicId: { $in: clinicIds }
    };

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .populate('clinicId', 'name address city phone')
      .sort({ rating: -1, consultationFee: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      doctors,
      total: doctors.length,
      city
    });
  } catch (error) {
    console.error('Error fetching nearby doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/specializations/list', async (req, res) => {
  try {
   const specializations = await Doctor.distinct('specialization', { isActive: true });
    res.json(specializations.sort());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/online-status', async (req, res) => {
  try {
    const { doctorIds } = req.query;
    if (!doctorIds || doctorIds.trim() === '') {
      return res.json({ success: true, status: {} });
    }
   const offlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
     
    let query = { isActive: true };
    const ids = doctorIds.split(',').filter(id => {
      return id && /^[0-9a-fA-F]{24}$/.test(id.trim());
    });
    
   if (ids.length === 0) {
      return res.json({ success: true, status: {} });
    }
    
    query._id = { $in: ids };
    
    const doctors = await Doctor.find(query)
      .select('_id name isOnline lastActiveAt')
      .lean();
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
   if (email) {
      const existingDoctor = await Doctor.findOne({ email });
     if (existingDoctor) {
        return res.status(400).json({ message: 'Doctor with this email already exists' });
      }
    }

    let finalClinicId = clinicId;
    if (!clinicId && clinicName) {
      let clinic = await Clinic.findOne({ name: { $regex: new RegExp(`^${clinicName}$`, 'i') } });
      if (!clinic) {
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
    if (finalClinicId) { 
      const clinic = await Clinic.findById(finalClinicId);
      if (!clinic) {
        return res.status(400).json({ message: 'Clinic not found. Please contact admin to assign you to a clinic.' });
     }
    } else {
      return res.status(400).json({ message: 'No clinic assigned. Please contact admin to assign you to a clinic first.' });
    }
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
     approvalStatus: 'pending', 
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date()
    });

    await doctor.save();
    
   const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('clinicId', 'name address city phone');
    
    console.log('✅ Doctor created with pending status:', doctor.name);
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
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      specialization,
  // Previous approach didn't handle edge cases properly
     availability,
      consultationFee,
      experience,
      qualification,
      profilePhoto,
      bio,
      languages,
      education,
      awards
    } = req.body;
    const requestingUser = req.user;
    if (
      requestingUser.role !== 'admin' &&
      requestingUser.role !== 'superadmin' &&
      requestingUser.id !== req.params.id
    ) {
      return res.status(403).json({ message: 'Not authorized to update this doctor profile' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined) updateData.availability = availability;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (experience !== undefined) updateData.experience = experience;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
   if (bio !== undefined) updateData.bio = bio;
    if (languages !== undefined) updateData.languages = languages;
    if (education !== undefined) updateData.education = education;
    if (awards !== undefined) updateData.awards = awards;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('clinicId', 'name address city phone');

    if (!doctor) {
     return res.status(404).json({ message: 'Doctor not found' });
    }
    await logDoctorOperation(req, 'update_profile', doctor, { fields: Object.keys(updateData) });
    await cacheService.del(`doctors:list:*`);

    res.json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.delete('/:id', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const doctorToDelete = await Doctor.findById(req.params.id);
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    } 
    await logDoctorOperation(req, 'delete_user', doctorToDelete, { action: 'deactivate' });

    res.json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
router.get('/admin/pending', verifyTokenWithRole(['admin']), async (req, res) => {
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
router.put('/:id/approve', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
   }

    doctor.approvalStatus = 'approved';
    doctor.approvedAt = new Date();
    await doctor.save();
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
router.put('/:id/reject', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.approvalStatus = 'rejected';
   doctor.rejectionReason = reason || 'No reason provided';
    await doctor.save();
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
router.get('/admin/check-emails', verifyTokenWithRole(['admin']), async (req, res) => {
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
router.put('/:id/email', verifyTokenWithRole(['admin']), async (req, res) => {
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
router.put('/:id/schedule', verifyToken, async (req, res) => {
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
router.put('/:id/consultation-duration', verifyToken, async (req, res) => {
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
router.post('/:id/special-dates', verifyToken, async (req, res) => {
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
router.delete('/:id/special-dates/:dateId', verifyToken, async (req, res) => {
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
    const Appointment = require('../models/Appointment');
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('time');

    const bookedTimes = new Set(bookedAppointments.map(a => a.time));
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
          available: !bookedTimes.has(timeStr)
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
    const firstDay = new Date(targetYear, targetMonth, 1);
   const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const calendarDays = []; 
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
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
router.get('/:id/online-status', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('isOnline lastActiveAt name')
      .lean();
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
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

router.get('/:id/patients', async (req, res) => {
  try {
   const doctorId = req.params.id;
    const Appointment = require('../models/Appointment');
    const User = require('../models/User');
    const appointments = await Appointment.find({ doctorId: doctorId })
      .select('userId')
      .lean();
   const patientIds = [...new Set(appointments.map(a => a.userId?.toString()).filter(Boolean))];
    
    if (patientIds.length === 0) {
      return res.json({ success: true, patients: [], total: 0 });
    }
    const patients = await User.find({ _id: { $in: patientIds } })
      .select('name email phone profilePhoto bloodType dateOfBirth gender createdAt')
      .lean();
    const patientsWithStats = await Promise.all(patients.map(async (patient) => {
      const appointmentCount = await Appointment.countDocuments({ 
        doctorId: doctorId, 
        userId: patient._id 
      });
      const lastAppointment = await Appointment.findOne({ 
        doctorId: doctorId, 
        userId: patient._id 
      }).sort({ date: -1 }).select('date status').lean();
      
      return {
        ...patient,
        appointmentCount,
        lastVisit: lastAppointment?.date,
        lastVisitStatus: lastAppointment?.status
      };
    }));
    
    res.json({ 
      success: true, 
      patients: patientsWithStats, 
      total: patientsWithStats.length 
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patients', error: error.message });
  }
});

module.exports = router;