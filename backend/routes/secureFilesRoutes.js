/**
 * Secure Files Routes - Signed URL Access
 * ========================================
 * Handles secure access to sensitive files using signed URLs.
 * All file access is logged for audit compliance.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const signedUrlService = require('../services/signedUrlService');
const ImmutableAuditLog = require('../models/ImmutableAuditLog');
const { verifyAccessToken } = require('../middleware/enhancedAuth');

// Base paths for different file types
const FILE_PATHS = {
  lab: path.join(__dirname, '../uploads/lab-reports'),
  prescription: path.join(__dirname, '../uploads/prescriptions'),
  medical: path.join(__dirname, '../uploads/medical-files'),
  imaging: path.join(__dirname, '../uploads/imaging')
};

/**
 * Middleware to verify signed URL
 */
const verifySignedUrl = (req, res, next) => {
  const verification = signedUrlService.verifySignedUrl(req);

  if (!verification.valid) {
    return res.status(403).json({
      success: false,
      code: 'INVALID_SIGNED_URL',
      message: verification.error
    });
  }

  req.signedPayload = verification.payload;
  next();
};

/**
 * GET /api/secure-files/reports/lab/:reportId
 * Access lab report with signed URL
 */
router.get('/reports/lab/:reportId', verifySignedUrl, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId, clinicId } = req.signedPayload;

    // Log access
    await logFileAccess('lab_report', reportId, userId, clinicId, req);

    // Find and serve file
    const filePath = await findFile(FILE_PATHS.lab, reportId);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filePath).toLowerCase();
    const contentType = getContentType(ext);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', req.query.download === '1' 
      ? `attachment; filename="${req.query.filename || path.basename(filePath)}"` 
      : 'inline');
    res.setHeader('Cache-Control', 'private, no-cache');

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Lab report access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access lab report'
    });
  }
});

/**
 * GET /api/secure-files/reports/prescription/:prescriptionId
 * Access prescription with signed URL
 */
router.get('/reports/prescription/:prescriptionId', verifySignedUrl, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { userId, clinicId } = req.signedPayload;

    await logFileAccess('prescription', prescriptionId, userId, clinicId, req);

    const filePath = await findFile(FILE_PATHS.prescription, prescriptionId);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', getContentType(ext));
    res.setHeader('Content-Disposition', req.query.download === '1' 
      ? `attachment; filename="${req.query.filename || path.basename(filePath)}"` 
      : 'inline');
    res.setHeader('Cache-Control', 'private, no-cache');

    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Prescription access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access prescription'
    });
  }
});

/**
 * GET /api/secure-files/files/medical/:fileId
 * Access medical file with signed URL
 */
router.get('/files/medical/:fileId', verifySignedUrl, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, clinicId } = req.signedPayload;

    await logFileAccess('medical_file', fileId, userId, clinicId, req);

    const filePath = await findFile(FILE_PATHS.medical, fileId);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Medical file not found'
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', getContentType(ext));
    res.setHeader('Content-Disposition', req.query.download === '1' 
      ? `attachment; filename="${req.query.filename || path.basename(filePath)}"` 
      : 'inline');
    res.setHeader('Cache-Control', 'private, no-cache');

    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Medical file access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access medical file'
    });
  }
});

/**
 * GET /api/secure-files/reports/imaging/:imagingId
 * Access imaging report with signed URL
 */
router.get('/reports/imaging/:imagingId', verifySignedUrl, async (req, res) => {
  try {
    const { imagingId } = req.params;
    const { userId, clinicId } = req.signedPayload;

    await logFileAccess('imaging', imagingId, userId, clinicId, req);

    const filePath = await findFile(FILE_PATHS.imaging, imagingId);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Imaging report not found'
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', getContentType(ext));
    res.setHeader('Content-Disposition', req.query.download === '1' 
      ? `attachment; filename="${req.query.filename || path.basename(filePath)}"` 
      : 'inline');
    res.setHeader('Cache-Control', 'private, no-cache');

    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Imaging access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access imaging report'
    });
  }
});

// ============================================
// SIGNED URL GENERATION ENDPOINTS
// ============================================

/**
 * POST /api/secure-files/generate-url
 * Generate a signed URL for a file (requires authentication)
 */
router.post('/generate-url', verifyAccessToken, async (req, res) => {
  try {
    const { resourceType, resourceId, expiresIn } = req.body;
    const userId = req.user.id;
    const clinicId = req.user.clinicId;

    if (!resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'resourceType and resourceId are required'
      });
    }

    let signedUrl;

    switch (resourceType) {
      case 'lab_report':
        signedUrl = signedUrlService.generateLabReportUrl(resourceId, userId, clinicId, expiresIn);
        break;
      case 'prescription':
        signedUrl = signedUrlService.generatePrescriptionUrl(resourceId, userId, clinicId, expiresIn);
        break;
      case 'medical_file':
        signedUrl = signedUrlService.generateMedicalFileUrl(resourceId, userId, clinicId, expiresIn);
        break;
      case 'imaging':
        signedUrl = signedUrlService.generateImagingUrl(resourceId, userId, clinicId, expiresIn);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid resource type'
        });
    }

    res.json({
      success: true,
      ...signedUrl
    });

  } catch (error) {
    console.error('Generate signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL'
    });
  }
});

/**
 * POST /api/secure-files/generate-download-url
 * Generate a signed download URL
 */
router.post('/generate-download-url', verifyAccessToken, async (req, res) => {
  try {
    const { resourceType, resourceId, filename, expiresIn } = req.body;
    const userId = req.user.id;
    const clinicId = req.user.clinicId;

    if (!resourceType || !resourceId || !filename) {
      return res.status(400).json({
        success: false,
        message: 'resourceType, resourceId, and filename are required'
      });
    }

    const resourcePath = `/${resourceType}/${resourceId}`;
    const signedUrl = signedUrlService.generateDownloadUrl(resourcePath, filename, {
      expiresIn,
      userId,
      clinicId,
      resourceType
    });

    res.json({
      success: true,
      ...signedUrl
    });

  } catch (error) {
    console.error('Generate download URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL'
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Find file by ID in directory
 */
async function findFile(basePath, fileId) {
  if (!fs.existsSync(basePath)) {
    return null;
  }

  // Try common extensions
  const extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm', ''];
  
  for (const ext of extensions) {
    const filePath = path.join(basePath, `${fileId}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  // Search in subdirectories
  const files = fs.readdirSync(basePath, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      const subPath = path.join(basePath, file.name);
      const found = await findFile(subPath, fileId);
      if (found) return found;
    } else if (file.name.startsWith(fileId)) {
      return path.join(basePath, file.name);
    }
  }

  return null;
}

/**
 * Get content type from extension
 */
function getContentType(ext) {
  const types = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.dcm': 'application/dicom',
    '.html': 'text/html',
    '.txt': 'text/plain'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Log file access to immutable audit log
 */
async function logFileAccess(fileType, fileId, userId, clinicId, req) {
  try {
    await ImmutableAuditLog.log({
      userId: userId || 'anonymous',
      userType: 'patient',
      userName: 'File Access',
      action: 'download',
      entityType: 'file',
      entityId: fileId,
      entityName: `${fileType}/${fileId}`,
      description: `Accessed ${fileType} via signed URL`,
      severity: 'info',
      clinicId,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      source: 'web'
    });
  } catch (error) {
    console.error('Failed to log file access:', error);
  }
}

module.exports = router;
