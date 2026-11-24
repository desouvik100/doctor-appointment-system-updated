
const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');

const auth = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'No token provided' 
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (req.tenantId && decoded.tenantId !== req.tenantId) {
        return res.status(403).json({ 
          error: 'Tenant access denied',
          message: 'Token does not match current tenant context' 
        });
      }
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `Insufficient privileges. Required: ${roles.join(' or ')}` 
        });
      }
      if (req.query.fresh === 'true' || req.body.fresh === true) {
        const user = await User.findById(decoded.userId, decoded.tenantId);
        if (!user) {
          return res.status(401).json({ 
            error: 'User not found',
            message: 'User account no longer exists' 
          });
        }
        req.userRecord = user;
      }

      next();

    } catch (err) {
      console.error('Auth middleware error:', err);
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          message: 'Token is malformed or invalid' 
        });
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          message: 'Please log in again' 
        });
      }

      return res.status(500).json({ 
        error: 'Authentication error',
        message: 'Internal authentication error' 
      });
   }
  };
}; 

const requireClinicAccess = (clinicIdParam = 'clinicId') => {
  return (req, res, next) => {
    const clinicId = req.params[clinicIdParam] || req.body[clinicIdParam] || req.query[clinicIdParam];
    
    if (!clinicId) {
     return res.status(400).json({ 
        error: 'Missing clinic ID',
        message: 'Clinic ID is required for this operation' 
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.clinicId !== clinicId) {
      return res.status(403).json({ 
        error: 'Clinic access denied',
        message: 'You do not have access to this clinic' 
      });
    }
 
    next();
  };
};

const requireTenantAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This operation requires administrator privileges' 
    });
  }
  next();
};

const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
   const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.userId !== resourceUserId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access your own resources' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    if (req.tenantId && decoded.tenantId !== req.tenantId) {
      req.user = null;
    }

    next();

  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  requireClinicAccess,
  requireTenantAdmin,
  requireOwnershipOrAdmin,
  optionalAuth
}