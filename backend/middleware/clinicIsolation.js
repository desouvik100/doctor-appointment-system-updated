/**
 * Clinic Isolation Middleware
 * Ensures doctors and staff can only access data from their own clinic
 */

const mongoose = require('mongoose');

/**
 * Verify clinic access - ensures user can only access their clinic's data
 * @param {string} clinicIdParam - The request parameter name containing clinicId
 */
const verifyClinicAccess = (clinicIdParam = 'clinicId') => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      const userClinicId = req.user?.clinicId;
      
      // Admins can access all clinics
      if (userRole === 'admin') {
        return next();
      }
      
      // Patients don't have clinic restrictions (they can book at any clinic)
      if (userRole === 'patient') {
        return next();
      }
      
      // Get the requested clinic ID from params, query, or body
      const requestedClinicId = 
        req.params[clinicIdParam] || 
        req.query[clinicIdParam] || 
        req.body[clinicIdParam] ||
        req.body.clinicId;
      
      // If no clinic ID in request, allow (will be filtered by other means)
      if (!requestedClinicId) {
        return next();
      }
      
      // Verify clinic match for doctors and staff
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

/**
 * Filter query by clinic - automatically adds clinicId filter for non-admin users
 */
const filterByClinic = (req, res, next) => {
  const userRole = req.user?.role;
  const userClinicId = req.user?.clinicId;
  
  // Admins see all data
  if (userRole === 'admin') {
    return next();
  }
  
  // Add clinic filter for doctors and staff
  if (['doctor', 'receptionist', 'clinic_staff'].includes(userRole) && userClinicId) {
    req.clinicFilter = { clinicId: userClinicId };
  }
  
  next();
};

/**
 * Verify doctor owns the resource or is from same clinic
 */
const verifyDoctorAccess = async (req, res, next) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const userClinicId = req.user?.clinicId;
    
    // Admins can access all
    if (userRole === 'admin') {
      return next();
    }
    
    const doctorId = req.params.doctorId || req.body.doctorId;
    
    if (!doctorId) {
      return next();
    }
    
    // Doctor accessing their own data
    if (userRole === 'doctor' && userId === doctorId) {
      return next();
    }
    
    // Staff accessing doctor from same clinic
    if (['receptionist', 'clinic_staff'].includes(userRole)) {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findById(doctorId).select('clinicId');
      
      if (doctor && doctor.clinicId?.toString() === userClinicId?.toString()) {
        return next();
      }
    }
    
    // Doctor accessing another doctor from same clinic
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
