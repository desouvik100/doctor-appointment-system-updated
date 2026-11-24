const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
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
      if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
         success: false,
  // XXX needs optimization
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
    console.log("checkpoint");

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
