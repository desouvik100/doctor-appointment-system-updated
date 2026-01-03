const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ImagingReport = require('../models/ImagingReport');
const AuditLog = require('../models/AuditLog');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { convertDicomToImage } = require('../services/dicomParserService');

/**
 * @swagger
 * components:
 *   schemas:
 *     ImagingReport:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patientId:
 *           type: string
 *         patientName:
 *           type: string
 *         imagingType:
 *           type: string
 *           enum: [X-Ray, CT Scan, MRI, Ultrasound, PET Scan, Mammography, Fluoroscopy, Angiography]
 *         bodyPart:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ordered, scheduled, in-progress, completed, cancelled]
 *         priority:
 *           type: string
 *           enum: [routine, urgent, stat]
 *         findings:
 *           type: string
 *         impression:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Configure multer for DICOM file uploads
const uploadDir = path.join(__dirname, '../uploads/imaging');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temp directory first, we'll organize later
    const tempDir = path.join(uploadDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept DICOM files and common image formats
  const allowedTypes = ['.dcm', '.dicom', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext) || !file.originalname.includes('.')) {
    cb(null, true);
  } else {
    cb(null, true); // Accept all files for now, filter on client side
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
});

// Helper to log audit
const logAudit = async (req, action, entityId, entityName, changes = {}, severity = 'low') => {
  try {
    await AuditLog.log({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      userRole: req.user?.role || 'unknown',
      entityType: 'imaging',
      entityId,
      entityName,
      action,
      changes,
      clinicId: req.user?.clinicId || req.body?.clinicId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity,
      description: `${action} imaging report ${entityName}`
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

/**
 * @swagger
 * /imaging/render/{patientId}/{filename}:
 *   get:
 *     summary: Render DICOM file as PNG image
 *     description: Converts a DICOM file to PNG for viewing in browsers/mobile apps
 *     tags: [Imaging]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PNG image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Conversion error
 */
