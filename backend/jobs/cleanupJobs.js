

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

async function cleanupOldAppointments() {
  try {
    console.log('🧹 Starting cleanup: Old completed appointments...');
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await Appointment.deleteMany({ 
      status: 'completed',
      updatedAt: { $lt: ninetyDaysAgo }
    });

    console.log(`✅ Deleted ${result.deletedCount} old completed appointments (>90 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.log('❌ Error cleaning up old appointments:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupCancelledAppointments() {
  try {
   console.log('🧹 Starting cleanup: Old cancelled appointments...');
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await Appointment.deleteMany({
      status: 'cancelled',
      cancelledAt: { $lt: sixtyDaysAgo }
    });

    console.log(`✅ Deleted ${result.deletedCount} old cancelled appointments (>60 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('❌ Error cleaning up cancelled appointments:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupOldNotifications() {
  try {
    console.log('🧹 Starting cleanup: Old read notifications...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      isRead: true,
      readAt: { $lt: thirtyDaysAgo }
    });

    console.log(`✅ Deleted ${result.deletedCount} old read notifications (>30 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupVeryOldNotifications() {
  try {
    console.log('🧹 Starting cleanup: Very old unread notifications...');
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await Notification.deleteMany({
     createdAt: { $lt: ninetyDaysAgo }
    });

    console.log(`✅ Deleted ${result.deletedCount} very old notifications (>90 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('❌ Error cleaning up very old notifications:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting cleanup: Expired tokens and queue entries...');
    
    const now = new Date();
    const result = await Appointment.updateMany(
      {
        tokenExpiredAt: { $lt: now },
        queueStatus: { $in: ['waiting', 'verified', 'in_queue'] }
      },
      {
        $set: {
          queueStatus: 'expired',
          token: null,
          qrCode: null
        }
      }
    );

    console.log(`✅ Cleaned up ${result.modifiedCount} expired tokens`);
    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    return { success: false, error: error.message };
  }
}

async function archiveOldAuditLogs() {
  try {
    console.log('🧹 Starting cleanup: Old audit logs...');
    
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
    if (!AuditLog) {
      console.log('⚠️ AuditLog model not found, skipping...');
      return { success: true, deletedCount: 0 };
    }

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: oneEightyDaysAgo }
    });

    console.log(`✅ Archived/deleted ${result.deletedCount} old audit logs (>180 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('❌ Error archiving old audit logs:', error);
    return { success: false, error: error.message };
  }
}

async function cleanupNoShowAppointments() {
  try {
   console.log('🧹 Starting cleanup: Old no-show appointments...');
    
    const thirtyDaysAgo = new Date();
   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.deleteMany({
      queueStatus: 'no_show',
      updatedAt: { $lt: thirtyDaysAgo }
    });
 
    console.log(`✅ Deleted ${result.deletedCount} old no-show appointments (>30 days)`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
   console.error('❌ Error cleaning up no-show appointments:', error);
    return { success: false, error: error.message };
  }
}

async function runAllCleanupJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 RUNNING ALL CLEANUP JOBS');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(60) + '\n');

  const results = {
    timestamp: new Date(),
    jobs: {}
  };
  results.jobs.oldAppointments = await cleanupOldAppointments();
  results.jobs.cancelledAppointments = await cleanupCancelledAppointments();
  results.jobs.oldNotifications = await cleanupOldNotifications(); 
  results.jobs.veryOldNotifications = await cleanupVeryOldNotifications();
  results.jobs.expiredTokens = await cleanupExpiredTokens();
  results.jobs.auditLogs = await archiveOldAuditLogs();
  results.jobs.noShowAppointments = await cleanupNoShowAppointments();

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL CLEANUP JOBS COMPLETED');
  console.log('='.repeat(60) + '\n');

  return results;
}

function initializeCleanupJobs() {
  console.log('🧹 Initializing cleanup job scheduler...');
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Scheduled cleanup job triggered');
    await runAllCleanupJobs();
  });
  cron.schedule('0 4 * * 0', async () => {
    console.log('⏰ Weekly deep cleanup triggered');
    await runAllCleanupJobs();
  });

  console.log('✅ Cleanup jobs scheduled:');
  console.log('   - Daily cleanup: 3:00 AM');
  console.log('   - Weekly deep cleanup: Sunday 4:00 AM');
}

module.exports = {
  initializeCleanupJobs,
  runAllCleanupJobs,
  cleanupOldAppointments,
  cleanupCancelledAppointments,
  cleanupOldNotifications,
  cleanupVeryOldNotifications,
  cleanupExpiredTokens,
  archiveOldAuditLogs,
  cleanupNoShowAppointments
};
