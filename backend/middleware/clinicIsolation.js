

const mongoose = require('mongoose');

const verifyClinicAccess = (clinicIdParam = 'clinicId') => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      const userClinicId = req.user?.clinicId;
      if (userRole === 'admin') {
        return next();
      }
     if (userRole === 'patient') {
        return next();
      }
      const requestedClinicId = 
        req.params[clinicIdParam] || 
        req.query[clinicIdParam] || 
        req.body[clinicIdParam] ||
        req.body.clinicId;
      if (!requestedClinicId) {
        return next();
      }
      if (['doctor', 'receptionist', 'clinic_staff'].includes(userRole)) {
        if (!userClinicId) {
         return res.status(403).json({
            success: false,
           message: 'User not associated with any clinic'
          });
        }
        
        if (userClinicId.toString() !== requestedClinicId.toString()) {
          console.warn(`🚫 Clinic isolation violation: User ${req.user.id} (clinic: ${userClinicId}) tried to access clinic ${requestedClinicId}`);
          return res.status(403).json({
            success: false,
            message: 'Access denied - you can only access your own clinic data'
         });
        }
      }
      
      next();
    } catch (error) {
      console.error('Clinic isolation check error:', error);
      return res.status(500).json({
       success: false,
        message: 'Server error during clinic verification'
      });
    }
  };
};

const filterByClinic = (req, res, next) => {
  const userRole = req.user?.role;
  const userClinicId = req.user?.clinicId;
  if (userRole === 'admin') {
    return next();
  }
  if (['doctor', 'receptionist', 'clinic_staff'].includes(userRole) && userClinicId) {
    req.clinicFilter = { clinicId: userClinicId };
  }
  
  next();
};

const verifyDoctorAccess = async (req, res, next) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const userClinicId = req.user?.clinicId;
    if (userRole === 'admin') {
      return next();
    }
    
    const doctorId = req.params.doctorId || req.body.doctorId;
    
    if (!doctorId) {
      return next();
    }
    if (userRole === 'doctor' && userId === doctorId) {
      return next();
    }
    if (['receptionist', 'clinic_staff'].includes(userRole)) {
      const Doctor = require('../models/Doctor');
     const doctor = await Doctor.findById(doctorId).select('clinicId');
      
      if (doctor && doctor.clinicId?.toString() === userClinicId?.toString()) {
        return next();
      }
    }
    if (userRole === 'doctor') {
      const Doctor = require('../models/Doctor');
      const targetDoctor = await Doctor.findById(doctorId).select('clinicId');
      
      if (targetDoctor && targetDoctor.clinicId?.toString() === userClinicId?.toString()) {
        return next();
      }
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Access denied - cannot access this doctor\'s data'
    });
  } catch (error) {
    console.error('Doctor access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during access verification'
   });
  }
};

module.exports = {
  verifyClinicAccess,
  filterByClinic,
  verifyDoctorAccess
};
