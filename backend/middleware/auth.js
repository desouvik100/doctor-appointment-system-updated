const jwt = require('jsonwebtoken');

/**
 * Verify JWT token middleware
 * Extracts and validates JWT token from Authorization header
 * Attaches decoded user info to req.user
 * Also checks if user account is suspended
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.doctorId || decoded.id,
      userId: decoded.userId || decoded.doctorId || decoded.id,
      role: decoded.role,
      email: decoded.email,
      clinicId: decoded.clinicId
    };

    // Check if user is suspended (for critical operations)
    // This runs asynchronously to check current user status
    try {
      const User = require('../models/User');
      const Doctor = require('../models/Doctor');
      
      let userRecord = null;
      
      if (decoded.doctorId) {
        userRecord = await Doctor.findById(decoded.doctorId).select('isActive suspendReason');
      } else if (decoded.userId) {
        userRecord = await User.findById(decoded.userId).select('isActive suspendReason');
      }
      
      if (userRecord && userRecord.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended',
          reason: userRecord.suspendReason || 'Contact admin for more information',
          suspended: true
        });
      }
    } catch (dbError) {
      // If DB check fails, continue with request (don't block on DB errors)
      console.error('Suspension check error:', dbError.message);
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Verify token with role check
 * Ensures user has required role
 * Also checks if user account is suspended
 */
const verifyTokenWithRole = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      );

      req.user = {
        id: decoded.userId || decoded.doctorId || decoded.id,
        userId: decoded.userId || decoded.doctorId || decoded.id,
        role: decoded.role,
        email: decoded.email,
        clinicId: decoded.clinicId
      };

      // Check role if required roles are specified
      if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Check if user is suspended
      try {
        const User = require('../models/User');
        const Doctor = require('../models/Doctor');
        
        let userRecord = null;
        
        if (decoded.doctorId) {
          userRecord = await Doctor.findById(decoded.doctorId).select('isActive suspendReason');
        } else if (decoded.userId) {
          userRecord = await User.findById(decoded.userId).select('isActive suspendReason');
        }
        
        if (userRecord && userRecord.isActive === false) {
          return res.status(403).json({
            success: false,
            message: 'Your account has been suspended',
            reason: userRecord.suspendReason || 'Contact admin for more information',
            suspended: true
          });
        }
      } catch (dbError) {
        console.error('Suspension check error:', dbError.message);
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  };
};

module.exports = {
  verifyToken,
  verifyTokenWithRole
};
