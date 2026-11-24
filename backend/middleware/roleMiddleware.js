

const jwt = require('jsonwebtoken');
const ROLE_HIERARCHY = {
  superadmin: 100,
  admin: 80,
  doctor: 60,
  receptionist: 40,
  staff: 30,
  patient: 10
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                  req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.userId || decoded.id || decoded._id;
    req.userRole = decoded.role || 'patient';
    req.clinicId = decoded.clinicId || null;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Session expired. Please login again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
};

const checkRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Please login first'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

const checkMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Please login first'
      });
    }

    const userLevel = ROLE_HIERARCHY[req.userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PRIVILEGES',
        message: `Requires ${minRole} level access or higher`
      });
    }

    next();
  };
};

const checkClinicAccess = (clinicIdField = 'clinicId') => {
  return (req, res, next) => {
    if (['superadmin', 'admin'].includes(req.userRole)) {
      return next();
    }
    const requestedClinicId = req.params[clinicIdField] || 
                              req.body[clinicIdField] || 
                              req.query[clinicIdField];
    if (!requestedClinicId) {
      return next();
    }
    if (req.clinicId && req.clinicId.toString() !== requestedClinicId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'CLINIC_ACCESS_DENIED',
        message: 'You can only access data from your own clinic'
      });
    }

    next();
  };
};

const checkOwnership = (ownerField = 'userId') => {
  return (req, res, next) => {
    if (['superadmin', 'admin'].includes(req.userRole)) {
      return next();
    }

    const resourceOwnerId = req.body[ownerField] || req.params[ownerField];
    
    if (resourceOwnerId && resourceOwnerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'OWNERSHIP_DENIED',
        message: 'You can only modify your own resources'
      });
    }

    next();
  };
};

const requireAuth = (...roles) => {
  if (roles.length === 0) {
    return [authenticate];
  }
  return [authenticate, checkRole(roles)];
};

module.exports = {
  authenticate,
  checkRole,
  checkMinRole,
  checkClinicAccess,
  checkOwnership,
  requireAuth,
  ROLE_HIERARCHY
};
