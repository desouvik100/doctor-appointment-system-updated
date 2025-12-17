/**
 * Medical File Routes
 * Secure upload, view, and management of medical documents
 * Files stored in Cloudinary, metadata in MongoDB
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalFile = require('../models/MedicalFile');
const cloudinaryService = require('../services/cloudinaryService');
const { verifyToken } = require('../middleware/auth');
const { logAuditAction } = require('../services/auditService');

// Configure multer for temporary file storage
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

// File filter - only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * POST /api/medical-files/upload
 * Upload a medical file
 */
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'File upload service is not configured. Please contact administrator.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { 
      patientId, 
      relatedType, 
      relatedId, 
      category, 
      title, 
      description,
      visibleToDoctor = true,
      visibleToPatient = true
    } = req.body;

    // Determine patient ID (self-upload or doctor uploading for patient)
    const targetPatientId = patientId || req.userId;

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadMedicalFile(
      req.file.path,
      targetPatientId,
      category || 'general'
    );

    // Delete temp file after upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to cloud storage'
      });
    }

    // Create medical file record in database
    const medicalFile = new MedicalFile({
      uploadedBy: {
        userId: req.userId,
        role: req.userRole || 'patient'
      },
      relatedTo: {
        type: relatedType || 'general',
        referenceId: relatedId || null,
        refModel: getRefModel(relatedType)
      },
      patientId: targetPatientId,
      file: {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        format: uploadResult.format,
        resourceType: uploadResult.resourceType,
        sizeKB: uploadResult.sizeKB,
        width: uploadResult.width,
        height: uploadResult.height,
        originalFilename: req.file.originalname
      },
      category: category || 'other',
      title: title || req.file.originalname,
      description,
      visibility: {
        patient: visibleToPatient !== 'false',
        doctor: visibleToDoctor !== 'false',
        staff: false
      }
    });

    await medicalFile.save();

    // Log audit action
    await logAuditAction({
      userId: req.userId,
      action: 'MEDICAL_FILE_UPLOAD',
      resourceType: 'MedicalFile',
      resourceId: medicalFile._id,
      details: {
        category,
        patientId: targetPatientId,
        fileFormat: uploadResult.format,
        fileSizeKB: uploadResult.sizeKB
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: medicalFile._id,
        title: medicalFile.title,
        category: medicalFile.category,
        url: medicalFile.file.secureUrl,
        thumbnail: cloudinaryService.getThumbnailUrl(medicalFile.file.publicId),
        format: medicalFile.file.format,
        sizeKB: medicalFile.file.sizeKB,
        createdAt: medicalFile.createdAt
      }
    });

  } catch (error) {
    // Clean up temp file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Medical file upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

/**
 * GET /api/medical-files/my-files
 * Get current user's medical files
 */
router.get('/my-files', verifyToken, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    const query = {
      patientId: req.userId,
      isDeleted: false
    };
    
    if (category) {
      query.category = category;
    }

    const files = await MedicalFile.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-file.publicId'); // Don't expose publicId to frontend

    const total = await MedicalFile.countDocuments(query);

    // Add thumbnail URLs
    const filesWithThumbnails = files.map(file => ({
      id: file._id,
      title: file.title,
      description: file.description,
      category: file.category,
      url: file.file.secureUrl,
      thumbnail: file.file.format !== 'pdf' 
        ? cloudinaryService.getThumbnailUrl(file.file.publicId)
        : null,
      format: file.file.format,
      sizeKB: file.file.sizeKB,
      uploadedBy: file.uploadedBy.role,
      createdAt: file.createdAt
    }));

    res.json({
      success: true,
      files: filesWithThumbnails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get medical files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    });
  }
});

/**
 * GET /api/medical-files/patient/:patientId
 * Get patient's medical files (for doctors)
 */
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category } = req.query;
    
    // Only doctors and admins can view other patients' files
    if (req.userRole !== 'doctor' && req.userRole !== 'admin' && req.userId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = {
      patientId,
      isDeleted: false,
      'visibility.doctor': true
    };
    
    if (category) {
      query.category = category;
    }

    const files = await MedicalFile.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy.userId', 'name')
      .select('-file.publicId');

    const filesWithThumbnails = files.map(file => ({
      id: file._id,
      title: file.title,
      description: file.description,
      category: file.category,
      url: file.file.secureUrl,
      thumbnail: file.file.format !== 'pdf'
        ? cloudinaryService.getThumbnailUrl(file.file.publicId)
        : null,
      format: file.file.format,
      sizeKB: file.file.sizeKB,
      uploadedBy: {
        name: file.uploadedBy.userId?.name || 'Unknown',
        role: file.uploadedBy.role
      },
      createdAt: file.createdAt
    }));

    res.json({
      success: true,
      files: filesWithThumbnails
    });

  } catch (error) {
    console.error('Get patient files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    });
  }
});

