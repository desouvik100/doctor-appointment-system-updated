const express = require('express');
const router = express.Router();
const LabReport = require('../models/LabReport');
const AuditLog = require('../models/AuditLog');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Helper to log audit
const logAudit = async (req, action, entityId, entityName, changes = {}, severity = 'low') => {
  try {
    await AuditLog.log({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      userRole: req.user?.role || 'unknown',
      entityType: 'lab_report',
      entityId,
      entityName,
      action,
      changes,
      clinicId: req.user?.clinicId || req.body?.clinicId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity,
      description: `${action} lab report ${entityName}`
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

// Create lab order
router.post('/order', verifyTokenWithRole(['admin', 'doctor', 'nurse', 'clinic']), async (req, res) => {
  try {
    const {
      patientId, patientName, patientAge, patientGender,
      testCategory, testName, testCode, sampleType,
      priority, admissionId, appointmentId, clinicId, cost
    } = req.body;

    const report = new LabReport({
      patientId,
      patientName,
      patientAge,
      patientGender,
      orderedBy: req.user?.id,
      orderedByName: req.user?.name,
      testCategory,
      testName,
      testCode,
      sampleType,
      priority: priority || 'routine',
      admissionId,
      appointmentId,
      clinicId,
      cost,
      status: 'ordered'
    });

    await report.save();

    await logAudit(req, 'create', report._id, `${testName} for ${patientName}`, {}, 'low');

    res.status(201).json({ success: true, message: 'Lab test ordered', report });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get lab reports for clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status, testCategory, patientId, page = 1, limit = 50 } = req.query;

    const query = { clinicId };
    if (status) query.status = status;
    if (testCategory) query.testCategory = testCategory;
    if (patientId) query.patientId = patientId;

    const reports = await LabReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patientId', 'name phone')
      .populate('orderedBy', 'name')
      .populate('verifiedBy', 'name');

    const total = await LabReport.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching lab reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient's lab reports
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await LabReport.find({ patientId })
      .sort({ createdAt: -1 })
      .populate('orderedBy', 'name')
      .populate('verifiedBy', 'name');

    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching patient lab reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single report
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate('patientId', 'name phone email age gender')
      .populate('orderedBy', 'name specialization')
      .populate('verifiedBy', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Log read action for sensitive data
    await logAudit(req, 'read', report._id, report.reportNumber, {}, 'low');

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching lab report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update sample collection
router.put('/:id/sample-collected', verifyTokenWithRole(['admin', 'nurse', 'clinic']), async (req, res) => {
  try {
    const { sampleId, sampleCollectedBy } = req.body;
    const report = await LabReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'sample_collected';
    report.sampleCollectedAt = new Date();
    report.sampleCollectedBy = sampleCollectedBy || req.user?.name;
    report.sampleId = sampleId;

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'sample_collected' } });

    res.json({ success: true, message: 'Sample collection recorded', report });
  } catch (error) {
    console.error('Error updating sample collection:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enter results
router.put('/:id/results', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
    const { results, interpretation, comments, performedBy } = req.body;
    const report = await LabReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.isLocked) {
      return res.status(403).json({ success: false, message: 'Report is locked' });
    }

    report.results = results;
    report.interpretation = interpretation;
    report.comments = comments;
    report.performedBy = performedBy;
    report.status = 'pending_verification';

    await report.save();

    await logAudit(req, 'update', report._id, report.reportNumber, { after: { status: 'pending_verification' } }, 'medium');

    res.json({ success: true, message: 'Results entered', report });
  } catch (error) {
    console.error('Error entering results:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify report
router.post('/:id/verify', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Report is not pending verification' });
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

// Sign report (digital signature)
router.post('/:id/sign', verifyTokenWithRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { signatureData } = req.body;
    const report = await LabReport.findById(req.params.id);

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
    const report = await LabReport.findById(req.params.id);

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

// Upload attachment
router.post('/:id/attachment', verifyToken, async (req, res) => {
  try {
    const { fileName, fileUrl, fileType } = req.body;
    const report = await LabReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.isLocked) {
      return res.status(403).json({ success: false, message: 'Report is locked' });
    }

    report.attachments.push({ fileName, fileUrl, fileType });
    await report.save();

    await logAudit(req, 'upload', report._id, report.reportNumber, { after: { fileName } });

    res.json({ success: true, message: 'Attachment added', report });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
