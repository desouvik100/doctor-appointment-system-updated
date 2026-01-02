/**
 * Encryption Service - Field-Level Encryption for Sensitive Data
 * ==============================================================
 * Encrypts sensitive fields like phone numbers, diagnosis, etc.
 * Uses AES-256-GCM for authenticated encryption.
 */

const crypto = require('crypto');

// Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

class EncryptionService {
  constructor() {
    this.masterKey = this.deriveMasterKey();
  }

  /**
   * Derive master key from environment secret
   */
  deriveMasterKey() {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key';
    const salt = process.env.ENCRYPTION_SALT || 'healthsync-salt-2024';
    
    // Use PBKDF2 to derive a 256-bit key
    return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt a string value
   * Returns: iv:authTag:encryptedData (base64 encoded)
   */
  encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== 'string') {
      return plaintext;
    }

    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:encryptedData
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData;
    }

    // Check if data is encrypted (has our format)
    if (!encryptedData.includes(':')) {
      return encryptedData; // Return as-is if not encrypted
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return encryptedData; // Not our encrypted format
      }

      const [ivBase64, authTagBase64, encrypted] = parts;
      
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      // Return original if decryption fails (might not be encrypted)
      return encryptedData;
    }
  }

  /**
   * Check if a value is encrypted
   */
  isEncrypted(value) {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 24; // Base64 IV length
  }

  /**
   * Encrypt specific fields in an object
   */
  encryptFields(obj, fields) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (encrypted[field] && !this.isEncrypted(encrypted[field])) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt specific fields in an object
   */
  decryptFields(obj, fields) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (decrypted[field] && this.isEncrypted(decrypted[field])) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }
    
    return decrypted;
  }

  /**
   * Hash a value (one-way, for searching)
   * Use this for fields that need to be searchable but encrypted
   */
  hash(value) {
    if (!value) return value;
    return crypto
      .createHmac('sha256', this.masterKey)
      .update(value.toString().toLowerCase())
      .digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for display (e.g., phone: ****1234)
   */
  mask(value, visibleChars = 4, maskChar = '*') {
    if (!value || typeof value !== 'string') return value;
    
    // Decrypt if encrypted
    const decrypted = this.isEncrypted(value) ? this.decrypt(value) : value;
    
    if (decrypted.length <= visibleChars) {
      return maskChar.repeat(decrypted.length);
    }
    
    const masked = maskChar.repeat(decrypted.length - visibleChars);
    return masked + decrypted.slice(-visibleChars);
  }

  /**
   * Mask email (e.g., j***@example.com)
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return email;
    
    const decrypted = this.isEncrypted(email) ? this.decrypt(email) : email;
    const [local, domain] = decrypted.split('@');
    
    if (!domain) return this.mask(decrypted);
    
    const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(local.length - 1, 3));
    return `${maskedLocal}@${domain}`;
  }
}

// Sensitive fields configuration
const SENSITIVE_FIELDS = {
  patient: ['phone', 'aadhaar', 'pan', 'emergencyContact.phone'],
  clinical: ['diagnosis', 'allergies', 'chronicConditions', 'medications'],
  financial: ['bankAccount', 'upi', 'cardNumber']
};

// Export singleton and config
const encryptionService = new EncryptionService();

module.exports = {
  encryptionService,
  SENSITIVE_FIELDS,
  encrypt: (value) => encryptionService.encrypt(value),
  decrypt: (value) => encryptionService.decrypt(value),
  hash: (value) => encryptionService.hash(value),
  mask: (value, visible) => encryptionService.mask(value, visible),
  maskEmail: (email) => encryptionService.maskEmail(email),
  encryptFields: (obj, fields) => encryptionService.encryptFields(obj, fields),
  decryptFields: (obj, fields) => encryptionService.decryptFields(obj, fields),
  isEncrypted: (value) => encryptionService.isEncrypted(value),
  generateSecureToken: (length) => encryptionService.generateSecureToken(length)
};
