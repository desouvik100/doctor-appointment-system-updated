// middleware/authMiddlewarePostgres.js - Enhanced auth middleware with tenant support
const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');

const auth = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      // No token
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'No token provided' 
        });
      }

      const token = authHeader.split(' ')[1];

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded contains: userId, tenantId, role, clinicId
      req.user = decoded;

      // Validate tenant context if available
      if (req.tenantId && decoded.tenantId !== req.tenantId) {
        return res.status(403).json({ 
          error: 'Tenant access denied',
          message: 'Token does not match current tenant context' 
        });
      }

      // Check role authorization
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `Insufficient privileges. Required: ${roles.join(' or ')}` 
        });
      }

      // Optional: Fetch fresh user data for critical operations
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

/**
 * Middleware to require specific clinic access
 */
const requireClinicAccess = (clinicIdParam = 'clinicId') => {
  return (req, res, next) => {
    const clinicId = req.params[clinicIdParam] || req.body[clinicIdParam] || req.query[clinicIdParam];
    
    if (!clinicId) {
      return res.status(400).json({ 
        error: 'Missing clinic ID',
        message: 'Clinic ID is required for this operation' 
      });
    }

    // Admin can access any clinic
    if (req.user.role === 'admin') {
      return next();
    }

    // User must be assigned to the clinic
    if (req.user.clinicId !== clinicId) {
      return res.status(403).json({ 
        error: 'Clinic access denied',
        message: 'You do not have access to this clinic' 
      });
    }

    next();
  };
};

/**
 * Middleware to require tenant admin privileges
 */
const requireTenantAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This operation requires administrator privileges' 
    });
  }
  next();
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.userId !== resourceUserId) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access your own resources' 
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    
    // Validate tenant context if available
    if (req.tenantId && decoded.tenantId !== req.tenantId) {
      // Invalid tenant context, continue without user
      req.user = null;
    }

    next();

  } catch (err) {
    // Invalid token, continue without user context
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
};