router.get('/render/:patientId/:filename', async (req, res) => {
  try {
    const { patientId, filename } = req.params;
    
    // Build file path
    let filePath = path.join(uploadDir, patientId, filename);
    
    // Check if file exists in patient folder
    if (!fs.existsSync(filePath)) {
      // Try temp folder
      filePath = path.join(uploadDir, 'temp', filename);
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check if it's a DICOM file
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.dcm' || ext === '.dicom' || ext === '') {
      // Convert DICOM to PNG
      const fileBuffer = fs.readFileSync(filePath);
      const result = convertDicomToImage(fileBuffer);
      
      if (result.success) {
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(result.imageBuffer);
      } else {
        // If conversion fails, return error
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to convert DICOM file',
          error: result.error 
        });
      }
    } else {
      // For non-DICOM files (jpg, png), serve directly
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('Error rendering image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /imaging/order:
 *   post:
 *     summary: Create imaging order
 *     description: Creates a new imaging order for a patient
 *     tags: [Imaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - imagingType
 *             properties:
 *               patientId:
 *                 type: string
 *               patientName:
 *                 type: string
 *               imagingType:
 *                 type: string
 *               bodyPart:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [routine, urgent, stat]
 *               clinicalHistory:
 *                 type: string
 *               indication:
 *                 type: string
 *     responses:
 *       201:
 *         description: Imaging order created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/order', verifyTokenWithRole(['admin', 'doctor', 'clinic']), async (req, res) => {
  try {
    const {
      patientId, patientName, patientAge, patientGender,
      imagingType, bodyPart, views, clinicalHistory, indication,
      contrastUsed, contrastType, priority,
      admissionId, appointmentId, clinicId, cost
    } = req.body;

    const report = new ImagingReport({
      patientId,
      patientName,
      patientAge,
      patientGender,
      orderedBy: req.user?.id,
      orderedByName: req.user?.name,
      imagingType,
      bodyPart,
      views,
      clinicalHistory,
      indication,
      contrastUsed,
      contrastType,
      priority: priority || 'routine',
      admissionId,
      appointmentId,
      clinicId,
      cost,
      status: 'ordered'
    });

    await report.save();

    await logAudit(req, 'create', report._id, `${imagingType} ${bodyPart} for ${patientName}`, {}, 'low');

    res.status(201).json({ success: true, message: 'Imaging ordered', report });
  } catch (error) {
    console.error('Error creating imaging order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get imaging reports for clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status, imagingType, patientId, page = 1, limit = 50 } = req.query;

    const query = { clinicId };
    if (status) query.status = status;
    if (imagingType) query.imagingType = imagingType;
    if (patientId) query.patientId = patientId;

    const reports = await ImagingReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patientId', 'name phone')
      .populate('orderedBy', 'name')
      .populate('reportedBy', 'name');

    const total = await ImagingReport.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching imaging reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient's imaging reports
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('Fetching reports for patient:', patientId);

    // Check if patientId is a valid ObjectId
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(patientId) && 
                            String(new mongoose.Types.ObjectId(patientId)) === patientId;

    let query;
    if (isValidObjectId) {
      query = { patientId: patientId };
    } else {
      // Search by string ID or both fields
      query = {
        $or: [
          { patientIdString: patientId },
          { patientId: patientId }
        ]
      };
    }

    const reports = await ImagingReport.find(query)
      .sort({ createdAt: -1 })
      .populate('orderedBy', 'name')
      .populate('reportedBy', 'name');

    console.log(`Found ${reports.length} reports for patient ${patientId}`);

    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching patient imaging reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient's imaging studies (for DICOM viewer compatibility)
router.get('/patients/:patientId/studies', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await ImagingReport.find({ patientId })
      .sort({ createdAt: -1 })
      .populate('orderedBy', 'name')
      .populate('reportedBy', 'name');

    // Transform reports to studies format for DICOM viewer
    const studies = reports.map(report => ({
      _id: report._id,
      studyId: report._id,
      studyInstanceUID: report.reportNumber || `STUDY_${report._id}`,
      studyDate: report.procedureDate || report.createdAt,
      modality: report.imagingType,
      studyDescription: `${report.imagingType} - ${report.bodyPart}`,
      bodyPartExamined: report.bodyPart,
      totalImages: report.images?.length || 0,
      totalSeries: 1,
      series: report.images?.length > 0 ? [{
        seriesInstanceUID: `SERIES_${report._id}`,
        seriesDescription: report.bodyPart,
        modality: report.imagingType,
        images: report.images
      }] : [],
      report: {
        findings: report.findings,
        impression: report.impression,
        recommendations: report.recommendations,
        status: report.status,
        reportedBy: report.reportedByName,
        reportedAt: report.reportedAt
      }
    }));

    res.json({ success: true, data: studies, studies });
  } catch (error) {
    console.error('Error fetching patient imaging studies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save imaging report (for DICOM viewer)
router.post('/reports', verifyToken, async (req, res) => {
  try {
    const { studyId, findings, impression, recommendations } = req.body;

    const report = await ImagingReport.findById(studyId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.findings = findings;
    report.impression = impression;
    report.recommendations = recommendations;
    report.reportedBy = req.user?.id;
    report.reportedByName = req.user?.name;
    report.reportedAt = new Date();
    report.status = 'reported';

    await report.save();

    res.json({ success: true, message: 'Report saved', report });
  } catch (error) {
    console.error('Error saving imaging report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload DICOM files
router.post('/upload', upload.array('files', 500), async (req, res) => {
  try {
    const { patientId, clinicId } = req.body;
    const files = req.files || [];

    console.log('Upload request received:', { patientId, clinicId, filesCount: files.length, user: req.user?.id });

    // Use patientId from body, or from authenticated user, or generate a temp one
    let finalPatientId = patientId;
    if (!finalPatientId || finalPatientId === 'undefined' || finalPatientId === 'null') {
      if (req.user?.id) {
        finalPatientId = req.user.id;
      } else {
        // Generate a temporary patient ID for anonymous uploads
        finalPatientId = 'temp_' + Date.now();
      }
    }

    console.log('Using patientId:', finalPatientId);

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Move files to patient directory
    const patientDir = path.join(uploadDir, finalPatientId.toString());
    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
    }

    const movedFiles = [];
    for (const file of files) {
      const newPath = path.join(patientDir, file.filename);
      try {
        fs.renameSync(file.path, newPath);
        movedFiles.push({
          fileName: file.originalname,
          fileUrl: `/uploads/imaging/${finalPatientId}/${file.filename}`,
          fileType: 'DICOM',
          description: file.originalname
        });
      } catch (moveErr) {
        console.error('Error moving file:', moveErr);
        // Keep in temp if move fails
        movedFiles.push({
          fileName: file.originalname,
          fileUrl: `/uploads/imaging/temp/${file.filename}`,
          fileType: 'DICOM',
          description: file.originalname
        });
      }
    }

    // Generate report number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const reportNumber = `DCM${year}${month}${day}${random}`;

    // Check if patientId is a valid ObjectId, if not store as string reference
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(finalPatientId) && 
                            String(new mongoose.Types.ObjectId(finalPatientId)) === finalPatientId;

    // Create a new imaging report for the uploaded study
    const reportData = {
      reportNumber,
      patientName: req.user?.name || 'Patient',
      orderedByName: req.user?.name || 'Self Upload',
      imagingType: 'other',
      bodyPart: 'Multiple',
      findings: 'Pending radiologist review',
      impression: 'Pending radiologist review',
      status: 'pending_report',
      procedureDate: new Date(),
      images: movedFiles
    };

    // Only set patientId if it's a valid ObjectId, otherwise use string field
    if (isValidObjectId) {
      reportData.patientId = finalPatientId;
    } else {
      reportData.patientIdString = finalPatientId;
    }

    // Only add clinicId if provided and valid
    if (clinicId && mongoose.Types.ObjectId.isValid(clinicId)) {
      reportData.clinicId = clinicId;
    } else if (req.user?.clinicId && mongoose.Types.ObjectId.isValid(req.user.clinicId)) {
      reportData.clinicId = req.user.clinicId;
    }

    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      reportData.orderedBy = req.user.id;
    }

    const report = new ImagingReport(reportData);

    await report.save();

    await logAudit(req, 'upload', report._id, `DICOM Upload - ${files.length} files`, {}, 'medium');

    console.log('Upload successful:', { studyId: report._id, totalImages: files.length });

    res.json({ 
      success: true, 
      message: 'DICOM files uploaded successfully',
      data: {
        studyId: report._id,
        totalImages: files.length,
        report
      }
    });
  } catch (error) {
    console.error('Error uploading DICOM files:', error);
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single report
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await ImagingReport.findById(req.params.id)
      .populate('patientId', 'name phone email age gender')
      .populate('orderedBy', 'name specialization')
      .populate('reportedBy', 'name specialization')
      .populate('verifiedBy', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await logAudit(req, 'read', report._id, report.reportNumber, {}, 'low');

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching imaging report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Schedule imaging
router.put('/:id/schedule', verifyTokenWithRole(['admin', 'receptionist', 'clinic']), async (req, res) => {
  try {
    const { procedureDate, procedureTime } = req.body;
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'scheduled';
    report.procedureDate = procedureDate;
    report.procedureTime = procedureTime;

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'scheduled', procedureDate } });

    res.json({ success: true, message: 'Imaging scheduled', report });
  } catch (error) {
    console.error('Error scheduling imaging:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record procedure completion
router.put('/:id/complete-procedure', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
    const { performedBy, technician, equipment } = req.body;
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'pending_report';
    report.performedBy = performedBy;
    report.technician = technician;
    report.equipment = equipment;
    if (!report.procedureDate) report.procedureDate = new Date();

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'pending_report' } });

    res.json({ success: true, message: 'Procedure completed', report });
  } catch (error) {
    console.error('Error completing procedure:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enter report findings
router.put('/:id/report', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { findings, impression, recommendations, comparisonWithPrevious } = req.body;
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.isLocked) {
      return res.status(403).json({ success: false, message: 'Report is locked' });
    }

    report.findings = findings;
    report.impression = impression;
    report.recommendations = recommendations;
    report.comparisonWithPrevious = comparisonWithPrevious;
    report.reportedBy = req.user?.id;
    report.reportedByName = req.user?.name;
    report.reportedAt = new Date();
    report.status = 'reported';

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'reported' } }, 'medium');

    res.json({ success: true, message: 'Report entered', report });
  } catch (error) {
    console.error('Error entering report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify report
router.post('/:id/verify', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'verified';
    report.verifiedBy = req.user?.id;
    report.verifiedByName = req.user?.name;
    report.verifiedAt = new Date();

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'verified' } }, 'high');

    res.json({ success: true, message: 'Report verified', report });
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sign report
router.post('/:id/sign', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { signatureData } = req.body;
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.digitalSignature = {
      signedBy: req.user?.id,
      signedAt: new Date(),
      signatureData: signatureData || `SIGNED_BY_${req.user?.name}_AT_${new Date().toISOString()}`
    };

    await report.save();

    await logAudit(req, 'sign', report._id, report.reportNumber, {}, 'high');

    res.json({ success: true, message: 'Report signed', report });
  } catch (error) {
    console.error('Error signing report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lock report
router.post('/:id/lock', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.isLocked = true;
    report.lockedAt = new Date();
    report.lockedBy = req.user?.id;

    await report.save();

    await logAudit(req, 'lock', report._id, report.reportNumber, {}, 'critical');

    res.json({ success: true, message: 'Report locked', report });
  } catch (error) {
    console.error('Error locking report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload images
router.post('/:id/images', verifyToken, async (req, res) => {
  try {
    const { images } = req.body; // Array of { fileName, fileUrl, fileType, thumbnailUrl, description }
    const report = await ImagingReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.isLocked) {
      return res.status(403).json({ success: false, message: 'Report is locked' });
    }

    report.images.push(...images);
    await report.save();

    await logAudit(req, 'upload', report._id, report.reportNumber, { after: { imagesCount: images.length } });

    res.json({ success: true, message: 'Images uploaded', report });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
