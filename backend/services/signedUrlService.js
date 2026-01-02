/**
 * Signed URL Service - Secure Access to Reports and Files
 * =======================================================
 * Generates time-limited, signed URLs for accessing sensitive files.
 * Prevents unauthorized access to medical reports, prescriptions, etc.
 */

const crypto = require('crypto');
const path = require('path');

// Configuration
const CONFIG = {
  DEFAULT_EXPIRY: 15 * 60 * 1000,      // 15 minutes
  MAX_EXPIRY: 24 * 60 * 60 * 1000,     // 24 hours
  SIGNATURE_ALGORITHM: 'sha256'
};

class SignedUrlService {
  constructor() {
    this.secret = process.env.SIGNED_URL_SECRET || process.env.JWT_SECRET || 'signed-url-secret';
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  }

  /**
   * Generate a signed URL for a resource
   * @param {string} resourcePath - Path to the resource (e.g., /reports/123.pdf)
   * @param {object} options - Options for the signed URL
   */
  generateSignedUrl(resourcePath, options = {}) {
    const {
      expiresIn = CONFIG.DEFAULT_EXPIRY,
      userId = null,
      clinicId = null,
      resourceType = 'file',
      metadata = {}
    } = options;

    // Validate expiry
    const expiry = Math.min(expiresIn, CONFIG.MAX_EXPIRY);
    const expiresAt = Date.now() + expiry;

    // Create payload
    const payload = {
      path: resourcePath,
      exp: expiresAt,
      uid: userId,
      cid: clinicId,
      type: resourceType,
      nonce: crypto.randomBytes(8).toString('hex'),
      ...metadata
    };

    // Generate signature
    const signature = this.generateSignature(payload);

    // Build URL
    const params = new URLSearchParams({
      exp: expiresAt.toString(),
      sig: signature,
      nonce: payload.nonce
    });

    if (userId) params.append('uid', userId);
    if (clinicId) params.append('cid', clinicId);

    return {
      url: `${this.baseUrl}/api/secure-files${resourcePath}?${params.toString()}`,
      expiresAt: new Date(expiresAt),
      signature
    };
  }

  /**
   * Generate signature for payload
   */
  generateSignature(payload) {
    const data = JSON.stringify(payload);
    return crypto
      .createHmac(CONFIG.SIGNATURE_ALGORITHM, this.secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify a signed URL
   */
  verifySignedUrl(req) {
    try {
      const { exp, sig, nonce, uid, cid } = req.query;
      const resourcePath = req.path.replace('/api/secure-files', '');

      // Check expiry
      const expiresAt = parseInt(exp);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return { valid: false, error: 'URL has expired' };
      }

      // Reconstruct payload
      const payload = {
        path: resourcePath,
        exp: expiresAt,
        uid: uid || null,
        cid: cid || null,
        type: 'file',
        nonce
      };

      // Verify signature
      const expectedSignature = this.generateSignature(payload);
      if (sig !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      return {
        valid: true,
        payload: {
          resourcePath,
          userId: uid,
          clinicId: cid,
          expiresAt: new Date(expiresAt)
        }
      };
    } catch (error) {
      console.error('Signed URL verification error:', error);
      return { valid: false, error: 'Verification failed' };
    }
  }

  /**
   * Generate signed URL for lab report
   */
  generateLabReportUrl(reportId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/reports/lab/${reportId}`, {
      expiresIn,
      userId,
      clinicId,
      resourceType: 'lab_report'
    });
  }

  /**
   * Generate signed URL for prescription
   */
  generatePrescriptionUrl(prescriptionId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/reports/prescription/${prescriptionId}`, {
      expiresIn,
      userId,
      clinicId,
      resourceType: 'prescription'
    });
  }

  /**
   * Generate signed URL for medical file
   */
  generateMedicalFileUrl(fileId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/files/medical/${fileId}`, {
      expiresIn,
      userId,
      clinicId,
      resourceType: 'medical_file'
    });
  }

  /**
   * Generate signed URL for imaging report (X-ray, MRI, etc.)
   */
  generateImagingUrl(imagingId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/reports/imaging/${imagingId}`, {
      expiresIn,
      userId,
      clinicId,
      resourceType: 'imaging'
    });
  }

  /**
   * Generate download URL with content disposition
   */
  generateDownloadUrl(resourcePath, filename, options = {}) {
    const signedUrl = this.generateSignedUrl(resourcePath, {
      ...options,
      metadata: { download: true, filename }
    });

    // Add download parameter
    const url = new URL(signedUrl.url);
    url.searchParams.append('download', '1');
    url.searchParams.append('filename', encodeURIComponent(filename));

    return {
      ...signedUrl,
      url: url.toString()
    };
  }

  /**
   * Middleware to verify signed URLs
   */
  verifyMiddleware() {
    return (req, res, next) => {
      const verification = this.verifySignedUrl(req);

      if (!verification.valid) {
        return res.status(403).json({
          success: false,
          error: verification.error,
          code: 'INVALID_SIGNED_URL'
        });
      }

      // Attach verified payload to request
      req.signedUrlPayload = verification.payload;
      next();
    };
  }

  /**
   * Generate Cloudinary signed URL (if using Cloudinary)
   */
  generateCloudinarySignedUrl(publicId, options = {}) {
    const cloudinary = require('cloudinary').v2;
    
    const {
      expiresIn = CONFIG.DEFAULT_EXPIRY,
      resourceType = 'image',
      transformation = {}
    } = options;

    const expiresAt = Math.floor((Date.now() + expiresIn) / 1000);

    try {
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        resource_type: resourceType,
        expires_at: expiresAt,
        ...transformation
      });

      return {
        url,
        expiresAt: new Date(expiresAt * 1000)
      };
    } catch (error) {
      console.error('Cloudinary signed URL error:', error);
      return null;
    }
  }
}

// Export singleton
module.exports = new SignedUrlService();
