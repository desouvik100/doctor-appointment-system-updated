/**
 * Enhanced Authentication Middleware
 * ==================================
 * Uses the new JWT Token Service with:
 * - Access + Refresh token validation
 * - Token blacklist checking
 * - Force logout support
 * - Session validation
 */

const jwtTokenService = require('../services/jwtTokenService');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * Verify access token middleware
 * Checks token validity, blacklist, and user status
 */
const verifyAccessToken = async (req, res, next) => {
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

    // Verify token using JWT service
    const verification = jwtTokenService.verifyAccessToken(token);

    if (!verification.valid) {
      // Check if token expired (client should refresh)
      if (verification.expired) {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired. Please refresh.',
          expired: true
        });
      }

      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: verification.error || 'Invalid token'
      });
    }

    const decoded = verification.decoded;

    // Check if user was force logged out
    const forceLogoutCheck = await checkForceLogout(decoded);
    if (forceLogoutCheck.forceLogout) {
      return res.status(401).json({
        success: false,
        code: 'FORCE_LOGOUT',
        message: 'Your session has been terminated. Please login again.',
        reason: forceLogoutCheck.reason
      });
    }

    // Check if user is suspended
    const suspensionCheck = await checkUserSuspension(decoded);
    if (suspensionCheck.suspended) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended',
        reason: suspensionCheck.reason
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.doctorId,
      userId: decoded.userId,
      doctorId: decoded.doctorId,
      role: decoded.role,
      email: decoded.email,
      clinicId: decoded.clinicId,
      branchId: decoded.branchId
    };

    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication failed'
    });
  }
};

/**
 * Check if user was force logged out
 */
async function checkForceLogout(decoded) {
  try {
    const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
    let forceLogoutAt = null;

    if (decoded.doctorId) {
      const doctor = await Doctor.findById(decoded.doctorId).select('forceLogoutAt').lean();
      forceLogoutAt = doctor?.forceLogoutAt;
    } else if (decoded.userId) {
      const user = await User.findById(decoded.userId).select('forceLogoutAt').lean();
      forceLogoutAt = user?.forceLogoutAt;
    }

    if (forceLogoutAt && new Date(forceLogoutAt).getTime() > tokenIssuedAt) {
      return { forceLogout: true, reason: 'Session terminated by administrator' };
    }

    return { forceLogout: false };
  } catch (error) {
    console.error('Force logout check error:', error);
    return { forceLogout: false };
  }
}

/**
 * Check if user is suspended
 */
async function checkUserSuspension(decoded) {
  try {
    let userRecord = null;

    if (decoded.doctorId) {
      userRecord = await Doctor.findById(decoded.doctorId)
        .select('isActive suspendReason')
        .lean();
    } else if (decoded.userId) {
      userRecord = await User.findById(decoded.userId)
        .select('isActive suspendReason')
        .lean();
    }

    if (userRecord && userRecord.isActive === false) {
      return {
        suspended: true,
        reason: userRecord.suspendReason || 'Contact administrator'
      };
    }

    return { suspended: false };
  } catch (error) {
    console.error('Suspension check error:', error);
    return { suspended: false };
  }
}

/**
 * Verify token with role check
 */
const verifyTokenWithRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    // First verify the token
    await verifyAccessToken(req, res, async () => {
      // Then check role
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }
      next();
    });
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const verification = jwtTokenService.verifyAccessToken(token);

  if (verification.valid) {
    req.user = {
      id: verification.decoded.userId || verification.decoded.doctorId,
      userId: verification.decoded.userId,
      doctorId: verification.decoded.doctorId,
      role: verification.decoded.role,
      email: verification.decoded.email,
      clinicId: verification.decoded.clinicId
    };
    req.token = token;
  } else {
    req.user = null;
  }

  next();
};

/**
 * Refresh token endpoint handler
 */
const handleTokenRefresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token is required'
      });
    }

    const result = await jwtTokenService.refreshTokens(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_FAILED',
        message: result.error
      });
    }

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      code: 'REFRESH_ERROR',
      message: 'Failed to refresh token'
    });
  }
};

/**
 * Logout handler
 */
const handleLogout = async (req, res) => {
  try {
    const accessToken = req.token || req.headers.authorization?.split(' ')[1];
    const { refreshToken } = req.body;

    jwtTokenService.logout(accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Logout from all devices handler
 */
const handleLogoutAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const accessToken = req.token;

    jwtTokenService.logoutAll(userId, accessToken);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices'
    });
  }
};

/**
 * Get active sessions handler
 */
const handleGetSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = jwtTokenService.getActiveSessions(userId);

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
};

module.exports = {
  verifyAccessToken,
  verifyTokenWithRole,
  optionalAuth,
  handleTokenRefresh,
  handleLogout,
  handleLogoutAll,
  handleGetSessions,
  checkForceLogout,
  checkUserSuspension
};
