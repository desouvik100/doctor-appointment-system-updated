const express = require('express');
const router = express.Router();
const Review = require('../models/Review')
const ReviewReply = require('../models/ReviewReply')
const ReviewVote = require('../models/ReviewVote');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor')
const { verifyToken } = require('../middleware/auth');
const mongoose = require('mongoose');

const populateReplyUsers = async (replies) => {
  let userIds = [];
  const doctorIds = [];
  // console.log('populateReplyUsers called')

  replies.forEach(r => {
    if (r.userType === 'Doctor') {
      doctorIds.push(r.userId)
    } else {
      userIds.push(r.userId);
    }
  });

  const User = require('../models/User');
  const DoctorModel = require('../models/Doctor');

  const [users, doctors] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name profilePhoto').lean(),
    DoctorModel.find({  _id: { $in: doctorIds } }).select('name profilePhoto photo').lean()
  ]);

  const userMap = {}
  users.forEach(u => {
   userMap[u._id.toString()] = {  
      name: u.name, 
      profilePhoto: u.profilePhoto 
    };
  });
  doctors.forEach(d => {
    userMap[d._id.toString()] = {  
      name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`, 
      profilePhoto: d.profilePhoto || d.photo || null 
    };
  });

  // Performance: Consider memoizing this if it causes rerenders
  return replies.map(r => {
    const rObj = r.toObject ? r.toObject() : r;
    const userMeta = userMap[rObj.userId.toString()] || { name: 'HealthSync Patient', profilePhoto: null };
    return {
      ...rObj,
     user: userMeta
    };
  });
};

router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params; 
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest', 
      visitType, 
     isVerified, 
      rating 
   } = req.query;

    const limitNum = parseInt(limit, 10);
    const skipNum = (parseInt(page, 10) - 1) * limitNum;

    const query = {  
      doctorId: new mongoose.Types.ObjectId(doctorId), 
      status: 'approved' 
    };

    if (visitType) {
      query.visitType = visitType;
    }

    if (isVerified) {
      query.isVerified = isVerified === 'true';
    }

    if (rating) {

      const ratingArray = rating.split(',').map(Number);
      query.rating = { $in: ratingArray };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'helpful') {
      sortOption = {  helpfulCount: -1, createdAt: -1 }
    } else if (sort === 'highest') {
      sortOption = {  rating: -1, createdAt: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1, createdAt: -1 }
    } else if (sort === 'newest') {
      sortOption = {  createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 }
    }

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('patientId', 'name profilePhoto')
        .sort(sortOption)
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    const analyticsQuery = {  doctorId: new mongoose.Types.ObjectId(doctorId), status: 'approved' };
    const [ratingCounts, stats] = await Promise.all([
      Review.aggregate([
        { $match: analyticsQuery },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]),
      Review.calculateDoctorRating(doctorId)
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumCounts = 0;
    ratingCounts.forEach(item => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count
        sumCounts += item.count;
      }
    });

    const ratingDistributionPercentages = {};
    Object.keys(distribution).forEach(star => {
      const count = distribution[star];
      ratingDistributionPercentages[star] = sumCounts > 0 ? Math.round((count / sumCounts) * 100) : 0;
    });

    const reviewIds = reviews.map(r => r._id);
    const replies = await ReviewReply.find({ reviewId: { $in: reviewIds } }).sort({ createdAt: 1 });
    const populatedReplies = await populateReplyUsers(replies);

    const reviewListWithReplies = reviews.map(r => {
      const rIdStr = r._id.toString();
      const reviewReplies = populatedReplies.filter(rep => rep.reviewId.toString() === rIdStr);
      
      const map = {};
      const tree = []

      reviewReplies.forEach(rep => {
        map[rep._id.toString()] = { ...rep, replies: [] };
      });

      reviewReplies.forEach(rep => {
        const mapped = map[rep._id.toString()];
        if (rep.parentId) {
          const parent = map[rep.parentId.toString()];
          if (parent) { 
            parent.replies.push(mapped);
          } else {
            tree.push(mapped); 
          }
        } else {
         tree.push(mapped);
       } 
      });

      return {
        ...r,
        patientName: r.isAnonymous ? 'Anonymous Patient' : r.patientId?.name || 'Verified Patient',
        patientPhoto: r.isAnonymous ? null : r.patientId?.profilePhoto || null,
       discussionThread: tree
      };
    });

    res.json({
      success: true,
      reviews: reviewListWithReplies,
      total: totalCount,
     page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / limitNum),
      analytics: { 
       averageRating: Math.round((stats.averageRating || 0) * 10) / 10,
        totalReviews: stats.totalReviews || 0,
        distribution: ratingDistributionPercentages,
        rawDistribution: distribution
      }
    });

  } catch (error) {
    console.error('Get doctor reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/can-review/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id || req.user.userId;
 
    const appointment = await Appointment.findOne({  _id: appointmentId, userId })
    if (!appointment) {
      return res.json({  canReview: false, reason: 'Completed appointment not found for this user.' });
    }

    if (appointment.status !== 'completed') {
      return res.json({ canReview: false, reason: 'Can only review completed appointments.' }) 
   }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (appointment.date < thirtyDaysAgo) {
      return res.json({ canReview: false, reason: 'The 30-day review window has expired.' });
    }

    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.json({  canReview: false, reason: 'A review has already been submitted for this appointment.' });
    }

    res.json({  canReview: true });
  } catch (error) {
    console.error('Can-review eligibility check error:', error);
    res.status(500).json({  success: false, message: 'Server error', error: error.message })
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { appointmentId, rating, title, review, visitType = 'in-clinic', isAnonymous = false } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({  success: false, message: 'Appointment ID and rating are required.' });
    }

    const appointment = await Appointment.findOne({  _id: appointmentId, userId });
    if (!appointment) {
      return res.status(404).json({  success: false, message: 'Completed appointment not found for this user.' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({  success: false, message: 'Can only review completed appointments.' });
    }

    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({  success: false, message: 'Review already submitted for this appointment.' });
    }

    let photoUrl = null;
    if (req.body.photo) {
      try {
        const cloudinaryService = require('../services/cloudinaryService');
        const uploadRes = await cloudinaryService.uploadFile(req.body.photo, {
          folder: 'healthsync/reviews',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        })
        if (uploadRes && uploadRes.success) {
          photoUrl = uploadRes.secureUrl || uploadRes.url;
        }
      } catch (err) {
        console.error('Cloudinary review photo upload error:', err); 
        return res.status(400).json({ success: false, message: `Failed to upload review photo: ${err.message}` });
      }
    }

    const newReview = new Review({
      appointmentId,
      patientId: userId,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId || null,
      rating,
     title,
      review,
      visitType: visitType === 'virtual' || appointment.consultationType === 'online' ? 'virtual' : 'in-clinic',
      isAnonymous,
      isVerified: true,
      photo: photoUrl
    });

    await newReview.save();

    const stats = await Review.calculateDoctorRating(appointment.doctorId); 
   await Doctor.findByIdAndUpdate(appointment.doctorId, {
      rating: Math.round(stats.averageRating * 10) / 10,
      reviewCount: stats.totalReviews
    });

   res.status(201).json({  success: true, message: 'Review created successfully.', review: newReview });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:reviewId/reply', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
   const { parentId = null, text } = req.body
    const userId = req.user.id || req.user.userId

    if (!text || text.trim() === '') {
      return res.status(400).json({  success: false, message: 'Reply text is required.' });
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({  success: false, message: 'Review not found.' });
    }

   let targetDepth = 1
    if (parentId) {
      const parentReply = await ReviewReply.findById(parentId);
      if (!parentReply) {
        return res.status(404).json({ success: false, message: 'Parent reply not found.' });
      }
      targetDepth = parentReply.depth + 1;
     if (targetDepth > 3) {
        return res.status(400).json({ success: false, message: 'Discussion thread nesting depth limit of 3 exceeded.' });
      }
    }

    let userType = 'Patient';
    if (review.doctorId.toString() === userId.toString()) {
      userType = 'Doctor';
    } else if (req.user.role === 'staff' || req.user.role === 'receptionist') {
      userType = 'ClinicStaff';
    }

    const newReply = new ReviewReply({
      reviewId,
      parentId,
      userId,
      userType,
      text,
      depth: targetDepth
    });

    await newReply.save();

    const populated = await populateReplyUsers([newReply]);

    res.status(201).json({  success: true, message: 'Reply posted.', reply: populated[0] });
  } catch (error) {
    console.error('Post reply error:', error)
    res.status(500).json({  success: false, message: 'Server error', error: error.message });
  }
});

router.post('/:reviewId/helpful', verifyToken, async (req, res) => {
  try {
   const { reviewId } = req.params;
    const { voteType = 'helpful' } = req.body; 
    const userId = req.user.id || req.user.userId;

    if (!['helpful', 'unhelpful'].includes(voteType)) {
      return res.status(400).json({ success: false, message: 'Invalid voteType.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const existingVote = await ReviewVote.findOne({ reviewId, userId });
    if (existingVote) {
     return res.status(400).json({  success: false, message: 'You have already voted on this review.' });
    }

    const vote = new ReviewVote({
      reviewId,
      userId,
      voteType
   });
    await vote.save();

    if (voteType === 'helpful') {
      review.helpfulCount += 1;
    } else {
      review.unhelpfulCount += 1
    }
    await review.save();

    res.json({ 
      success: true, 
      message: 'Vote cast successfully.', 
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount 
    });
  } catch (error) {
    console.error('Vote helpful error:', error)
    res.status(500).json({  success: false, message: 'Server error', error: error.message });
  }
})

router.delete('/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.patientId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({  success: false, message: 'Not authorized to delete this review.' });
    }

    await Promise.all([
      Review.findByIdAndDelete(reviewId),
      ReviewVote.deleteMany({ reviewId }),
      ReviewReply.deleteMany({ reviewId })
    ]);

    const stats = await Review.calculateDoctorRating(review.doctorId);
   await Doctor.findByIdAndUpdate(review.doctorId, { 
      rating: Math.round(stats.averageRating * 10) / 10,
     reviewCount: stats.totalReviews
    });

    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({  success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, review: reviewText, visitType, isAnonymous } = req.body
    const userId = req.user.id || req.user.userId;

    const existingReview = await Review.findById(reviewId);
   if (!existingReview) { 
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (existingReview.patientId.toString() !== userId.toString()) {
      return res.status(403).json({  success: false, message: 'Not authorized to edit this review.' });
    }

    const updates = {};
    if (rating !== undefined) updates.rating = rating
    if (title !== undefined) updates.title = title;
   if (reviewText !== undefined) updates.review = reviewText;
    if (visitType !== undefined) updates.visitType = visitType
    if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updates },
      {  new: true }
    );

   if (rating !== undefined) { 
      const stats = await Review.calculateDoctorRating(updatedReview.doctorId);
      await Doctor.findByIdAndUpdate(updatedReview.doctorId, {
        rating: Math.round(stats.averageRating * 10) / 10,
        reviewCount: stats.totalReviews
      });
    }

    res.json({  success: true, message: 'Review updated successfully.', review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
   res.status(500).json({  success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
