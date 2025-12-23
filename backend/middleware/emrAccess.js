/**
 * EMR Access Control Middleware
 * Controls access to EMR screens based on subscription and role
 */

const EMRSubscription = require('../models/EMRSubscription');
const ClinicStaff = require('../models/ClinicStaff');
const { 
  EMR_SCREENS, 
  PLAN_HIERARCHY, 
  canAccessScreen,
  getScreensForRole 
} = require('../config/emrConfig');

/**
 * Check if clinic has active EMR subscription
 * Attaches subscription to req.emrSubscription
 */
const checkEMRSubscription = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID is required',
        code: 'CLINIC_ID_REQUIRED'
      });
    }
    
    // Get active subscription for clinic
    const subscription = await EMRSubscription.getActiveForClinic(clinicId);
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active EMR subscription found',
        code: 'NO_SUBSCRIPTION',
        upgrade: {
          message: 'Subscribe to EMR to access this feature',
          url: '/emr/subscribe'
        }
      });
    }
    
    // Check if subscription is expired
    if (subscription.isExpired) {
      // Update status if not already expired
      if (subscription.status !== 'expired') {
        subscription.status = 'expired';
        await subscription.save();
      }
      
      return res.status(403).json({
        success: false,
        message: 'EMR subscription has expired',
        code: 'SUBSCRIPTION_EXPIRED',
        expiredAt: subscription.expiryDate,
        upgrade: {
          message: 'Renew your subscription to continue',
          url: '/emr/renew'
        }
      });
    }
    
    // Attach subscription to request
    req.emrSubscription = subscription;
    req.clinicId = clinicId;
    
    next();
  } catch (error) {
    console.error('EMR subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking EMR subscription',
      error: error.message
    });
  }
};

/**
 * Check if user has access to specific EMR screen
 * Requires checkEMRSubscription to run first
 */
