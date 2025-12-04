const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const LoyaltyPoints = require('../models/LoyaltyPoints');

// Get reviews for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ doctorId, isVisible: true })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ doctorId, isVisible: true });

    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId), isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      distribution
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Create a review (after completed appointment)
router.post('/', async (req, res) => {
  try {
    const { userId, doctorId, appointmentId, rating, title, comment, ratings } = req.body;

    // Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed appointments' });
    }
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to review this appointment' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this appointment' });
    }

    const review = new Review({
      userId,
      doctorId,
      appointmentId,
      rating,
      title,
      comment,
      ratings
    });

    await review.save();

    // Award loyalty points for leaving a review
    try {
      let loyalty = await LoyaltyPoints.findOne({ userId });
      if (!loyalty) {
        loyalty = new LoyaltyPoints({ userId });
      }
      const multiplier = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 }[loyalty.tier] || 1;
      const points = Math.floor(30 * multiplier);
      loyalty.addPoints(points, `Earned ${points} points for leaving a review`, 'review', review._id);
      await loyalty.save();
      console.log(`🎁 Awarded ${points} loyalty points to user ${userId} for review`);
    } catch (loyaltyError) {
      console.error('Error awarding loyalty points:', loyaltyError);
    }

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

// Check if user can review an appointment
router.get('/can-review/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.query;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== 'completed') {
      return res.json({ canReview: false, reason: 'Appointment not completed' });
    }

    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed', review: existingReview });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ message: 'Error checking review status', error: error.message });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
});

module.exports = router;
