/**
 * Auth Token Routes - Access + Refresh Token Management
 * =====================================================
 * Handles token refresh, logout, and session management
 */

const express = require('express');
const router = express.Router();
const {
  verifyAccessToken,
  handleTokenRefresh,
  handleLogout,
  handleLogoutAll,
  handleGetSessions
} = require('../middleware/enhancedAuth');

/**
 * POST /api/auth/token/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', handleTokenRefresh);

/**
 * POST /api/auth/token/logout
 * Logout current session
 */
router.post('/logout', verifyAccessToken, handleLogout);

/**
 * POST /api/auth/token/logout-all
 * Logout from all devices
 */
router.post('/logout-all', verifyAccessToken, handleLogoutAll);

/**
 * GET /api/auth/token/sessions
 * Get active sessions for current user
 */
router.get('/sessions', verifyAccessToken, handleGetSessions);

/**
 * POST /api/auth/token/validate
 * Validate current access token
 */
router.post('/validate', verifyAccessToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      clinicId: req.user.clinicId
    }
  });
});

module.exports = router;
