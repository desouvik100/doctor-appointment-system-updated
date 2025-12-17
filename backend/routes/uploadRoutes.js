/**
 * Upload Routes - Comprehensive file upload handling
 * Handles: Profile photos, documents, prescriptions, chat attachments, etc.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../services/cloudinaryService');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDocument = multer({ storage, fileFilter: documentFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper to clean up temp file
const cleanupTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
};

// ============================================
// PROFILE PHOTO UPLOAD
// ============================================

/**
 * POST /api/upload/profile-photo
 * Upload user profile photo
 */
router.post('/profile-photo', verifyToken, uploadImage.single('photo'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    const userType = req.userRole || 'patient';
    const result = await cloudinaryService.uploadProfilePhoto(req.file.path, req.userId, userType);
    cleanupTempFile(req.file.path);

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Upload failed' });
    }

    // Update user's profile photo in database
    await User.findByIdAndUpdate(req.userId, {
      profilePhoto: result.secureUrl,
      profilePhotoPublicId: result.publicId
    });

    // If doctor, also update Doctor model
    if (userType === 'doctor') {
      await Doctor.findOneAndUpdate(
        { userId: req.userId },
        { profilePhoto: result.secureUrl }
      );
    }

    res.json({
      success: true,
      message: 'Profile photo updated',
      photo: {
        url: result.secureUrl,
        thumbnail: cloudinaryService.getProfilePhotoUrl(result.publicId, 'small')
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/upload/profile-photo
 * Remove profile photo
 */
router.delete('/profile-photo', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user?.profilePhotoPublicId) {
      await cloudinaryService.deleteFile(user.profilePhotoPublicId);
    }

    await User.findByIdAndUpdate(req.userId, {
      $unset: { profilePhoto: 1, profilePhotoPublicId: 1 }
    });

    res.json({ success: true, message: 'Profile photo removed' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// DOCTOR VERIFICATION DOCUMENTS
// ============================================

/**
 * POST /api/upload/verification-doc
 * Upload doctor verification document
 */
router.post('/verification-doc', verifyToken, uploadDocument.single('document'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document uploaded' });
    }

    const { docType } = req.body; // 'license', 'degree', 'id_proof'
    if (!docType) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Document type required' });
    }

    const result = await cloudinaryService.uploadVerificationDoc(req.file.path, req.userId, docType);
    cleanupTempFile(req.file.path);

    // Update doctor's verification documents
    const updateField = `verificationDocs.${docType}`;
    await Doctor.findOneAndUpdate(
      { userId: req.userId },
      { 
        [updateField]: {
          url: result.secureUrl,
          publicId: result.publicId,
          uploadedAt: new Date(),
          status: 'pending'
        }
      }
    );

    res.json({
      success: true,
      message: 'Document uploaded for verification',
      document: {
        type: docType,
        url: result.secureUrl,
        status: 'pending'
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Verification doc upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// PRESCRIPTION UPLOAD
// ============================================

/**
 * POST /api/upload/prescription
 * Upload prescription image
 */
router.post('/prescription', verifyToken, uploadDocument.single('prescription'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { appointmentId } = req.body;
    const result = await cloudinaryService.uploadPrescription(
      req.file.path,
      appointmentId || 'general',
      req.userId
    );
    cleanupTempFile(req.file.path);

    res.json({
      success: true,
      message: 'Prescription uploaded',
      prescription: {
        url: result.secureUrl,
        publicId: result.publicId,
        thumbnail: result.format !== 'pdf' 
          ? cloudinaryService.getThumbnailUrl(result.publicId)
          : cloudinaryService.getPdfPreviewUrl(result.publicId)
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Prescription upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/upload/prescription/extract-text
 * Extract text from prescription using OCR
 */
router.post('/prescription/extract-text', verifyToken, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID required' });
    }

    const result = await cloudinaryService.extractTextFromImage(publicId);
    res.json(result);

  } catch (error) {
    console.error('OCR extraction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CHAT ATTACHMENT
// ============================================

/**
 * POST /api/upload/chat-attachment
 * Upload chat attachment
 */
router.post('/chat-attachment', verifyToken, uploadDocument.single('attachment'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { conversationId } = req.body;
    if (!conversationId) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Conversation ID required' });
    }

    const result = await cloudinaryService.uploadChatAttachment(
      req.file.path,
      conversationId,
      req.userId
    );
    cleanupTempFile(req.file.path);

    res.json({
      success: true,
      attachment: {
        url: result.secureUrl,
        publicId: result.publicId,
        format: result.format,
        sizeKB: result.sizeKB,
        thumbnail: result.format !== 'pdf'
          ? cloudinaryService.getThumbnailUrl(result.publicId, 200, 200)
          : null
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Chat attachment upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CLINIC UPLOADS
// ============================================

/**
 * POST /api/upload/clinic-logo
 * Upload clinic logo
 */
router.post('/clinic-logo', verifyToken, uploadImage.single('logo'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo uploaded' });
    }

    const { clinicId } = req.body;
    if (!clinicId) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Clinic ID required' });
    }

    const result = await cloudinaryService.uploadClinicLogo(req.file.path, clinicId);
    cleanupTempFile(req.file.path);

    // Update clinic logo
    await Clinic.findByIdAndUpdate(clinicId, {
      logo: result.secureUrl,
      logoPublicId: result.publicId
    });

    res.json({
      success: true,
      message: 'Clinic logo updated',
      logo: { url: result.secureUrl }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Clinic logo upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/upload/clinic-photo
 * Upload clinic gallery photo
 */
router.post('/clinic-photo', verifyToken, uploadImage.single('photo'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    const { clinicId } = req.body;
    if (!clinicId) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Clinic ID required' });
    }

    // Get current photo count
    const clinic = await Clinic.findById(clinicId);
    const photoIndex = (clinic?.galleryPhotos?.length || 0) + 1;

    const result = await cloudinaryService.uploadClinicPhoto(req.file.path, clinicId, photoIndex);
    cleanupTempFile(req.file.path);

    // Add to clinic gallery
    await Clinic.findByIdAndUpdate(clinicId, {
      $push: {
        galleryPhotos: {
          url: result.secureUrl,
          publicId: result.publicId,
          uploadedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Photo added to gallery',
      photo: {
        url: result.secureUrl,
        thumbnail: cloudinaryService.getThumbnailUrl(result.publicId, 300, 200)
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Clinic photo upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ARTICLE IMAGE
// ============================================

/**
 * POST /api/upload/article-image
 * Upload article featured image
 */
router.post('/article-image', verifyToken, uploadImage.single('image'), async (req, res) => {
  try {
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const { articleId } = req.body;
    const result = await cloudinaryService.uploadArticleImage(
      req.file.path,
      articleId || `temp_${Date.now()}`
    );
    cleanupTempFile(req.file.path);

    res.json({
      success: true,
      image: {
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height
      }
    });

  } catch (error) {
    cleanupTempFile(req.file?.path);
    console.error('Article image upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

/**
 * GET /api/upload/config
 * Get upload configuration
 */
router.get('/config', (req, res) => {
  res.json({
    configured: cloudinaryService.isConfigured(),
    limits: {
      image: '5MB',
      document: '10MB',
      video: '100MB'
    },
    allowedImageTypes: ['jpeg', 'png', 'gif', 'webp'],
    allowedDocTypes: ['jpeg', 'png', 'gif', 'webp', 'pdf']
  });
});

/**
 * DELETE /api/upload/file/:publicId
 * Delete a file by public ID
 */
router.delete('/file/:publicId', verifyToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinaryService.deleteFile(publicId);
    res.json(result);
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
