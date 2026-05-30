/**
 * Analytics Jobs - Pre-aggregation for Performance
 * =================================================
 * Pre-calculates and caches frequently accessed analytics data
 * Reduces database load and improves dashboard response times
 * 
 * Jobs:
 * 1. Daily appointment statistics
 * 2. Doctor performance metrics
 * 3. Revenue analytics
 * 4. Patient engagement metrics
 */

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const cacheService = require('../services/cacheService');

/**
 * Pre-aggregate daily appointment statistics
 * Caches: total appointments, by status, by type, by clinic
 */
async function aggregateDailyAppointmentStats() {
  try {
    console.log('📊 Aggregating daily appointment statistics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total appointments today
    const totalToday = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // By status
    const byStatus = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // By consultation type
    const byType = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$consultationType',
          count: { $sum: 1 }
        }
      }
    ]);

    // By clinic
    const byClinic = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$clinicId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'clinics',
          localField: '_id',
          foreignField: '_id',
          as: 'clinic'
        }
      },
      {
        $unwind: '$clinic'
      },
      {
        $project: {
          clinicId: '$_id',
          clinicName: '$clinic.name',
          count: 1
        }
      }
    ]);

    const stats = {
      date: today.toISOString(),
      totalAppointments: totalToday,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byClinic: byClinic,
      generatedAt: new Date()
    };

    // Cache for 1 hour
    await cacheService.set('analytics:daily:appointments', JSON.stringify(stats), 3600);

    console.log(`✅ Daily appointment stats cached: ${totalToday} appointments`);
    return { success: true, stats };
  } catch (error) {
    console.error('❌ Error aggregating daily appointment stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pre-aggregate doctor performance metrics
 * Caches: appointments completed, average rating, revenue
 */
async function aggregateDoctorPerformance() {
  try {
    console.log('📊 Aggregating doctor performance metrics...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all active doctors
    const doctors = await Doctor.find({ isActive: true }).select('_id name specialization');

    const performanceData = [];

    for (const doctor of doctors) {
      // Appointments in last 30 days
      const appointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        date: { $gte: thirtyDaysAgo },
        status: 'completed'
      });

      // Revenue in last 30 days
      const revenueData = await Appointment.aggregate([
        {
          $match: {
            doctorId: doctor._id,
            date: { $gte: thirtyDaysAgo },
            status: 'completed',
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$payment.totalAmount' }
          }
        }
      ]);

      const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

      // Average rating (if Review model exists)
      let avgRating = 0;
      try {
        const Review = require('../models/Review');
        const ratingData = await Review.aggregate([
          {
            $match: {
              doctorId: doctor._id
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]);
        avgRating = ratingData.length > 0 ? ratingData[0].avgRating : 0;
      } catch (err) {
        // Review model might not exist
      }

      performanceData.push({
        doctorId: doctor._id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        appointmentsCompleted: appointments,
        revenue: revenue,
        averageRating: avgRating,
        period: '30 days'
      });
    }

    // Sort by appointments completed
    performanceData.sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted);

    const result = {
      doctors: performanceData,
      generatedAt: new Date(),
      period: '30 days'
    };

    // Cache for 2 hours
    await cacheService.set('analytics:doctor:performance', JSON.stringify(result), 7200);

    console.log(`✅ Doctor performance metrics cached for ${doctors.length} doctors`);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Error aggregating doctor performance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pre-aggregate revenue analytics
 * Caches: daily revenue, monthly revenue, payment methods
 */
async function aggregateRevenueAnalytics() {
  try {
    console.log('📊 Aggregating revenue analytics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Today's revenue
    const todayRevenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // This month's revenue
    const thisMonthRevenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: thisMonth },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Last month's revenue
    const lastMonthRevenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: lastMonth, $lt: thisMonth },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // By payment method
    const byPaymentMethod = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: thisMonth },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$payment.paymentMethod',
          total: { $sum: '$payment.totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const analytics = {
      today: {
        revenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
        appointments: todayRevenue.length > 0 ? todayRevenue[0].count : 0
      },
      thisMonth: {
        revenue: thisMonthRevenue.length > 0 ? thisMonthRevenue[0].total : 0,
        appointments: thisMonthRevenue.length > 0 ? thisMonthRevenue[0].count : 0
      },
      lastMonth: {
        revenue: lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0,
        appointments: lastMonthRevenue.length > 0 ? lastMonthRevenue[0].count : 0
      },
      byPaymentMethod: byPaymentMethod.reduce((acc, item) => {
        acc[item._id || 'unknown'] = {
          revenue: item.total,
          count: item.count
        };
        return acc;
      }, {}),
      generatedAt: new Date()
    };

    // Cache for 1 hour
    await cacheService.set('analytics:revenue', JSON.stringify(analytics), 3600);

    console.log(`✅ Revenue analytics cached: Today ₹${analytics.today.revenue}, This Month ₹${analytics.thisMonth.revenue}`);
    return { success: true, analytics };
  } catch (error) {
    console.error('❌ Error aggregating revenue analytics:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pre-aggregate patient engagement metrics
 * Caches: new patients, returning patients, active users
 */
async function aggregatePatientEngagement() {
  try {
    console.log('📊 Aggregating patient engagement metrics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // New patients (registered in last 30 days)
    const newPatients = await User.countDocuments({
      role: 'patient',
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Active patients (had appointment in last 30 days)
    const activePatients = await Appointment.distinct('userId', {
      date: { $gte: thirtyDaysAgo },
      status: { $in: ['confirmed', 'completed'] }
    });

    // Returning patients (had >1 appointment)
    const returningPatients = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          appointmentCount: { $sum: 1 }
        }
      },
      {
        $match: {
          appointmentCount: { $gt: 1 }
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Total registered patients
    const totalPatients = await User.countDocuments({ role: 'patient' });

    const engagement = {
      totalPatients,
      newPatients,
      activePatients: activePatients.length,
      returningPatients: returningPatients.length > 0 ? returningPatients[0].total : 0,
      period: '30 days',
      generatedAt: new Date()
    };

    // Cache for 2 hours
    await cacheService.set('analytics:patient:engagement', JSON.stringify(engagement), 7200);

    console.log(`✅ Patient engagement metrics cached: ${newPatients} new, ${activePatients.length} active`);
    return { success: true, engagement };
  } catch (error) {
    console.error('❌ Error aggregating patient engagement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Run all analytics jobs
 */
async function runAllAnalyticsJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RUNNING ALL ANALYTICS JOBS');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(60) + '\n');

  const results = {
    timestamp: new Date(),
    jobs: {}
  };

  results.jobs.dailyAppointments = await aggregateDailyAppointmentStats();
  results.jobs.doctorPerformance = await aggregateDoctorPerformance();
  results.jobs.revenue = await aggregateRevenueAnalytics();
  results.jobs.patientEngagement = await aggregatePatientEngagement();

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL ANALYTICS JOBS COMPLETED');
  console.log('='.repeat(60) + '\n');

  return results;
}

/**
 * Initialize analytics job scheduler
 */
function initializeAnalyticsJobs() {
  console.log('📊 Initializing analytics job scheduler...');

  // Daily appointment stats - every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running daily appointment stats aggregation...');
    await aggregateDailyAppointmentStats();
  });

  // Doctor performance - every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Running doctor performance aggregation...');
    await aggregateDoctorPerformance();
  });

  // Revenue analytics - every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running revenue analytics aggregation...');
    await aggregateRevenueAnalytics();
  });

  // Patient engagement - every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ Running patient engagement aggregation...');
    await aggregatePatientEngagement();
  });

  // Run all analytics at midnight for fresh daily data
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running midnight analytics refresh...');
    await runAllAnalyticsJobs();
  });

  console.log('✅ Analytics jobs scheduled:');
  console.log('   - Daily appointments: Every hour');
  console.log('   - Doctor performance: Every 2 hours');
  console.log('   - Revenue analytics: Every hour');
  console.log('   - Patient engagement: Every 3 hours');
  console.log('   - Full refresh: Midnight daily');
}

module.exports = {
  initializeAnalyticsJobs,
  runAllAnalyticsJobs,
  aggregateDailyAppointmentStats,
  aggregateDoctorPerformance,
  aggregateRevenueAnalytics,
  aggregatePatientEngagement
};
