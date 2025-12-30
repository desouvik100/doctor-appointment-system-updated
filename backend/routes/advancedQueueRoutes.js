/**
 * Advanced Queue Management Routes
 * Comprehensive queue system with multi-department support
 */

const express = require('express');
const router = express.Router();
const QueueToken = require('../models/QueueToken');
const { verifyToken } = require('../middleware/auth');

// Issue new token
router.post('/token/issue', verifyToken, async (req, res) => {
  try {
    const { clinicId, patientId, patientName, patientPhone, patientAge, patientGender,
            doctorId, doctorName, department, tokenType, chiefComplaint, appointmentId, isVirtualQueue } = req.body;
    
    // Calculate queue position
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const queuePosition = await QueueToken.countDocuments({
      clinicId, department, doctorId,
      status: { $in: ['waiting', 'checked_in', 'called'] },
      issuedAt: { $gte: today }
    }) + 1;
    
    // Calculate estimated wait time
    const estimatedWaitTime = await QueueToken.calculateEstimatedWait(clinicId, department, doctorId);
    
    const token = new QueueToken({
      clinicId, patientId, patientName, patientPhone, patientAge, patientGender,
      doctorId, doctorName, department, tokenType, chiefComplaint, appointmentId,
      queuePosition, estimatedWaitTime, isVirtualQueue,
      virtualJoinedAt: isVirtualQueue ? new Date() : null,
      createdBy: req.user?.id
    });
    
    await token.save();
    res.status(201).json({ success: true, token, message: `Token ${token.tokenNumber} issued` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current queue for department/doctor
router.get('/clinic/:clinicId/queue', verifyToken, async (req, res) => {
  try {
    const { department, doctorId, status } = req.query;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    
    const query = { clinicId: req.params.clinicId, issuedAt: { $gte: today } };
    if (department) query.department = department;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;
    else query.status = { $in: ['waiting', 'checked_in', 'called', 'in_consultation'] };
    
    const queue = await QueueToken.find(query)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialization')
      .sort({ tokenType: 1, queuePosition: 1, issuedAt: 1 });
    
    res.json({ success: true, queue, count: queue.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get queue stats/dashboard
router.get('/clinic/:clinicId/stats', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    
    const [stats, departmentStats, hourlyStats] = await Promise.all([
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), issuedAt: { $gte: today } } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), issuedAt: { $gte: today } } },
        { $group: {
          _id: '$department',
          total: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $in: ['$status', ['waiting', 'checked_in']] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          avgWaitTime: { $avg: '$estimatedWaitTime' }
        }}
      ]),
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), issuedAt: { $gte: today } } },
        { $group: {
          _id: { $hour: '$issuedAt' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);
    
    const summary = {
      total: stats.reduce((sum, s) => sum + s.count, 0),
      waiting: stats.find(s => s._id === 'waiting')?.count || 0,
      inConsultation: stats.find(s => s._id === 'in_consultation')?.count || 0,
      completed: stats.find(s => s._id === 'completed')?.count || 0,
      noShow: stats.find(s => s._id === 'no_show')?.count || 0
    };
    
    res.json({ success: true, summary, departmentStats, hourlyStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Call next patient
router.post('/token/:tokenId/call', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    
    token.status = 'called';
    token.calledAt = new Date();
    token.lastCalledAt = new Date();
    token.callCount += 1;
    token.updatedBy = req.user?.id;
    
    // Add notification record
    token.notifications.push({
      type: 'display',
      message: `Token ${token.tokenNumber} - Please proceed to consultation`,
      status: 'sent'
    });
    
    await token.save();
    res.json({ success: true, token, message: `Token ${token.tokenNumber} called` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start consultation
router.post('/token/:tokenId/start', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    
    token.status = 'in_consultation';
    token.startedAt = new Date();
    token.updatedBy = req.user?.id;
    await token.save();
    
    res.json({ success: true, token, message: 'Consultation started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete consultation
router.post('/token/:tokenId/complete', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    
    token.status = 'completed';
    token.completedAt = new Date();
    if (token.startedAt) {
      token.consultationDuration = Math.round((new Date() - token.startedAt) / 60000);
    }
    token.notes = req.body.notes;
    token.updatedBy = req.user?.id;
    await token.save();
    
    res.json({ success: true, token, message: 'Consultation completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark no-show
router.post('/token/:tokenId/no-show', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.tokenId,
      { status: 'no_show', updatedBy: req.user?.id },
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    res.json({ success: true, token, message: 'Marked as no-show' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Recall patient
router.post('/token/:tokenId/recall', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    
    token.status = 'called';
    token.lastCalledAt = new Date();
    token.callCount += 1;
    token.notifications.push({ type: 'display', message: `RECALL: Token ${token.tokenNumber}`, status: 'sent' });
    token.updatedBy = req.user?.id;
    await token.save();
    
    res.json({ success: true, token, message: `Token ${token.tokenNumber} recalled` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer token to another doctor/department
router.post('/token/:tokenId/transfer', verifyToken, async (req, res) => {
  try {
    const { toDoctorId, toDepartment, reason } = req.body;
    const token = await QueueToken.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    
    token.transfers.push({
      fromDoctor: token.doctorId,
      toDoctor: toDoctorId,
      fromDepartment: token.department,
      toDepartment: toDepartment || token.department,
      reason,
      transferredBy: req.user?.id
    });
    
    token.doctorId = toDoctorId;
    if (toDepartment) token.department = toDepartment;
    token.status = 'waiting';
    token.updatedBy = req.user?.id;
    await token.save();
    
    res.json({ success: true, token, message: 'Token transferred' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Put on hold
router.post('/token/:tokenId/hold', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.tokenId,
      { status: 'on_hold', notes: req.body.reason, updatedBy: req.user?.id },
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    res.json({ success: true, token, message: 'Token put on hold' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resume from hold
router.post('/token/:tokenId/resume', verifyToken, async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.tokenId,
      { status: 'waiting', updatedBy: req.user?.id },
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    res.json({ success: true, token, message: 'Token resumed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient's queue status (for mobile app)
router.get('/patient/:phone/status', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tokens = await QueueToken.find({
      patientPhone: req.params.phone,
      issuedAt: { $gte: today },
      status: { $in: ['waiting', 'checked_in', 'called'] }
    }).populate('doctorId', 'name specialization');
    
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get display board data (for TV display)
router.get('/clinic/:clinicId/display', async (req, res) => {
  try {
    const { department } = req.query;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    
    const query = {
      clinicId: req.params.clinicId,
      issuedAt: { $gte: today },
      status: { $in: ['called', 'in_consultation'] }
    };
    if (department) query.department = department;
    
    const currentlyServing = await QueueToken.find(query)
      .populate('doctorId', 'name')
      .sort({ calledAt: -1 })
      .limit(10);
    
    const waitingCount = await QueueToken.countDocuments({
      clinicId: req.params.clinicId,
      issuedAt: { $gte: today },
      status: { $in: ['waiting', 'checked_in'] },
      ...(department && { department })
    });
    
    res.json({ success: true, currentlyServing, waitingCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit feedback
router.post('/token/:tokenId/feedback', async (req, res) => {
  try {
    const { rating, waitTimeRating, comment } = req.body;
    const token = await QueueToken.findByIdAndUpdate(
      req.params.tokenId,
      { feedback: { rating, waitTimeRating, comment, submittedAt: new Date() } },
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get analytics
router.get('/clinic/:clinicId/analytics', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const [waitTimeAnalytics, peakHours, noShowRate, feedbackStats] = await Promise.all([
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId), issuedAt: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: { _id: '$department', avgWaitTime: { $avg: '$estimatedWaitTime' }, avgConsultTime: { $avg: '$consultationDuration' }, count: { $sum: 1 } } }
      ]),
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId), issuedAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $hour: '$issuedAt' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId), issuedAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: 1 }, noShows: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } } } }
      ]),
      QueueToken.aggregate([
        { $match: { clinicId: require('mongoose').Types.ObjectId(req.params.clinicId), issuedAt: { $gte: start, $lte: end }, 'feedback.rating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, avgWaitRating: { $avg: '$feedback.waitTimeRating' }, count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({ success: true, waitTimeAnalytics, peakHours, noShowRate: noShowRate[0], feedbackStats: feedbackStats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check-in (self-service kiosk)
router.post('/token/:tokenId/checkin', async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.tokenId,
      { status: 'checked_in', checkedInAt: new Date() },
      { new: true }
    );
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });
    res.json({ success: true, token, message: 'Checked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Virtual queue join
router.post('/virtual-join', async (req, res) => {
  try {
    const { clinicId, patientName, patientPhone, doctorId, department, expectedArrivalTime } = req.body;
    
    const estimatedWaitTime = await QueueToken.calculateEstimatedWait(clinicId, department, doctorId);
    
    const token = new QueueToken({
      clinicId, patientName, patientPhone, doctorId, department,
      isVirtualQueue: true,
      virtualJoinedAt: new Date(),
      expectedArrivalTime: expectedArrivalTime ? new Date(expectedArrivalTime) : null,
      estimatedWaitTime,
      tokenType: 'regular'
    });
    
    await token.save();
    res.status(201).json({ success: true, token, message: `Virtual token ${token.tokenNumber} issued. Please arrive 10 minutes before your turn.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
