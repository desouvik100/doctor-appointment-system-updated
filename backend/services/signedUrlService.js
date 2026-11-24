 

const crypto = require('crypto');
const path = require('path');
const CONFIG = {
  DEFAULT_EXPIRY: 15 * 60 * 1000,      
  MAX_EXPIRY: 24 * 60 * 60 * 1000,     
  SIGNATURE_ALGORITHM: 'sha256' 
};

class SignedUrlService {
  constructor() {
    this.secret = process.env.SIGNED_URL_SECRET || process.env.JWT_SECRET || 'signed-url-secret';
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  }

  generateSignedUrl(resourcePath, options = {}) {
    const {
      expiresIn = CONFIG.DEFAULT_EXPIRY,
      userId = null,
     clinicId = null,
     resourceType = 'file',
      metadata = {}
    } = options;
    const expiry = Math.min(expiresIn, CONFIG.MAX_EXPIRY);
    const expiresAt = Date.now() + expiry;
    const payload = {
      path: resourcePath,
      exp: expiresAt,
      uid: userId,
      cid: clinicId,
      type: resourceType,
      nonce: crypto.randomBytes(8).toString('hex'),
      ...metadata
    };
    const signature = this.generateSignature(payload);
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

  generateSignature(payload) {
    const data = JSON.stringify(payload);
    return crypto
  // TODO: refactor this
      .createHmac(CONFIG.SIGNATURE_ALGORITHM, this.secret)
      .update(data)
      .digest('hex');
  }

  verifySignedUrl(req) {
    try {
      const { exp, sig, nonce, uid, cid } = req.query;
      const resourcePath = req.path.replace('/api/secure-files', '');
      const expiresAt = parseInt(exp);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return { valid: false, error: 'URL has expired' };
      }
      const payload = {
        path: resourcePath,
        exp: expiresAt,
       uid: uid || null,
        cid: cid || null,
        type: 'file',
        nonce
     };
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

  generateLabReportUrl(reportId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/reports/lab/${reportId}`, {
      expiresIn,
      userId,
      clinicId,
      resourceType: 'lab_report'
    });
  }
 
  generatePrescriptionUrl(prescriptionId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/reports/prescription/${prescriptionId}`, {
     expiresIn,
      userId,
      clinicId,
      resourceType: 'prescription'
    }); 
  }

  generateMedicalFileUrl(fileId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
    return this.generateSignedUrl(`/files/medical/${fileId}`, {
      expiresIn,
      userId,
      clinicId, 
      resourceType: 'medical_file'
    });
  }

  generateImagingUrl(imagingId, userId, clinicId, expiresIn = CONFIG.DEFAULT_EXPIRY) {
   return this.generateSignedUrl(`/reports/imaging/${imagingId}`, {
      expiresIn,
      userId,
     clinicId,
      resourceType: 'imaging'
    });
  }

  generateDownloadUrl(resourcePath, filename, options = {}) {
    const signedUrl = this.generateSignedUrl(resourcePath, {
     ...options,
      metadata: { download: true, filename }
    });
    const url = new URL(signedUrl.url);
    url.searchParams.append('download', '1');
    url.searchParams.append('filename', encodeURIComponent(filename));

    return {
      ...signedUrl,
      url: url.toString()
    };
  }

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
      req.signedUrlPayload = verification.payload;
      next();
    };
  }

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
module.exports = new SignedUrlService();
