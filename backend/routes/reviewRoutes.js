const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Create review
router.post('/create', async (req, res) => {
  try {
    const { appointmentId, rating, ratings, title, review, tags, wouldRecommend, isAnonymous } = req.body;

    // Check if appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed appointments' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this appointment' });
    }

    const newReview = new Review({
      appointmentId,
      patientId: appointment.userId,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
      rating,
      ratings,
      title,
      review,
      tags,
      wouldRecommend,
      isAnonymous
    });

    await newReview.save();

    // Update doctor's average rating
    const doctorStats = await Review.calculateDoctorRating(appointment.doctorId);
    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      averageRating: Math.round(doctorStats.averageRating * 10) / 10,
      totalReviews: doctorStats.totalReviews
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
});

// Get reviews for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    let sortOption = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

    const reviews = await Review.find({
      doctorId: req.params.doctorId,
      status: 'approved'
    })
      .populate('patientId', 'name profilePhoto')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      doctorId: req.params.doctorId,
      status: 'approved'
    });

    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: { doctorId: require('mongoose').Types.ObjectId(req.params.doctorId), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => { ratingDistribution[d._id] = d.count; });

    // Get doctor stats
    const stats = await Review.calculateDoctorRating(req.params.doctorId);

    res.json({
      reviews: reviews.map(r => ({
        ...r.toObject(),
        patientName: r.isAnonymous ? 'Anonymous' : r.patientId?.name
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      stats,
      ratingDistribution
    });
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get patient's reviews
router.get('/patient/:patientId', async (req, res) => {
  try {
    const reviews = await Review.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization profilePhoto')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get patient reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Check if can review appointment
router.get('/can-review/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    
    if (!appointment) {
      return res.json({ canReview: false, reason: 'Appointment not found' });
    }

    if (appointment.status !== 'completed') {
      return res.json({ canReview: false, reason: 'Appointment not completed' });
    }

    const existingReview = await Review.findOne({ appointmentId: req.params.appointmentId });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed', review: existingReview });
    }

    // Check if within review window (30 days)
    const appointmentDate = new Date(appointment.date);
    const daysSince = (Date.now() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) {
      return res.json({ canReview: false, reason: 'Review window expired (30 days)' });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error('Can review check error:', error);
    res.status(500).json({ message: 'Failed to check review eligibility', error: error.message });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { rating, ratings, title, review, tags, wouldRecommend } = req.body;
    
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, ratings, title, review, tags, wouldRecommend },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Recalculate doctor rating
    const doctorStats = await Review.calculateDoctorRating(updatedReview.doctorId);
    await Doctor.findByIdAndUpdate(updatedReview.doctorId, {
      averageRating: Math.round(doctorStats.averageRating * 10) / 10,
      totalReviews: doctorStats.totalReviews
    });

    res.json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
});

// Doctor respond to review
router.post('/:id/respond', async (req, res) => {
  try {
    const { text } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        doctorResponse: {
          text,
          respondedAt: new Date()
        }
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Response added successfully', review });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Failed to add response', error: error.message });
  }
});

// Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if already voted
    const alreadyVoted = review.helpfulVotes.some(v => v.userId.toString() === userId);
    if (alreadyVoted) {
      return res.status(400).json({ message: 'Already marked as helpful' });
    }

    review.helpfulVotes.push({ userId, votedAt: new Date() });
    review.helpfulCount += 1;
    await review.save();

    res.json({ message: 'Marked as helpful', helpfulCount: review.helpfulCount });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Failed to mark as helpful', error: error.message });
  }
});

// Report review
router.post('/:id/report', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.reportedBy.push({ userId, reason, reportedAt: new Date() });
    
    // Auto-flag if reported multiple times
    if (review.reportedBy.length >= 3) {
      review.status = 'flagged';
    }
    
    await review.save();

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ message: 'Failed to report review', error: error.message });
  }
});

module.exports = router;