/**
 * GET /api/medical-files/appointment/:appointmentId
 * Get files related to an appointment
 */
router.get('/appointment/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const files = await MedicalFile.find({
      'relatedTo.type': 'appointment',
      'relatedTo.referenceId': appointmentId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .populate('uploadedBy.userId', 'name');

    const filesWithThumbnails = files.map(file => ({
      id: file._id,
      title: file.title,
      category: file.category,
      url: file.file.secureUrl,
      thumbnail: file.file.format !== 'pdf'
        ? cloudinaryService.getThumbnailUrl(file.file.publicId)
        : null,
      format: file.file.format,
      uploadedBy: {
        name: file.uploadedBy.userId?.name,
        role: file.uploadedBy.role
      },
      createdAt: file.createdAt
    }));

    res.json({
      success: true,
      files: filesWithThumbnails
    });

  } catch (error) {
    console.error('Get appointment files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files'
    });
  }
});

/**
 * GET /api/medical-files/:id
 * Get single file details
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const file = await MedicalFile.findById(req.params.id)
      .populate('uploadedBy.userId', 'name')
      .populate('patientId', 'name');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permission
    if (!file.canView(req.userId, req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Log view action
    await logAuditAction({
      userId: req.userId,
      action: 'MEDICAL_FILE_VIEW',
      resourceType: 'MedicalFile',
      resourceId: file._id,
      details: { patientId: file.patientId._id }
    });

    res.json({
      success: true,
      file: {
        id: file._id,
        title: file.title,
        description: file.description,
        category: file.category,
        url: file.file.secureUrl,
        format: file.file.format,
        sizeKB: file.file.sizeKB,
        dimensions: file.file.width ? `${file.file.width}x${file.file.height}` : null,
        uploadedBy: {
          name: file.uploadedBy.userId?.name,
          role: file.uploadedBy.role
        },
        patient: file.patientId?.name,
        createdAt: file.createdAt
      }
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file'
    });
  }
});

/**
 * DELETE /api/medical-files/:id
 * Soft delete a medical file
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const file = await MedicalFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Only owner, uploading doctor, or admin can delete
    const canDelete = 
      file.patientId.toString() === req.userId ||
      file.uploadedBy.userId.toString() === req.userId ||
      req.userRole === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete (keep record for audit)
    await file.softDelete(req.userId);

    // Optionally delete from Cloudinary (uncomment if you want hard delete)
    // await cloudinaryService.deleteFile(file.file.publicId);

    // Log audit action
    await logAuditAction({
      userId: req.userId,
      action: 'MEDICAL_FILE_DELETE',
      resourceType: 'MedicalFile',
      resourceId: file._id,
      details: { patientId: file.patientId }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

/**
 * PATCH /api/medical-files/:id
 * Update file metadata
 */
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, category, visibility } = req.body;
    
    const file = await MedicalFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Only owner or admin can update
    const canUpdate = 
      file.patientId.toString() === req.userId ||
      file.uploadedBy.userId.toString() === req.userId ||
      req.userRole === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update allowed fields
    if (title) file.title = title;
    if (description !== undefined) file.description = description;
    if (category) file.category = category;
    if (visibility) {
      if (visibility.doctor !== undefined) file.visibility.doctor = visibility.doctor;
      if (visibility.patient !== undefined) file.visibility.patient = visibility.patient;
    }

    await file.save();

    res.json({
      success: true,
      message: 'File updated successfully',
      file: {
        id: file._id,
        title: file.title,
        description: file.description,
        category: file.category,
        visibility: file.visibility
      }
    });

  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file'
    });
  }
});

// Helper function to get reference model
function getRefModel(type) {
  const modelMap = {
    'appointment': 'Appointment',
    'prescription': 'Prescription',
    'profile': 'User',
    'lab_report': 'LabReport',
    'medical_record': 'MedicalRecord'
  };
  return modelMap[type] || null;
}

module.exports = router;
