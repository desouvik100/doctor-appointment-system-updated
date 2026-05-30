/**
 * Cleanup Jobs - Automated Data Cleanup for Scalability
 * ======================================================
 * Removes old/expired data to keep database lean and performant
 * 
 * Jobs:
 * 1. Delete old completed appointments (>90 days)
 * 2. Delete old read notifications (>30 days)
 * 3. Delete expired tokens (>24 hours)
 * 4. Clean up expired QR codes and queue entries
 * 5. Archive old audit logs (>180 days)
 */

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

/**
 * Delete old completed appointments (>90 days)
 * Keeps database lean while retaining recent history
 */
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
    console.error('❌ Error cleaning up old appointments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete old cancelled appointments (>60 days)
 * Cancelled appointments can be removed sooner than completed ones
 */
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

/**
 * Delete old read notifications (>30 days)
 * Unread notifications are kept longer for user visibility
 */
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

/**
 * Delete very old unread notifications (>90 days)
 * Even unread notifications should be cleaned up eventually
 */
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

/**
 * Clean up expired tokens and queue entries
 * Removes expired appointment tokens and queue data
 */
async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting cleanup: Expired tokens and queue entries...');
    
    const now = new Date();

    // Clear expired tokens
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

/**
 * Archive old audit logs (>180 days)
 * Moves old audit logs to archive collection or deletes them
 */
async function archiveOldAuditLogs() {
  try {
    console.log('🧹 Starting cleanup: Old audit logs...');
    
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

    // Check if AuditLog model exists
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

/**
 * Clean up old no-show appointments (>30 days)
 * Remove no-show records after 30 days
 */
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

/**
 * Run all cleanup jobs
 */
async function runAllCleanupJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 RUNNING ALL CLEANUP JOBS');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(60) + '\n');

  const results = {
    timestamp: new Date(),
    jobs: {}
  };

  // Run all cleanup jobs
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

/**
 * Initialize cleanup job scheduler
 * Runs daily at 3 AM
 */
function initializeCleanupJobs() {
  console.log('🧹 Initializing cleanup job scheduler...');

  // Run daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Scheduled cleanup job triggered');
    await runAllCleanupJobs();
  });

  // Also run weekly deep cleanup on Sundays at 4 AM
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
