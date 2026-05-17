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
      process.env.JWT_SECRET
    );

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.doctorId || decoded.id,
      userId: decoded.userId || decoded.doctorId || decoded.id,
      role: decoded.role,
      email: decoded.email,
      clinicId: decoded.clinicId
    };

    // Suspension check is handled globally in server.js for all /api routes.
    // Doing it again here would double the DB queries on every authenticated request.
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
 * Ensures user has required role.
 * Suspension is handled globally in server.js — no duplicate DB check here.
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
        process.env.JWT_SECRET
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
