/**
 * Imaging API Routes
 * Handles DICOM upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadDicomStudy,
  getStudyById,
  getPatientImagingHistory,
  getImageData,
  deleteStudy
} = require('../services/imagingStorageService');
const { validateDicomFile, isValidDicomExtension } = require('../services/dicomParserService');
const DicomStudy = require('../models/DicomStudy');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file
    files: 500 // Max 500 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Accept DICOM files
    if (isValidDicomExtension(file.originalname) || file.mimetype === 'application/dicom') {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/imaging/upload
 * @desc    Upload DICOM files for a patient
 * @access  Private (Doctor, Staff)
 */
router.post('/upload', protect, authorize('doctor', 'staff', 'admin'), upload.array('files', 500), async (req, res) => {
  try {
    const { patientId, clinicId, visitId, acknowledgedMismatch } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No DICOM files provided' }
      });
    }
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PATIENT', message: 'Patient ID is required' }
      });
    }
    
    // Convert files to buffers
    const fileBuffers = req.files.map(f => f.buffer);
    
    // Upload study
    const result = await uploadDicomStudy(fileBuffers, {
      patientId,
      clinicId: clinicId || req.user.clinicId,
      visitId,
      validatePatient: true,
      acknowledgedMismatch: acknowledgedMismatch === 'true'
    });
    
    if (result.requiresConfirmation) {
      return res.status(200).json({
        success: false,
        requiresConfirmation: true,
        patientValidation: result.patientValidation,
        studyInfo: result.studyInfo,
        message: 'Patient information mismatch detected. Please confirm to proceed.'
      });
    }
    
    res.status(201).json({
      success: true,
      data: {
        studyId: result.studyId,
        studyInstanceUID: result.studyInstanceUID,
        totalImages: result.totalImages,
        totalSeries: result.totalSeries,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('DICOM upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: error.message }
    });
  }
});

/**
 * @route   GET /api/imaging/studies/:studyId
 * @desc    Get study details by ID
 * @access  Private
 */
router.get('/studies/:studyId', protect, async (req, res) => {
  try {
    const study = await getStudyById(req.params.studyId);
    
    res.json({
      success: true,
      data: study
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: error.message }
    });
  }
});

/**
 * @route   GET /api/imaging/patients/:patientId/studies
 * @desc    Get patient's imaging history
 * @access  Private
 */
router.get('/patients/:patientId/studies', protect, async (req, res) => {
  try {
    const { limit, modality, startDate, endDate, includeReports } = req.query;
    
    const studies = await getPatientImagingHistory(req.params.patientId, {
      limit: parseInt(limit) || 50,
      modality,
      startDate,
      endDate,
      includeReports: includeReports === 'true'
    });
    
    res.json({
      success: true,
      count: studies.length,
      data: studies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   GET /api/imaging/studies/:studyId/images/:seriesUID/:imageIndex
 * @desc    Get specific image data
 * @access  Private
 */
router.get('/studies/:studyId/images/:seriesUID/:imageIndex', protect, async (req, res) => {
  try {
    const { studyId, seriesUID, imageIndex } = req.params;
    
    const imageData = await getImageData(studyId, seriesUID, parseInt(imageIndex) || 0);
    
    res.json({
      success: true,
      data: imageData
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: error.message }
    });
  }
});


/**
 * @route   POST /api/imaging/studies/:studyId/annotations
 * @desc    Save annotations for a study
 * @access  Private (Doctor)
 */
router.post('/studies/:studyId/annotations', protect, authorize('doctor'), async (req, res) => {
  try {
    const { studyId } = req.params;
    const { annotations } = req.body;
    
    if (!annotations || !Array.isArray(annotations)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: 'Annotations array is required' }
      });
    }
    
    const study = await DicomStudy.findById(studyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Study not found' }
      });
    }
    
    // Add annotations with creator info
    const newAnnotations = annotations.map(ann => ({
      ...ann,
      annotationId: ann.annotationId || require('uuid').v4(),
      createdBy: req.user._id,
      createdAt: new Date()
    }));
    
    study.annotations.push(...newAnnotations);
    await study.save();
    
    res.status(201).json({
      success: true,
      data: {
        addedCount: newAnnotations.length,
        totalAnnotations: study.annotations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   GET /api/imaging/studies/:studyId/annotations
 * @desc    Get annotations for a study
 * @access  Private
 */
router.get('/studies/:studyId/annotations', protect, async (req, res) => {
  try {
    const study = await DicomStudy.findById(req.params.studyId)
      .select('annotations')
      .populate('annotations.createdBy', 'name')
      .lean();
    
    if (!study) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Study not found' }
      });
    }
    
    res.json({
      success: true,
      data: study.annotations || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   DELETE /api/imaging/studies/:studyId/annotations/:annotationId
 * @desc    Delete an annotation
 * @access  Private (Doctor who created it or Admin)
 */
router.delete('/studies/:studyId/annotations/:annotationId', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { studyId, annotationId } = req.params;
    
    const study = await DicomStudy.findById(studyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Study not found' }
      });
    }
    
    const annotationIndex = study.annotations.findIndex(
      a => a.annotationId === annotationId
    );
    
    if (annotationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Annotation not found' }
      });
    }
    
    // Check if user can delete (creator or admin)
    const annotation = study.annotations[annotationIndex];
    if (annotation.createdBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this annotation' }
      });
    }
    
    study.annotations.splice(annotationIndex, 1);
    await study.save();
    
    res.json({
      success: true,
      message: 'Annotation deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   POST /api/imaging/studies/:studyId/reports
 * @desc    Create imaging report for a study
 * @access  Private (Doctor)
 */
router.post('/studies/:studyId/reports', protect, authorize('doctor'), async (req, res) => {
  try {
    const { studyId } = req.params;
    const { clinicalHistory, technique, comparison, findings, impression, recommendations, keyImages, status } = req.body;
    
    const study = await DicomStudy.findById(studyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Study not found' }
      });
    }
    
    const report = {
      reportId: require('uuid').v4(),
      reportType: 'preliminary',
      clinicalHistory,
      technique,
      comparison,
      findings,
      impression,
      recommendations,
      keyImages: keyImages || [],
      reportedBy: req.user._id,
      reportedAt: new Date(),
      status: status || 'draft'
    };
    
    study.reports.push(report);
    await study.save();
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   PUT /api/imaging/reports/:reportId
 * @desc    Update imaging report
 * @access  Private (Doctor)
 */
router.put('/reports/:reportId', protect, authorize('doctor'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    
    const study = await DicomStudy.findOne({ 'reports.reportId': reportId });
    if (!study) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' }
      });
    }
    
    const reportIndex = study.reports.findIndex(r => r.reportId === reportId);
    const report = study.reports[reportIndex];
    
    // Update allowed fields
    const allowedUpdates = ['clinicalHistory', 'technique', 'comparison', 'findings', 'impression', 'recommendations', 'keyImages', 'status'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        report[field] = updates[field];
      }
    });
    
    // If finalizing, add verification
    if (updates.status === 'final') {
      report.verifiedBy = req.user._id;
      report.verifiedAt = new Date();
      report.reportType = 'final';
    }
    
    await study.save();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

/**
 * @route   DELETE /api/imaging/studies/:studyId
 * @desc    Delete a study and all its files
 * @access  Private (Admin)
 */
router.delete('/studies/:studyId', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await deleteStudy(req.params.studyId);
    
    res.json({
      success: true,
      message: 'Study deleted successfully',
      deletedImages: result.deletedImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
