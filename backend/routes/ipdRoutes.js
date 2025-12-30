const express = require('express');
const router = express.Router();
const IPDAdmission = require('../models/IPDAdmission');
const Bed = require('../models/Bed');
const AuditLog = require('../models/AuditLog');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Helper to log audit
const logAudit = async (req, action, entityId, entityName, changes = {}, severity = 'low') => {
  try {
    await AuditLog.log({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      userRole: req.user?.role || 'unknown',
      entityType: 'admission',
      entityId,
      entityName,
      action,
      changes,
      clinicId: req.user?.clinicId || req.body?.clinicId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity,
      description: `${action} admission for ${entityName}`
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

// Create new admission
router.post('/admit', verifyTokenWithRole(['admin', 'doctor', 'receptionist', 'nurse', 'clinic']), async (req, res) => {
  try {
    const {
      patientId, patientName, patientPhone, patientAge, patientGender,
      chiefComplaint, provisionalDiagnosis, attendingDoctorId, attendingDoctorName,
      bedId, wardType, admissionType, treatmentPlan, estimatedCost,
      insuranceDetails, clinicId
    } = req.body;

    // Validate bed availability
    if (bedId && bedId.trim()) {
      const bed = await Bed.findById(bedId);
      if (!bed || bed.status !== 'available') {
        return res.status(400).json({ success: false, message: 'Selected bed is not available' });
      }
    }

    // Build admission object, only include valid ObjectIds
    const admissionData = {
      patientName,
      patientPhone,
      patientAge: patientAge ? parseInt(patientAge) : undefined,
      patientGender,
      chiefComplaint,
      provisionalDiagnosis,
      attendingDoctorName,
      wardType: wardType || 'general',
      admissionType: admissionType || 'elective',
      treatmentPlan,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      insuranceDetails,
      clinicId,
      status: 'admitted',
      createdBy: req.user?.id
    };

    // Only add ObjectId fields if they have valid values
    if (patientId && patientId.trim()) admissionData.patientId = patientId;
    if (attendingDoctorId && attendingDoctorId.trim()) admissionData.attendingDoctorId = attendingDoctorId;
    if (bedId && bedId.trim()) admissionData.bedId = bedId;

    const admission = new IPDAdmission(admissionData);

    // Get bed details if bed is assigned
    if (bedId && bedId.trim()) {
      const bed = await Bed.findById(bedId);
      if (bed) {
        admission.bedNumber = bed.bedNumber;
        admission.roomNumber = bed.roomNumber;
        admission.floorNumber = bed.floorNumber;

        // Update bed status
        bed.status = 'occupied';
        if (patientId && patientId.trim()) bed.currentPatientId = patientId;
        bed.currentAdmissionId = admission._id;
        bed.occupiedSince = new Date();
        await bed.save();
      }
    }

    await admission.save();

    // Log audit
    await logAudit(req, 'admit', admission._id, patientName, { after: { admissionNumber: admission.admissionNumber } }, 'high');

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully',
      admission
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all admissions for clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { status, wardType, doctorId, page = 1, limit = 50 } = req.query;

    const query = { clinicId };
    if (status) query.status = status;
    if (wardType) query.wardType = wardType;
    if (doctorId) query.attendingDoctorId = doctorId;

    const admissions = await IPDAdmission.find(query)
      .sort({ admissionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patientId', 'name phone email')
      .populate('attendingDoctorId', 'name specialization')
      .populate('bedId', 'bedNumber wardType roomNumber');

    const total = await IPDAdmission.countDocuments(query);

    res.json({
      success: true,
      admissions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single admission
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const admission = await IPDAdmission.findById(req.params.id)
      .populate('patientId', 'name phone email age gender address')
      .populate('attendingDoctorId', 'name specialization phone')
      .populate('bedId')
      .populate('assignedNurseId', 'name')
      .populate('createdBy', 'name')
      .populate('dischargedBy', 'name');

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    res.json({ success: true, admission });
  } catch (error) {
    console.error('Error fetching admission:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add progress note
router.post('/:id/progress-note', verifyTokenWithRole(['admin', 'doctor', 'nurse', 'clinic']), async (req, res) => {
  try {
    const { note } = req.body;
    const admission = await IPDAdmission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    if (admission.isLocked) {
      return res.status(403).json({ success: false, message: 'Record is locked and cannot be modified' });
    }

    admission.progressNotes.push({
      note,
      writtenBy: req.user?.id,
      writerName: req.user?.name,
      writerRole: req.user?.role
    });
    admission.lastModifiedBy = req.user?.id;
    await admission.save();

    await logAudit(req, 'update', admission._id, admission.patientName, { after: { progressNote: note } });

    res.json({ success: true, message: 'Progress note added', admission });
  } catch (error) {
    console.error('Error adding progress note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer bed
router.post('/:id/transfer-bed', verifyTokenWithRole(['admin', 'receptionist', 'nurse', 'clinic']), async (req, res) => {
  try {
    const { newBedId, reason } = req.body;
    const admission = await IPDAdmission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    if (admission.status === 'discharged') {
      return res.status(400).json({ success: false, message: 'Cannot transfer discharged patient' });
    }

    const newBed = await Bed.findById(newBedId);
    if (!newBed || newBed.status !== 'available') {
      return res.status(400).json({ success: false, message: 'New bed is not available' });
    }

    // Free old bed
    if (admission.bedId) {
      await Bed.findByIdAndUpdate(admission.bedId, {
        status: 'cleaning',
        currentPatientId: null,
        currentAdmissionId: null
      });
    }

    // Record transfer history
    admission.bedHistory.push({
      bedId: admission.bedId,
      bedNumber: admission.bedNumber,
      wardType: admission.wardType,
      fromDate: admission.bedHistory.length > 0 
        ? admission.bedHistory[admission.bedHistory.length - 1].toDate 
        : admission.admissionDate,
      toDate: new Date(),
      reason,
      transferredBy: req.user?.id
    });

    // Update to new bed
    admission.bedId = newBedId;
    admission.bedNumber = newBed.bedNumber;
    admission.wardType = newBed.wardType;
    admission.roomNumber = newBed.roomNumber;
    admission.floorNumber = newBed.floorNumber;
    admission.lastModifiedBy = req.user?.id;
    await admission.save();

    // Occupy new bed
    newBed.status = 'occupied';
    newBed.currentPatientId = admission.patientId;
    newBed.currentAdmissionId = admission._id;
    newBed.occupiedSince = new Date();
    await newBed.save();

    await logAudit(req, 'transfer', admission._id, admission.patientName, 
      { before: { bed: admission.bedNumber }, after: { bed: newBed.bedNumber } }, 'medium');

    res.json({ success: true, message: 'Bed transferred successfully', admission });
  } catch (error) {
    console.error('Error transferring bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Discharge patient
router.post('/:id/discharge', verifyTokenWithRole(['admin', 'doctor', 'clinic']), async (req, res) => {
  try {
    const {
      dischargeType, dischargeCondition, dischargeSummary, finalDiagnosis
    } = req.body;

    const admission = await IPDAdmission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    if (admission.status === 'discharged') {
      return res.status(400).json({ success: false, message: 'Patient already discharged' });
    }

    // Update admission
    admission.status = 'discharged';
    admission.dischargeDate = new Date();
    admission.dischargeTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    admission.dischargeType = dischargeType || 'normal';
    admission.dischargeCondition = dischargeCondition;
    admission.dischargeSummary = dischargeSummary;
    admission.finalDiagnosis = finalDiagnosis || admission.provisionalDiagnosis;
    admission.dischargedBy = req.user?.id;
    admission.lastModifiedBy = req.user?.id;

    await admission.save();

    // Free bed
    if (admission.bedId) {
      await Bed.findByIdAndUpdate(admission.bedId, {
        status: 'cleaning',
        currentPatientId: null,
        currentAdmissionId: null,
        expectedDischarge: null
      });
    }

    await logAudit(req, 'discharge', admission._id, admission.patientName, 
      { after: { dischargeType, dischargeCondition } }, 'high');

    res.json({ success: true, message: 'Patient discharged successfully', admission });
  } catch (error) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lock record (for compliance)
router.post('/:id/lock', verifyTokenWithRole(['admin', 'doctor', 'clinic']), async (req, res) => {
  try {
    const admission = await IPDAdmission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    if (admission.isLocked) {
      return res.status(400).json({ success: false, message: 'Record is already locked' });
    }

    admission.isLocked = true;
    admission.lockedAt = new Date();
    admission.lockedBy = req.user?.id;
    await admission.save();

    await logAudit(req, 'lock', admission._id, admission.patientName, {}, 'critical');

    res.json({ success: true, message: 'Record locked successfully', admission });
  } catch (error) {
    console.error('Error locking record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sign record (digital signature)
router.post('/:id/sign', verifyTokenWithRole(['admin', 'doctor', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { signatureType, signatureData } = req.body; // 'admission' or 'discharge'
    const admission = await IPDAdmission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    const signature = {
      signedBy: req.user?.id,
      signedAt: new Date(),
      signatureData: signatureData || `SIGNED_BY_${req.user?.name}_AT_${new Date().toISOString()}`
    };

    if (signatureType === 'discharge') {
      admission.dischargeSignature = signature;
    } else {
      admission.admissionSignature = signature;
    }

    await admission.save();

    await logAudit(req, 'sign', admission._id, admission.patientName, 
      { after: { signatureType } }, 'high');

    res.json({ success: true, message: 'Record signed successfully', admission });
  } catch (error) {
    console.error('Error signing record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get IPD statistics
router.get('/stats/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;

    const stats = await IPDAdmission.aggregate([
      { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const wardStats = await IPDAdmission.aggregate([
      { 
        $match: { 
          clinicId: require('mongoose').Types.ObjectId(clinicId),
          status: { $in: ['admitted', 'in_treatment'] }
        } 
      },
      {
        $group: {
          _id: '$wardType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Today's admissions and discharges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAdmissions = await IPDAdmission.countDocuments({
      clinicId,
      admissionDate: { $gte: today }
    });

    const todayDischarges = await IPDAdmission.countDocuments({
      clinicId,
      dischargeDate: { $gte: today }
    });

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byWard: wardStats,
        todayAdmissions,
        todayDischarges
      }
    });
  } catch (error) {
    console.error('Error fetching IPD stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
