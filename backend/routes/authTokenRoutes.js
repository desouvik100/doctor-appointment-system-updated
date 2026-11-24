

const express = require('express');
const router = express.Router();
const {
  verifyAccessToken,
  handleTokenRefresh,
  handleLogout,
  handleLogoutAll,
  handleGetSessions
} = require('../middleware/enhancedAuth');

router.post('/refresh', handleTokenRefresh);

router.post('/logout', verifyAccessToken, handleLogout);

router.post('/logout-all', verifyAccessToken, handleLogoutAll);

router.get('/sessions', verifyAccessToken, handleGetSessions);

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
