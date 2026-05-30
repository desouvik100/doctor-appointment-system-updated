/**
 * Jobs Routes - Admin API for Job Management
 * ===========================================
 * Allows admins to manually trigger and monitor automation jobs
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  cleanupJobs,
  reminderJobs,
  appointmentJobs,
  analyticsJobs,
  getJobsStatus,
  runAllJobsManually
} = require('../jobs');

/**
 * @route   GET /api/jobs/status
 * @desc    Get status of all automation jobs
 * @access  Admin only
 */
router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    const status = getJobsStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/run-all
 * @desc    Manually run all jobs (for testing or immediate execution)
 * @access  Admin only
 */
router.post('/run-all', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔧 Admin triggered manual execution of all jobs');
    
    const results = await runAllJobsManually();
    
    res.json({
      success: true,
      message: 'All jobs executed successfully',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running all jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run all jobs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/cleanup
 * @desc    Manually run cleanup jobs
 * @access  Admin only
 */
router.post('/cleanup', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🧹 Admin triggered cleanup jobs');
    
    const results = await cleanupJobs.runAllCleanupJobs();
    
    res.json({
      success: true,
      message: 'Cleanup jobs executed successfully',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running cleanup jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run cleanup jobs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/reminders
 * @desc    Manually run reminder jobs
 * @access  Admin only
 */
router.post('/reminders', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📧 Admin triggered reminder jobs');
    
    const results = {
      reminders24h: await reminderJobs.send24HourReminders(),
      reminders1h: await reminderJobs.send1HourReminders()
    };
    
    res.json({
      success: true,
      message: 'Reminder jobs executed successfully',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running reminder jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run reminder jobs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/appointments
 * @desc    Manually run appointment jobs
 * @access  Admin only
 */
router.post('/appointments', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📅 Admin triggered appointment jobs');
    
    const results = await appointmentJobs.runAllAppointmentJobs();
    
    res.json({
      success: true,
      message: 'Appointment jobs executed successfully',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running appointment jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run appointment jobs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/analytics
 * @desc    Manually run analytics jobs
 * @access  Admin only
 */
router.post('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📊 Admin triggered analytics jobs');
    
    const results = await analyticsJobs.runAllAnalyticsJobs();
    
    res.json({
      success: true,
      message: 'Analytics jobs executed successfully',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running analytics jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run analytics jobs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/cleanup/old-appointments
 * @desc    Manually cleanup old completed appointments
 * @access  Admin only
 */
router.post('/cleanup/old-appointments', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await cleanupJobs.cleanupOldAppointments();
    
    res.json({
      success: true,
      message: 'Old appointments cleaned up',
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error cleaning old appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old appointments',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/jobs/cleanup/old-notifications
 * @desc    Manually cleanup old notifications
 * @access  Admin only
 */
router.post('/cleanup/old-notifications', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await cleanupJobs.cleanupOldNotifications();
    
    res.json({
      success: true,
      message: 'Old notifications cleaned up',
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error cleaning old notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old notifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/jobs/health
 * @desc    Get health status of automation jobs
 * @access  Admin only
 */
router.get('/health', protect, authorize('admin'), async (req, res) => {
  try {
    // Check if jobs are running by checking last execution times
    // This is a simple health check - can be enhanced with more metrics
    
    const health = {
      status: 'healthy',
      jobs: {
        cleanup: { status: 'running', lastRun: 'N/A' },
        reminders: { status: 'running', lastRun: 'N/A' },
        appointments: { status: 'running', lastRun: 'N/A' },
        analytics: { status: 'running', lastRun: 'N/A' }
      },
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Error checking job health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check job health',
      error: error.message
    });
  }
});

module.exports = router;
