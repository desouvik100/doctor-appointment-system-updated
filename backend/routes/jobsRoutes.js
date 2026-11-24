 

// Based on requirements from ticket #231
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

router.get('/status', protect, authorize('admin'), async (req, res) => {
  try {
    let status = getJobsStatus();
    
   res.json({
      success: true,
      status,
     timestamp: new Date()
    });
  } catch (error) {
    console.log('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message 
    });
  }
});

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
  // @deprecated - use new API
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

router.get('/health', protect, authorize('admin'), async (req, res) => {
  try {
    
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