const checkEMRScreenAccess = (screenId) => {
  return async (req, res, next) => {
    try {
      const subscription = req.emrSubscription;
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'EMR subscription not found',
          code: 'NO_SUBSCRIPTION'
        });
      }
      
      // Find the screen configuration
      const screen = Object.values(EMR_SCREENS).find(s => s.id === screenId);
      
      if (!screen) {
        return res.status(404).json({
          success: false,
          message: 'EMR screen not found',
          code: 'SCREEN_NOT_FOUND'
        });
      }
      
      // Check plan level
      const userPlanLevel = PLAN_HIERARCHY[subscription.plan] || 0;
      const requiredPlanLevel = PLAN_HIERARCHY[screen.plan] || 0;
      
      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${screen.plan} plan or higher`,
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: subscription.plan,
          requiredPlan: screen.plan,
          screen: {
            id: screen.id,
            name: screen.name,
            description: screen.description
          },
          upgrade: {
            message: `Upgrade to ${screen.plan} plan to access ${screen.name}`,
            url: `/emr/upgrade?plan=${screen.plan}`
          }
        });
      }
      
      // Attach screen info to request
      req.emrScreen = screen;
      
      next();
    } catch (error) {
      console.error('EMR screen access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking screen access',
        error: error.message
      });
    }
  };
};

/**
 * Check user's EMR role within clinic
 * Requires checkEMRSubscription to run first
 */
const checkEMRRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const clinicId = req.clinicId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      // Check if user is clinic staff
      let staffRecord = await ClinicStaff.findOne({
        clinicId,
        userId,
        isActive: true
      });
      
      // If no staff record, check if user is the clinic owner (admin by default)
      if (!staffRecord) {
        const Clinic = require('../models/Clinic');
        const clinic = await Clinic.findById(clinicId);
        
        if (clinic && clinic.ownerId?.toString() === userId.toString()) {
          // Clinic owner is admin
          req.emrRole = 'admin';
        } else {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this clinic',
            code: 'NOT_CLINIC_MEMBER'
          });
        }
      } else {
        req.emrRole = staffRecord.role;
      }
      
      // Check if role is allowed
      if (allowedRoles && !allowedRoles.includes(req.emrRole)) {
        return res.status(403).json({
          success: false,
          message: `This action requires ${allowedRoles.join(' or ')} role`,
          code: 'ROLE_NOT_ALLOWED',
          currentRole: req.emrRole,
          requiredRoles: allowedRoles
        });
      }
      
      next();
    } catch (error) {
      console.error('EMR role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking EMR role',
        error: error.message
      });
    }
  };
};

/**
 * Combined middleware: Check subscription + screen + role
 */
const checkEMRAccess = (screenId) => {
  return async (req, res, next) => {
    try {
      const clinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
      const userId = req.user?.id || req.user?._id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Clinic ID is required',
          code: 'CLINIC_ID_REQUIRED'
        });
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      // Get subscription
      const subscription = await EMRSubscription.getActiveForClinic(clinicId);
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No active EMR subscription',
          code: 'NO_SUBSCRIPTION',
          locked: true,
          upgrade: { url: '/emr/subscribe' }
        });
      }
      
      if (subscription.isExpired) {
        return res.status(403).json({
          success: false,
          message: 'EMR subscription expired',
          code: 'SUBSCRIPTION_EXPIRED',
          locked: true,
          upgrade: { url: '/emr/renew' }
        });
      }
      
      // Get user role
      let userRole = null;
      const staffRecord = await ClinicStaff.findOne({ clinicId, userId, isActive: true });
      
      if (staffRecord) {
        userRole = staffRecord.role;
      } else {
        const Clinic = require('../models/Clinic');
        const clinic = await Clinic.findById(clinicId);
        if (clinic && clinic.ownerId?.toString() === userId.toString()) {
          userRole = 'admin';
        }
      }
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Not a clinic member',
          code: 'NOT_CLINIC_MEMBER'
        });
      }
      
      // Check screen access
      const screen = Object.values(EMR_SCREENS).find(s => s.id === screenId);
      
      if (!screen) {
        return res.status(404).json({
          success: false,
          message: 'Screen not found',
          code: 'SCREEN_NOT_FOUND'
        });
      }
      
      // Check plan level
      const userPlanLevel = PLAN_HIERARCHY[subscription.plan] || 0;
      const requiredPlanLevel = PLAN_HIERARCHY[screen.plan] || 0;
      
      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `Requires ${screen.plan} plan`,
          code: 'PLAN_UPGRADE_REQUIRED',
          locked: true,
          screen: { id: screen.id, name: screen.name },
          currentPlan: subscription.plan,
          requiredPlan: screen.plan,
          upgrade: { url: `/emr/upgrade?plan=${screen.plan}` }
        });
      }
      
      // Check role access
      if (!screen.roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Requires ${screen.roles.join(' or ')} role`,
          code: 'ROLE_NOT_ALLOWED',
          currentRole: userRole,
          requiredRoles: screen.roles
        });
      }
      
      // Attach to request
      req.emrSubscription = subscription;
      req.emrRole = userRole;
      req.emrScreen = screen;
      req.clinicId = clinicId;
      
      next();
    } catch (error) {
      console.error('EMR access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking EMR access',
        error: error.message
      });
    }
  };
};

/**
 * Get available screens for user
 */
const getAvailableScreens = async (clinicId, userId) => {
  try {
    const subscription = await EMRSubscription.getActiveForClinic(clinicId);
    
    if (!subscription || subscription.isExpired) {
      return { screens: [], subscription: null };
    }
    
    // Get user role
    let userRole = null;
    const staffRecord = await ClinicStaff.findOne({ clinicId, userId, isActive: true });
    
    if (staffRecord) {
      userRole = staffRecord.role;
    } else {
      const Clinic = require('../models/Clinic');
      const clinic = await Clinic.findById(clinicId);
      if (clinic && clinic.ownerId?.toString() === userId.toString()) {
        userRole = 'admin';
      }
    }
    
    if (!userRole) {
      return { screens: [], subscription: null, error: 'Not a clinic member' };
    }
    
    const screens = getScreensForRole(userRole, subscription.plan);
    
    // Also get locked screens (for upgrade prompts)
    const allScreens = Object.values(EMR_SCREENS);
    const lockedScreens = allScreens.filter(screen => {
      const planLevel = PLAN_HIERARCHY[subscription.plan] || 0;
      const screenPlanLevel = PLAN_HIERARCHY[screen.plan] || 0;
      return planLevel < screenPlanLevel && screen.roles.includes(userRole);
    });
    
    return {
      screens,
      lockedScreens,
      subscription: {
        plan: subscription.plan,
        daysRemaining: subscription.daysRemaining,
        expiryDate: subscription.expiryDate
      },
      role: userRole
    };
  } catch (error) {
    console.error('Error getting available screens:', error);
    return { screens: [], error: error.message };
  }
};

module.exports = {
  checkEMRSubscription,
  checkEMRScreenAccess,
  checkEMRRole,
  checkEMRAccess,
  getAvailableScreens
};
