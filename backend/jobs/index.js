/**
 * Jobs Index - Central Job Management
 * ====================================
 * Exports all automated jobs for easy initialization
 */

const cleanupJobs = require('./cleanupJobs');
const reminderJobs = require('./reminderJobs');
const appointmentJobs = require('./appointmentJobs');
const analyticsJobs = require('./analyticsJobs');

/**
 * Initialize all automation jobs
 */
function initializeAllJobs() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 INITIALIZING ALL AUTOMATION JOBS FOR SCALABILITY');
  console.log('='.repeat(70) + '\n');

  try {
    // Initialize cleanup jobs
    cleanupJobs.initializeCleanupJobs();
    console.log('');

    // Initialize reminder jobs
    reminderJobs.initializeReminderJobs();
    console.log('');

    // Initialize appointment jobs
    appointmentJobs.initializeAppointmentJobs();
    console.log('');

    // Initialize analytics jobs
    analyticsJobs.initializeAnalyticsJobs();
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ ALL AUTOMATION JOBS INITIALIZED SUCCESSFULLY');
    console.log('='.repeat(70) + '\n');

    // Log summary
    console.log('📋 JOB SUMMARY:');
    console.log('   🧹 Cleanup Jobs:');
    console.log('      - Daily cleanup: 3:00 AM');
    console.log('      - Weekly deep cleanup: Sunday 4:00 AM');
    console.log('');
    console.log('   📧 Reminder Jobs:');
    console.log('      - 24h reminders: Every hour');
    console.log('      - 1h reminders: Every 15 minutes');
    console.log('');
    console.log('   📅 Appointment Jobs:');
    console.log('      - Auto-cancel expired: Every hour');
    console.log('      - Auto-complete past: Every 2 hours');
    console.log('      - Mark no-show: Every 30 minutes');
    console.log('      - Update queue: Every 15 minutes');
    console.log('');
    console.log('   📊 Analytics Jobs:');
    console.log('      - Daily appointments: Every hour');
    console.log('      - Doctor performance: Every 2 hours');
    console.log('      - Revenue analytics: Every hour');
    console.log('      - Patient engagement: Every 3 hours');
    console.log('      - Full refresh: Midnight daily');
    console.log('');

    return { success: true, message: 'All jobs initialized' };
  } catch (error) {
    console.error('❌ Error initializing jobs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get status of all jobs
 */
function getJobsStatus() {
  return {
    cleanupJobs: {
      enabled: true,
      schedule: 'Daily at 3:00 AM, Weekly on Sunday at 4:00 AM'
    },
    reminderJobs: {
      enabled: true,
      schedule: '24h: Every hour, 1h: Every 15 minutes'
    },
    appointmentJobs: {
      enabled: true,
      schedule: 'Auto-cancel: Every hour, Auto-complete: Every 2 hours, No-show: Every 30 min, Queue: Every 15 min'
    },
    analyticsJobs: {
      enabled: true,
      schedule: 'Various intervals (hourly to 3-hourly), Full refresh at midnight'
    }
  };
}

/**
 * Run all jobs manually (for testing or immediate execution)
 */
async function runAllJobsManually() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 RUNNING ALL JOBS MANUALLY');
  console.log('='.repeat(70) + '\n');

  const results = {
    timestamp: new Date(),
    jobs: {}
  };

  try {
    console.log('Running cleanup jobs...');
    results.jobs.cleanup = await cleanupJobs.runAllCleanupJobs();
    console.log('');

    console.log('Running reminder jobs...');
    results.jobs.reminders24h = await reminderJobs.send24HourReminders();
    results.jobs.reminders1h = await reminderJobs.send1HourReminders();
    console.log('');

    console.log('Running appointment jobs...');
    results.jobs.appointments = await appointmentJobs.runAllAppointmentJobs();
    console.log('');

    console.log('Running analytics jobs...');
    results.jobs.analytics = await analyticsJobs.runAllAnalyticsJobs();
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ ALL JOBS COMPLETED MANUALLY');
    console.log('='.repeat(70) + '\n');

    return results;
  } catch (error) {
    console.error('❌ Error running jobs manually:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeAllJobs,
  getJobsStatus,
  runAllJobsManually,
  cleanupJobs,
  reminderJobs,
  appointmentJobs,
  analyticsJobs
};
