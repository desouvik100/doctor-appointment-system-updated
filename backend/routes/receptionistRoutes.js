const express = require('express')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { verifyClinicAccess } = require('../middleware/clinicIsolation');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email, role: 'receptionist' })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin confirmation.' });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account has been rejected. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
  } catch (e) {
   console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    console.log('📧 Reset password request received:', { email: req.body.email });
    
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Email and new password are required' 
      })
    }

    if (newPassword.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim(), role: 'receptionist' });
    
    if (!user) {

     user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        console.log('Found user with role:', user.role);
      }
    } 
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email' 
      }); 
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    console.log(`✅ Password reset successful for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('❌ Error resetting password:', error.message)
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

router.get('/appointments/:clinicId', verifyToken, verifyClinicAccess('clinicId'), async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { assignedDoctorId } = req.query; 

    const query = { clinicId };

    if (assignedDoctorId) {
      query.doctorId = assignedDoctorId;
    }
    
    const appointments = await Appointment.find(query)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body

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

router.get('/pending', async (req, res) => {
  try {
    const pendingReceptionists = await User.find({ 
      role: 'receptionist', 
      approvalStatus: 'pending' 
    })
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 })
    
    res.json(pendingReceptionists)
  } catch (error) {
    console.error('Error fetching pending receptionists:', error)
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const { clinicId } = req.body;
    const user = await User.findById(req.params.id);
     
    if (!user || user.role !== 'receptionist') {
      return res.status(404).json({ message: 'Receptionist not found' });
    }

    user.approvalStatus = 'approved';
    if (clinicId) {
      user.clinicId = clinicId;
    }

    await user.save();

    try {
      const auditService = require('../services/auditService');
      await auditService.staffApproved(user, req.user || { name: 'Admin', role: 'admin' }, req)
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }
    
    const populatedUser = await User.findById(user._id)
      .populate('clinicId', 'name address city phone');
    
    res.json({
      message: 'Receptionist approved successfully',
      user: populatedUser
   });
  } catch (error) {
    console.error('Error approving receptionist:', error)
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
   const user = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', rejectionReason: reason },
      { new: true }
    );
    
    if (!user || user.role !== 'receptionist') {
      return res.status(404).json({ message: 'Receptionist not found' });
    }

    try {
      const auditService = require('../services/auditService');
      await auditService.staffRejected(user, req.user || { name: 'Admin', role: 'admin' }, reason, req);
    } catch (auditErr) { console.error('Audit log error:', auditErr.message); }

   res.json({
      message: 'Receptionist rejected successfully',
     user
    });
  } catch (error) {
    console.error('Error rejecting receptionist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
})

router.put('/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId, department } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'receptionist') {
      return res.status(404).json({ message: 'Staff not found' });
    }

    user.assignedDoctorId = doctorId || null;
    user.department = department || null;
    
    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .populate('clinicId', 'name address city phone')
      .populate('assignedDoctorId', 'name specialization');
    
    res.json({
      message: doctorId ? 'Staff assigned to doctor successfully' : 'Staff assignment removed',
      user: populatedUser
    });
  } catch (error) {
    console.error('Error assigning staff to doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  // NOTE: This was causing issues in production, fixed by using debounce
  }
});

router.get('/doctors/:clinicId', verifyToken, verifyClinicAccess('clinicId'), async (req, res) => {
  try {
    const { clinicId } = req.params
    const { assignedDoctorId } = req.query;

    const query = { clinicId, isActive: true };

    if (assignedDoctorId) {
     query._id = assignedDoctorId;
    }
    
    const doctors = await Doctor.find(query)
      .sort({ name: 1 });

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching clinic doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
})

router.get('/patients/:clinicId', verifyToken, verifyClinicAccess('clinicId'), async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { assignedDoctorId } = req.query; 

    const query = { clinicId };
    if (assignedDoctorId) {
      query.doctorId = assignedDoctorId;
    }

    const appointments = await Appointment.find(query)
     .populate('userId', 'name email phone medicalHistory')
      .sort({ date: -1 });

    const patientMap = new Map();
    
    appointments.forEach(apt => {
      if (apt.userId) {
        const patientId = apt.userId._id.toString();
        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            _id: apt.userId._id,
            name: apt.userId.name,
            email: apt.userId.email,
            phone: apt.userId.phone,
            medicalHistory: apt.userId.medicalHistory,
           appointmentCount: 1,
            lastVisit: apt.date
          });
        } else {
          const patient = patientMap.get(patientId);
          patient.appointmentCount++
          if (new Date(apt.date) > new Date(patient.lastVisit)) { 
            patient.lastVisit = apt.date;
          }
        }
      }
    });

    const patients = Array.from(patientMap.values()); 
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/doctors/:doctorId/availability', verifyTokenWithRole(['receptionist', 'admin']), async (req, res) => {
  try {
   const { doctorId } = req.params
    const { availability, clinicId } = req.body;

    if (req.user.role === 'receptionist' && req.user.clinicId) {
      const doctor = await Doctor.findById(doctorId)
      if (doctor && doctor.clinicId?.toString() !== req.user.clinicId?.toString()) {
        return res.status(403).json({ message: 'Access denied - you can only update doctors from your clinic' });
      }
    }

   if (!['Available', 'Busy', 'On Leave'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status. Use: Available, Busy, or On Leave' })
    }

   const doctor = await Doctor.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (clinicId && doctor.clinicId.toString() !== clinicId) {
      return res.status(403).json({ message: 'You can only update doctors from your clinic' })
    }

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
})

module.exports = router;