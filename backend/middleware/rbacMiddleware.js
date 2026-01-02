/**
 * RBAC Middleware - Hospital-Grade Access Control
 * ================================================
 * Enforces permission-based access control on every API endpoint.
 * This middleware MUST be used on all protected routes.
 */

const jwt = require('jsonwebtoken');
const { 
  hasPermission, 
  getDataScope, 
  isHighRiskAction,
  ROLES 
} = require('../config/rbacConfig');
const AuditLog = require('../models/AuditLog');

/**
 * Authenticate and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Attach user info
    req.user = {
      id: decoded.userId || decoded.doctorId || decoded.id,
      role: decoded.role || 'patient',
      email: decoded.email,
      clinicId: decoded.clinicId,
      branchId: decoded.branchId,
      departmentId: decoded.departmentId,
      assignedDoctorId: decoded.assignedDoctorId
    };
    
    // Get data scope for this role
    req.dataScope = getDataScope(req.user.role);
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please login again.'
      });
    }
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
};

/**
 * Check if user has required permission(s)
 * @param {string|string[]} requiredPermissions - Single permission or array
 * @param {object} options - Additional options
 */
const requirePermission = (requiredPermissions, options = {}) => {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'NOT_AUTHENTICATED',
          message: 'Please login first'
        });
      }
      
      const userRole = req.user.role;
      
      // Check if user has ANY of the required permissions (OR logic)
      const hasAnyPermission = permissions.some(perm => hasPermission(userRole, perm));
      
      if (!hasAnyPermission) {
        // Log unauthorized access attempt
        await logUnauthorizedAccess(req, permissions);
        
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `Access denied. Required permission: ${permissions.join(' or ')}`,
          requiredPermissions: permissions,
          userRole: userRole
        });
      }
      
      // For high-risk actions, add extra verification flag
      if (permissions.some(p => isHighRiskAction(p))) {
        req.isHighRiskAction = true;
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

/**
 * Check ALL required permissions (AND logic)
 */
const requireAllPermissions = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'NOT_AUTHENTICATED',
        message: 'Please login first'
      });
    }
    
    const userRole = req.user.role;
    const missingPermissions = permissions.filter(perm => !hasPermission(userRole, perm));
    
    if (missingPermissions.length > 0) {
      await logUnauthorizedAccess(req, permissions);
      
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Access denied. Missing required permissions.',
        missingPermissions
      });
    }
    
    next();
  };
};

/**
 * Enforce clinic isolation - users can only access their clinic's data
 */
const enforceClinicIsolation = (clinicIdField = 'clinicId') => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      const userClinicId = req.user?.clinicId;
      
      // Superadmin bypasses clinic isolation
      if (userRole === 'superadmin') {
        return next();
      }
      
      // Patients can access any clinic (for booking)
      if (userRole === 'patient') {
        return next();
      }
      
      // Get requested clinic ID from various sources
      const requestedClinicId = 
        req.params[clinicIdField] || 
        req.body[clinicIdField] || 
        req.query[clinicIdField];
      
      // If no clinic ID in request, inject user's clinic ID
      if (!requestedClinicId) {
        if (userClinicId) {
          req.body[clinicIdField] = userClinicId;
          req.query[clinicIdField] = userClinicId;
        }
        return next();
      }
      
      // Verify clinic match
      if (userClinicId && userClinicId.toString() !== requestedClinicId.toString()) {
        console.warn(`🚫 Clinic isolation violation: User ${req.user.id} tried to access clinic ${requestedClinicId}`);
        
        await logUnauthorizedAccess(req, ['clinic_access'], {
          attemptedClinicId: requestedClinicId,
          userClinicId: userClinicId
        });
        
        return res.status(403).json({
          success: false,
          code: 'CLINIC_ACCESS_DENIED',
          message: 'You can only access data from your own clinic'
        });
      }
      
      next();
    } catch (error) {
      console.error('Clinic isolation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying clinic access'
      });
    }
  };
};

/**
 * Enforce department isolation for staff
 */
const enforceDepartmentIsolation = () => {
  return async (req, res, next) => {
    const dataScope = req.dataScope;
    
    // Only apply to department-scoped roles
    if (dataScope !== 'assigned_department') {
      return next();
    }
    
    const userDepartment = req.user?.departmentId;
    const requestedDepartment = req.params.departmentId || req.body.departmentId || req.query.departmentId;
    
    if (requestedDepartment && userDepartment && 
        requestedDepartment.toString() !== userDepartment.toString()) {
      return res.status(403).json({
        success: false,
        code: 'DEPARTMENT_ACCESS_DENIED',
        message: 'You can only access data from your assigned department'
      });
    }
    
    next();
  };
};

/**
 * Enforce doctor-patient relationship
 * Doctors can only see their own patients unless explicitly allowed
 */
const enforceDoctorPatientScope = () => {
  return async (req, res, next) => {
    const dataScope = req.dataScope;
    
    if (dataScope !== 'own_patients') {
      return next();
    }
    
    // This will be used by the query builder to filter results
    req.doctorPatientFilter = {
      doctorId: req.user.id
    };
    
    next();
  };
};

/**
 * Enforce self-only access for patients
 */
const enforceSelfAccess = (userIdField = 'userId') => {
  return async (req, res, next) => {
    const dataScope = req.dataScope;
    
    if (dataScope !== 'self') {
      return next();
    }
    
    const requestedUserId = 
      req.params[userIdField] || 
      req.body[userIdField] || 
      req.query[userIdField];
    
    if (requestedUserId && requestedUserId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'SELF_ACCESS_ONLY',
        message: 'You can only access your own data'
      });
    }
    
    // Inject user ID for queries
    req.selfFilter = { userId: req.user.id };
    
    next();
  };
};

/**
 * Log unauthorized access attempts
 */
async function logUnauthorizedAccess(req, attemptedPermissions, details = {}) {
  try {
    await AuditLog.log({
      userId: req.user?.id,
      userName: req.user?.email || 'Unknown',
      userRole: req.user?.role || 'unknown',
      entityType: 'security',
      entityId: req.user?.id || 'unknown',
      action: 'unauthorized_access',
      description: `Unauthorized access attempt: ${attemptedPermissions.join(', ')}`,
      severity: 'high',
      clinicId: req.user?.clinicId,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      changes: {
        attemptedPermissions,
        endpoint: req.originalUrl,
        method: req.method,
        ...details
      }
    });
  } catch (error) {
    console.error('Failed to log unauthorized access:', error);
  }
}

/**
 * Combined middleware: authenticate + permission + clinic isolation
 */
const protect = (permissions, options = {}) => {
  const middlewares = [authenticate];
  
  if (permissions) {
    middlewares.push(requirePermission(permissions, options));
  }
  
  if (options.clinicIsolation !== false) {
    middlewares.push(enforceClinicIsolation(options.clinicIdField));
  }
  
  if (options.departmentIsolation) {
    middlewares.push(enforceDepartmentIsolation());
  }
  
  if (options.doctorPatientScope) {
    middlewares.push(enforceDoctorPatientScope());
  }
  
  if (options.selfAccess) {
    middlewares.push(enforceSelfAccess(options.userIdField));
  }
  
  return middlewares;
};

module.exports = {
  authenticate,
  requirePermission,
  requireAllPermissions,
  enforceClinicIsolation,
  enforceDepartmentIsolation,
  enforceDoctorPatientScope,
  enforceSelfAccess,
  protect
};
