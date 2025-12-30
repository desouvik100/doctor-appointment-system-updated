/**
 * Patient Feedback & Satisfaction Routes
 */

const express = require('express');
const router = express.Router();
const PatientFeedback = require('../models/PatientFeedback');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const mongoose = require('mongoose');

// Submit feedback
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const feedback = new PatientFeedback(req.body);
    await feedback.save();
    res.status(201).json({ success: true, feedback, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all feedback for clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { feedbackType, isComplaint, npsCategory, doctorId, page = 1, limit = 20 } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (feedbackType) query.feedbackType = feedbackType;
    if (isComplaint !== undefined) query.isComplaint = isComplaint === 'true';
    if (npsCategory) query.npsCategory = npsCategory;
    if (doctorId) query.doctorId = doctorId;

    const feedback = await PatientFeedback.find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PatientFeedback.countDocuments(query);
    res.json({ success: true, feedback, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get feedback analytics
router.get('/analytics/:clinicId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { clinicId: mongoose.Types.ObjectId(req.params.clinicId) };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [npsStats, ratingStats, complaintStats, trendData] = await Promise.all([
      // NPS Distribution
      PatientFeedback.aggregate([
        { $match: { ...match, npsScore: { $exists: true } } },
        { $group: { _id: '$npsCategory', count: { $sum: 1 } } }
      ]),
      
      // Average Ratings
      PatientFeedback.aggregate([
        { $match: match },
        { $group: {
          _id: null,
          avgOverall: { $avg: '$ratings.overall' },
          avgDoctorBehavior: { $avg: '$ratings.doctorBehavior' },
          avgStaffBehavior: { $avg: '$ratings.staffBehavior' },
          avgWaitTime: { $avg: '$ratings.waitTime' },
          avgCleanliness: { $avg: '$ratings.cleanliness' },
          avgFacilities: { $avg: '$ratings.facilities' },
          totalFeedback: { $sum: 1 }
        }}
      ]),
      
      // Complaint Stats
      PatientFeedback.aggregate([
        { $match: { ...match, isComplaint: true } },
        { $group: { _id: '$complaintStatus', count: { $sum: 1 } } }
      ]),
      
      // Monthly Trend
      PatientFeedback.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          avgRating: { $avg: '$ratings.overall' },
          count: { $sum: 1 },
          npsAvg: { $avg: '$npsScore' }
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ])
    ]);

    // Calculate NPS Score
    const promoters = npsStats.find(n => n._id === 'promoter')?.count || 0;
    const detractors = npsStats.find(n => n._id === 'detractor')?.count || 0;
    const totalNps = npsStats.reduce((sum, n) => sum + n.count, 0);
    const npsScore = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        nps: { score: npsScore, distribution: npsStats, total: totalNps },
        ratings: ratingStats[0] || {},
        complaints: complaintStats,
        trend: trendData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get doctor-wise feedback
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const [feedback, stats] = await Promise.all([
      PatientFeedback.find({ doctorId: req.params.doctorId })
        .populate('patientId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      
      PatientFeedback.aggregate([
        { $match: { doctorId: mongoose.Types.ObjectId(req.params.doctorId) } },
        { $group: {
          _id: null,
          avgRating: { $avg: '$ratings.overall' },
          avgDoctorBehavior: { $avg: '$ratings.doctorBehavior' },
          avgCommunication: { $avg: '$ratings.communication' },
          totalFeedback: { $sum: 1 },
          wouldRecommend: { $sum: { $cond: ['$wouldRecommend', 1, 0] } }
        }}
      ])
    ]);

    res.json({ success: true, feedback, stats: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Respond to feedback
router.post('/:id/respond', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { responseText } = req.body;
    const feedback = await PatientFeedback.findByIdAndUpdate(
      req.params.id,
      {
        responseGiven: true,
        responseText,
        respondedBy: req.user?.userId,
        respondedAt: new Date(),
        status: 'actioned'
      },
      { new: true }
    );
    res.json({ success: true, feedback, message: 'Response sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Resolve complaint
router.post('/:id/resolve', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { resolution } = req.body;
    const feedback = await PatientFeedback.findByIdAndUpdate(
      req.params.id,
      {
        complaintStatus: 'resolved',
        resolution,
        resolvedBy: req.user?.userId,
        resolvedAt: new Date(),
        status: 'closed'
      },
      { new: true }
    );
    res.json({ success: true, feedback, message: 'Complaint resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send feedback request (post-visit)
router.post('/send-request', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { patientId, patientPhone, patientEmail, appointmentId, doctorId, clinicId } = req.body;
    
    // In production, send SMS/Email with feedback link
    const feedbackLink = `https://healthsyncpro.in/feedback?apt=${appointmentId}`;
    
    // Mock sending
    const sent = {
      sms: patientPhone ? true : false,
      email: patientEmail ? true : false,
      link: feedbackLink
    };

    res.json({ success: true, sent, message: 'Feedback request sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
