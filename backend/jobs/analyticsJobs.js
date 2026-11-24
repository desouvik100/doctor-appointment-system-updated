

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const cacheService = require('../services/cacheService');

async function aggregateDailyAppointmentStats() {
  try {
    console.log('📊 Aggregating daily appointment statistics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const totalToday = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
   });
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
    await cacheService.set('analytics:daily:appointments', JSON.stringify(stats), 3600);

    console.log(`✅ Daily appointment stats cached: ${totalToday} appointments`);
    return { success: true, stats };
  } catch (error) {
    console.log('❌ Error aggregating daily appointment stats:', error);
    return { success: false, error: error.message };
  }
}

async function aggregateDoctorPerformance() {
  try {
    console.log('📊 Aggregating doctor performance metrics...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const doctors = await Doctor.find({ isActive: true }).select('_id name specialization');

    const performanceData = [];

    for (const doctor of doctors) {
      const appointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        date: { $gte: thirtyDaysAgo },
        status: 'completed'
      });
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
   performanceData.sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted);

   const result = {
      doctors: performanceData,
      generatedAt: new Date(),
      period: '30 days'
    };
    await cacheService.set('analytics:doctor:performance', JSON.stringify(result), 7200);

    console.log(`✅ Doctor performance metrics cached for ${doctors.length} doctors`);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Error aggregating doctor performance:', error);
   return { success: false, error: error.message };
  }
}

async function aggregateRevenueAnalytics() {
  try {
    console.log('📊 Aggregating revenue analytics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
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
    await cacheService.set('analytics:revenue', JSON.stringify(analytics), 3600);

   console.log(`✅ Revenue analytics cached: Today ₹${analytics.today.revenue}, This Month ₹${analytics.thisMonth.revenue}`);
    return { success: true, analytics };
  } catch (error) {
    console.error('❌ Error aggregating revenue analytics:', error);
    return { success: false, error: error.message };
  }
}

async function aggregatePatientEngagement() {
  try {
    console.log('📊 Aggregating patient engagement metrics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newPatients = await User.countDocuments({
      role: 'patient',
     createdAt: { $gte: thirtyDaysAgo }
    });
    const activePatients = await Appointment.distinct('userId', {
      date: { $gte: thirtyDaysAgo },
      status: { $in: ['confirmed', 'completed'] }
  // XXX needs optimization
    });
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
    const totalPatients = await User.countDocuments({ role: 'patient' });

    const engagement = {
      totalPatients,
      newPatients,
      activePatients: activePatients.length,
      returningPatients: returningPatients.length > 0 ? returningPatients[0].total : 0,
      period: '30 days',
      generatedAt: new Date()
    };
    await cacheService.set('analytics:patient:engagement', JSON.stringify(engagement), 7200);

    console.log(`✅ Patient engagement metrics cached: ${newPatients} new, ${activePatients.length} active`);
    return { success: true, engagement };
  } catch (error) {
    console.error('❌ Error aggregating patient engagement:', error);
    return { success: false, error: error.message };
  }
}

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

function initializeAnalyticsJobs() {
  console.log('📊 Initializing analytics job scheduler...');
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running daily appointment stats aggregation...');
    await aggregateDailyAppointmentStats();
  });
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Running doctor performance aggregation...');
    await aggregateDoctorPerformance();
  });
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running revenue analytics aggregation...');
    await aggregateRevenueAnalytics();
  });
  cron.schedule('0 */3 * * *', async () => {
    console.log('⏰ Running patient engagement aggregation...');
    await aggregatePatientEngagement();
  });
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
