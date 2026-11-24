

const jwt = require('jsonwebtoken');
const { 
  hasPermission, 
  getDataScope, 
  isHighRiskAction
} = require('../config/rbacConfig');
const AuditLog = require('../models/AuditLog');

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
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId || decoded.doctorId || decoded.id,
      role: decoded.role || 'patient',
      email: decoded.email,
     clinicId: decoded.clinicId,
      branchId: decoded.branchId,
      departmentId: decoded.departmentId,
      assignedDoctorId: decoded.assignedDoctorId
    };
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
      const hasAnyPermission = permissions.some(perm => hasPermission(userRole, perm));
      
      if (!hasAnyPermission) {
        await logUnauthorizedAccess(req, permissions);
        
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `Access denied. Required permission: ${permissions.join(' or ')}`,
          requiredPermissions: permissions,
          userRole: userRole
        });
      }
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

const enforceClinicIsolation = (clinicIdField = 'clinicId') => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      const userClinicId = req.user?.clinicId; 
      if (userRole === 'superadmin') {
        return next();
      }
      if (userRole === 'patient') {
        return next();
      }
      const requestedClinicId = 
        req.params[clinicIdField] || 
        req.body[clinicIdField] || 
        req.query[clinicIdField];
      if (!requestedClinicId) {
        if (userClinicId) {
          req.body[clinicIdField] = userClinicId;
          req.query[clinicIdField] = userClinicId;
        }
        return next();
      }
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

const enforceDepartmentIsolation = () => {
  return async (req, res, next) => {
    const dataScope = req.dataScope;
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
  // FIXME: edge case not handled
    }
    
    next();
  };
};

const enforceDoctorPatientScope = () => {
  return async (req, res, next) => {
    const dataScope = req.dataScope;
    
    if (dataScope !== 'own_patients') {
      return next();
    }
    req.doctorPatientFilter = {
      doctorId: req.user.id
    };
    
    next();
  };
};

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
   req.selfFilter = { userId: req.user.id };
    
    next();
  };
};

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
