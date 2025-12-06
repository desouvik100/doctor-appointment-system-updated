// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Payment = require('../models/Payment');
const Clinic = require('../models/Clinic');
const Review = require('../models/Review');

// Get dashboard overview stats
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total counts
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalClinics,
      todayAppointments,
      thisMonthAppointments,
      lastMonthAppointments,
      pendingAppointments,
      completedAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Clinic.countDocuments({ isActive: true }),
      Appointment.countDocuments({ date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }),
      Appointment.countDocuments({ createdAt: { $gte: thisMonth } }),
      Appointment.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' })
    ]);

    // Revenue stats
    const revenueThisMonth = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'success'] }, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenueLastMonth = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'success'] }, createdAt: { $gte: lastMonth, $lt: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate growth percentages
    const appointmentGrowth = lastMonthAppointments > 0 
      ? ((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments * 100).toFixed(1)
      : 100;

    const currentRevenue = revenueThisMonth[0]?.total || 0;
    const previousRevenue = revenueLastMonth[0]?.total || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 100;

    res.json({
      overview: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalClinics,
        todayAppointments,
        pendingAppointments,
        completedAppointments
      },
      thisMonth: {
        appointments: thisMonthAppointments,
        revenue: currentRevenue,
        appointmentGrowth: parseFloat(appointmentGrowth),
        revenueGrowth: parseFloat(revenueGrowth)
      },
      lastMonth: {
        appointments: lastMonthAppointments,
        revenue: previousRevenue
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

// Get appointment trends (last 30 days)
router.get('/appointment-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const trends = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          online: { $sum: { $cond: [{ $eq: ['$consultationType', 'online'] }, 1, 0] } },
          inPerson: { $sum: { $cond: [{ $eq: ['$consultationType', 'in-person'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    console.error('Appointment trends error:', error);
    res.status(500).json({ message: 'Failed to fetch trends', error: error.message });
  }
});

// Get revenue trends
router.get('/revenue-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const trends = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'success'] }, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    console.error('Revenue trends error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue trends', error: error.message });
  }
});

// Get top doctors by appointments
router.get('/top-doctors', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const topDoctors = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thisMonth } } },
      {
        $group: {
          _id: '$doctorId',
          appointmentCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $project: {
          _id: 1,
          appointmentCount: 1,
          completedCount: 1,
          name: '$doctor.name',
          specialization: '$doctor.specialization',
          rating: '$doctor.rating'
        }
      }
    ]);

    res.json(topDoctors);
  } catch (error) {
    console.error('Top doctors error:', error);
    res.status(500).json({ message: 'Failed to fetch top doctors', error: error.message });
  }
});

// Get specialization distribution
router.get('/specialization-stats', async (req, res) => {
  try {
    const stats = await Doctor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get appointment count per specialization
    const appointmentStats = await Appointment.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $group: {
          _id: '$doctor.specialization',
          appointments: { $sum: 1 }
        }
      }
    ]);

    const appointmentMap = {};
    appointmentStats.forEach(s => {
      appointmentMap[s._id] = s.appointments;
    });

    const result = stats.map(s => ({
      ...s,
      appointments: appointmentMap[s._id] || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Specialization stats error:', error);
    res.status(500).json({ message: 'Failed to fetch specialization stats', error: error.message });
  }
});

// Get patient demographics
router.get('/patient-demographics', async (req, res) => {
  try {
    // Location distribution
    const locationStats = await User.aggregate([
      { $match: { role: 'patient', 'loginLocation.city': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$loginLocation.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Registration trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrends = await User.aggregate([
      { $match: { role: 'patient', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      locationDistribution: locationStats,
      registrationTrends
    });
  } catch (error) {
    console.error('Patient demographics error:', error);
    res.status(500).json({ message: 'Failed to fetch demographics', error: error.message });
  }
});

// Get hourly appointment distribution
router.get('/hourly-distribution', async (req, res) => {
  try {
    const distribution = await Appointment.aggregate([
      {
        $addFields: {
          hour: {
            $toInt: { $substr: ['$time', 0, 2] }
          }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing hours
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      const found = distribution.find(d => d._id === i);
      hourlyData.push({
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        count: found ? found.count : 0
      });
    }

    res.json(hourlyData);
  } catch (error) {
    console.error('Hourly distribution error:', error);
    res.status(500).json({ message: 'Failed to fetch hourly distribution', error: error.message });
  }
});

// Get review statistics
router.get('/review-stats', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      totalReviews: 0,
      avgRating: 0,
      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0
    });
  } catch (error) {
    console.error('Review stats error:', error);
    res.status(500).json({ message: 'Failed to fetch review stats', error: error.message });
  }
});

// Export analytics data
router.get('/export', async (req, res) => {
  try {
    const { type = 'appointments', startDate, endDate, format = 'json' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let data;

    switch (type) {
      case 'appointments':
        data = await Appointment.find({
          createdAt: { $gte: start, $lte: end }
        })
          .populate('userId', 'name email phone')
          .populate('doctorId', 'name specialization')
          .populate('clinicId', 'name')
          .lean();
        break;

      case 'revenue':
        data = await Payment.find({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'success'] }
        }).lean();
        break;

      case 'patients':
        data = await User.find({
          role: 'patient',
          createdAt: { $gte: start, $lte: end }
        }).select('-password').lean();
        break;

      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({ message: 'No data found for export' });
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(v => 
          typeof v === 'object' ? JSON.stringify(v) : v
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export-${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json({
      type,
      dateRange: { start, end },
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export data', error: error.message });
  }
});

module.exports = router;
