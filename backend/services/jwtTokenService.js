/**
 * JWT Token Service - Access + Refresh Token Flow
 * ================================================
 * Implements secure token management with:
 * - Short-lived access tokens (15 min)
 * - Long-lived refresh tokens (7 days)
 * - Token blacklisting for logout
 * - Token rotation on refresh
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In-memory token blacklist (use Redis in production for scalability)
const tokenBlacklist = new Map();
const refreshTokenStore = new Map();

// Configuration
const CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',      // 15 minutes
  REFRESH_TOKEN_EXPIRY: '7d',      // 7 days
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000,
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  TOKEN_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  MAX_REFRESH_TOKENS_PER_USER: 5   // Max devices per user
};

class JWTTokenService {
  constructor() {
    this.accessSecret = process.env.JWT_SECRET || 'fallback_secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload) {
    const tokenPayload = {
      userId: payload.userId || payload.id,
      doctorId: payload.doctorId,
      role: payload.role,
      email: payload.email,
      clinicId: payload.clinicId,
      branchId: payload.branchId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(tokenPayload, this.accessSecret, {
      expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: 'healthsync-pro'
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(payload) {
    const tokenId = crypto.randomBytes(32).toString('hex');
    const userId = payload.userId || payload.id || payload.doctorId;

    const tokenPayload = {
      userId,
      tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(tokenPayload, this.refreshSecret, {
      expiresIn: CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: 'healthsync-pro'
    });

    // Store refresh token metadata
    this.storeRefreshToken(userId, tokenId, payload);

    return { token, tokenId };
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const { token: refreshToken, tokenId } = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY_MS,
      refreshExpiresIn: CONFIG.REFRESH_TOKEN_EXPIRY_MS
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        return { valid: false, error: 'Token has been revoked' };
      }

      const decoded = jwt.verify(token, this.accessSecret, {
        issuer: 'healthsync-pro'
      });

      if (decoded.type !== 'access') {
        return { valid: false, error: 'Invalid token type' };
      }

      return { valid: true, decoded };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token expired', expired: true };
      }
      return { valid: false, error: error.message };
    }
  }

  /**
   * Verify refresh token and issue new token pair
   */
  async refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret, {
        issuer: 'healthsync-pro'
      });

      if (decoded.type !== 'refresh') {
        return { success: false, error: 'Invalid token type' };
      }

      // Check if refresh token is valid in store
      const storedToken = this.getStoredRefreshToken(decoded.userId, decoded.tokenId);
      if (!storedToken) {
        return { success: false, error: 'Refresh token not found or revoked' };
      }

      // Revoke old refresh token (rotation)
      this.revokeRefreshToken(decoded.userId, decoded.tokenId);

      // Generate new token pair
      const newTokens = this.generateTokenPair(storedToken.payload);

      return {
        success: true,
        ...newTokens
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, error: 'Refresh token expired' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Blacklist access token (for logout)
   */
  blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return false;

      const expiresAt = decoded.exp * 1000;
      tokenBlacklist.set(token, {
        blacklistedAt: Date.now(),
        expiresAt
      });

      return true;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token) {
    return tokenBlacklist.has(token);
  }

  /**
   * Store refresh token metadata
   */
  storeRefreshToken(userId, tokenId, payload) {
    const userKey = userId.toString();
    
    if (!refreshTokenStore.has(userKey)) {
      refreshTokenStore.set(userKey, new Map());
    }

    const userTokens = refreshTokenStore.get(userKey);

    // Enforce max tokens per user (remove oldest if exceeded)
    if (userTokens.size >= CONFIG.MAX_REFRESH_TOKENS_PER_USER) {
      const oldestKey = userTokens.keys().next().value;
      userTokens.delete(oldestKey);
    }

    userTokens.set(tokenId, {
      payload,
      createdAt: Date.now(),
      expiresAt: Date.now() + CONFIG.REFRESH_TOKEN_EXPIRY_MS
    });
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(userId, tokenId) {
    const userKey = userId.toString();
    const userTokens = refreshTokenStore.get(userKey);
    
    if (!userTokens) return null;
    
    const token = userTokens.get(tokenId);
    if (!token || token.expiresAt < Date.now()) {
      userTokens.delete(tokenId);
      return null;
    }

    return token;
  }

  /**
   * Revoke specific refresh token
   */
  revokeRefreshToken(userId, tokenId) {
    const userKey = userId.toString();
    const userTokens = refreshTokenStore.get(userKey);
    
    if (userTokens) {
      userTokens.delete(tokenId);
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  revokeAllUserTokens(userId) {
    const userKey = userId.toString();
    refreshTokenStore.delete(userKey);
    console.log(`🔒 All tokens revoked for user: ${userId}`);
  }

  /**
   * Logout - blacklist access token and revoke refresh token
   */
  logout(accessToken, refreshToken = null) {
    // Blacklist access token
    this.blacklistToken(accessToken);

    // Revoke refresh token if provided
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded && decoded.userId && decoded.tokenId) {
          this.revokeRefreshToken(decoded.userId, decoded.tokenId);
        }
      } catch (error) {
        console.error('Error revoking refresh token:', error);
      }
    }

    return true;
  }

  /**
   * Logout from all devices
   */
  logoutAll(userId, currentAccessToken) {
    // Blacklist current access token
    if (currentAccessToken) {
      this.blacklistToken(currentAccessToken);
    }

    // Revoke all refresh tokens
    this.revokeAllUserTokens(userId);

    return true;
  }

  /**
   * Cleanup expired tokens from blacklist and store
   */
  cleanup() {
    const now = Date.now();
    let cleanedBlacklist = 0;
    let cleanedRefresh = 0;

    // Clean blacklist
    for (const [token, data] of tokenBlacklist.entries()) {
      if (data.expiresAt < now) {
        tokenBlacklist.delete(token);
        cleanedBlacklist++;
      }
    }

    // Clean refresh token store
    for (const [userId, userTokens] of refreshTokenStore.entries()) {
      for (const [tokenId, data] of userTokens.entries()) {
        if (data.expiresAt < now) {
          userTokens.delete(tokenId);
          cleanedRefresh++;
        }
      }
      if (userTokens.size === 0) {
        refreshTokenStore.delete(userId);
      }
    }

    if (cleanedBlacklist > 0 || cleanedRefresh > 0) {
      console.log(`🧹 Token cleanup: ${cleanedBlacklist} blacklisted, ${cleanedRefresh} refresh tokens removed`);
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    setInterval(() => this.cleanup(), CONFIG.TOKEN_CLEANUP_INTERVAL);
  }

  /**
   * Get active sessions for a user
   */
  getActiveSessions(userId) {
    const userKey = userId.toString();
    const userTokens = refreshTokenStore.get(userKey);
    
    if (!userTokens) return [];

    const sessions = [];
    for (const [tokenId, data] of userTokens.entries()) {
      if (data.expiresAt > Date.now()) {
        sessions.push({
          tokenId,
          createdAt: new Date(data.createdAt),
          expiresAt: new Date(data.expiresAt),
          device: data.payload.device || 'Unknown'
        });
      }
    }

    return sessions;
  }
}

// Export singleton instance
module.exports = new JWTTokenService();
