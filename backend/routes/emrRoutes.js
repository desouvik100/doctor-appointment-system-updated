/**
 * EMR Routes
 * Handles EMR subscription, screen access, and core EMR functionality
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const EMRSubscriptionService = require('../services/emrSubscriptionService');
const { 
  checkEMRSubscription, 
  checkEMRAccess, 
  getAvailableScreens 
} = require('../middleware/emrAccess');
const { 
  EMR_SCREENS, 
  SUBSCRIPTION_PLANS,
  getScreensForPlan,
  getScreensForRole 
} = require('../config/emrConfig');

// Helper function to check if user has access to patient data
// Allows: admin, doctor, staff, receptionist, or the patient themselves
const hasPatientAccess = (userRole, userId, patientId) => {
  const allowedRoles = ['admin', 'doctor', 'staff', 'receptionist'];
  return allowedRoles.includes(userRole) || userId === patientId;
};

// ===== SUBSCRIPTION ROUTES =====

/**
 * Get all available EMR plans
 * Public route for plan comparison
 */
router.get('/plans', (req, res) => {
  try {
    const plans = EMRSubscriptionService.getPlans();
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plans',
      error: error.message
    });
  }
});

/**
 * Get specific plan details
 */
router.get('/plans/:planId', (req, res) => {
  try {
    const plan = EMRSubscriptionService.getPlanDetails(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Get screens for this plan
    const screens = getScreensForPlan(req.params.planId);
    
    res.json({
      success: true,
      plan,
      screens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plan details',
      error: error.message
    });
  }
});

/**
 * Create subscription order
 */
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { clinicId, planId, duration } = req.body;
    const userId = req.user.id;
    
    if (!clinicId || !planId || !duration) {
      return res.status(400).json({
        success: false,
        message: 'clinicId, planId, and duration are required'
      });
    }
    
    const orderData = await EMRSubscriptionService.createSubscriptionOrder(
      clinicId, 
      planId, 
      duration, 
      userId
    );
    
    res.json({
      success: true,
      message: 'Subscription order created',
      ...orderData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating subscription order'
    });
  }
});

/**
 * Verify payment and activate subscription
 */
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const result = await EMRSubscriptionService.verifyAndActivate(req.body);
    
    res.json({
      success: true,
      message: 'Subscription activated successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
});

/**
 * Get clinic's active subscription
 */
router.get('/subscription/:clinicId', verifyToken, async (req, res) => {
  try {
    const subscription = await EMRSubscriptionService.getActiveSubscription(
      req.params.clinicId
    );
    
    res.json({
      success: true,
      hasSubscription: !!subscription,
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
});

/**
 * Get subscription history
 */
router.get('/subscription/:clinicId/history', verifyToken, async (req, res) => {
  try {
    const history = await EMRSubscriptionService.getSubscriptionHistory(
      req.params.clinicId
    );
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription history',
      error: error.message
    });
  }
});

/**
 * Upgrade subscription plan
 */
router.post('/upgrade', verifyToken, async (req, res) => {
  try {
    const { clinicId, newPlanId } = req.body;
    const userId = req.user.id;
    
    const orderData = await EMRSubscriptionService.upgradePlan(
      clinicId, 
      newPlanId, 
      userId
    );
    
    res.json({
      success: true,
      message: 'Upgrade order created',
      ...orderData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating upgrade order'
    });
  }
});

/**
 * Renew subscription
 */
router.post('/renew', verifyToken, async (req, res) => {
  try {
    const { clinicId, duration } = req.body;
    const userId = req.user.id;
    
    const orderData = await EMRSubscriptionService.renewSubscription(
      clinicId, 
      duration, 
      userId
    );
    
    res.json({
      success: true,
      message: 'Renewal order created',
      ...orderData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating renewal order'
    });
  }
});

/**
 * Toggle auto-renewal
 */
router.post('/auto-renew', verifyToken, async (req, res) => {
  try {
    const { clinicId, enabled } = req.body;
    
    const result = await EMRSubscriptionService.toggleAutoRenew(clinicId, enabled);
    
    res.json({
      success: true,
      message: `Auto-renewal ${enabled ? 'enabled' : 'disabled'}`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating auto-renewal'
    });
  }
});

// ===== SCREEN ACCESS ROUTES =====

/**
 * Get available screens for user
 */
router.get('/screens/:clinicId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { clinicId } = req.params;
    
    const result = await getAvailableScreens(clinicId, userId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available screens',
      error: error.message
    });
  }
});

/**
 * Check access to specific screen
 */
router.get('/access/:clinicId/:screenId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { clinicId, screenId } = req.params;
    
    const result = await getAvailableScreens(clinicId, userId);
    
    if (result.error) {
      return res.status(403).json({
        success: false,
        hasAccess: false,
        message: result.error
      });
    }
    
    const hasAccess = result.screens.some(s => s.id === screenId);
    const isLocked = result.lockedScreens?.some(s => s.id === screenId);
    
    if (hasAccess) {
      const screen = result.screens.find(s => s.id === screenId);
      return res.json({
        success: true,
        hasAccess: true,
        screen
      });
    }
    
    if (isLocked) {
      const screen = result.lockedScreens.find(s => s.id === screenId);
      return res.json({
        success: true,
        hasAccess: false,
        locked: true,
        screen,
        upgrade: {
          requiredPlan: screen.plan,
          url: `/emr/upgrade?plan=${screen.plan}`
        }
      });
    }
    
    res.json({
      success: true,
      hasAccess: false,
      message: 'Screen not available for your role'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking screen access',
      error: error.message
    });
  }
});

/**
 * Get all EMR screens (for admin/documentation)
 */
router.get('/all-screens', (req, res) => {
  try {
    const screens = Object.values(EMR_SCREENS);
    
    // Group by plan
    const grouped = {
      basic: screens.filter(s => s.plan === 'basic'),
      standard: screens.filter(s => s.plan === 'standard'),
      advanced: screens.filter(s => s.plan === 'advanced')
    };
    
    res.json({
      success: true,
      screens,
      grouped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching screens',
      error: error.message
    });
  }
});

// ===== EMR DASHBOARD ROUTES =====

const EMRVisit = require('../models/EMRVisit');
const User = require('../models/User');
const EMRAuditLog = require('../models/EMRAuditLog');
const Appointment = require('../models/Appointment');
const FollowUp = require('../models/FollowUp');

/**
 * Get EMR dashboard stats
 * Requires active subscription with advanced plan
 */
router.get('/dashboard/:clinicId/stats', 
  verifyToken, 
  checkEMRAccess('emr_dashboard'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const [
        todayVisits,
        completedToday,
        waitingPatients,
        totalPatients,
        pendingFollowUps,
        monthlyVisits
      ] = await Promise.all([
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: today, $lt: tomorrow }
        }),
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }),
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: today, $lt: tomorrow },
          status: 'waiting'
        }),
        User.countDocuments({
          $or: [
            { registeredByClinic: clinicId },
            { 'clinicLinks.clinicId': clinicId }
          ]
        }),
        FollowUp ? FollowUp.countDocuments({
          clinicId,
          status: 'pending',
          scheduledDate: { $lte: tomorrow }
        }).catch(() => 0) : 0,
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: monthStart }
        })
      ]);
      
      res.json({
        success: true,
        stats: {
          todayVisits,
          completedToday,
          waitingPatients,
          totalPatients,
          pendingFollowUps,
          monthlyVisits
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard stats',
        error: error.message
      });
    }
  }
);

/**
 * Get today's appointments for dashboard
 */
router.get('/dashboard/:clinicId/today-appointments', 
  verifyToken, 
  checkEMRAccess('emr_dashboard'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Try to get from Appointments first, fallback to EMRVisit
      let appointments = [];
      
      try {
        appointments = await Appointment.find({
          clinicId,
          appointmentDate: { $gte: today, $lt: tomorrow }
        })
        .populate('patientId', 'name phone')
        .populate('doctorId', 'name specialization')
        .sort({ appointmentTime: 1 })
        .limit(20)
        .lean();
      } catch (e) {
        // Fallback to EMRVisit
        appointments = await EMRVisit.find({
          clinicId,
          visitDate: { $gte: today, $lt: tomorrow }
        })
        .populate('patientId', 'name phone')
        .populate('doctorId', 'name specialization')
        .sort({ visitDate: 1 })
        .limit(20)
        .lean();
      }
      
      res.json({
        success: true,
        appointments: appointments.map(apt => ({
          _id: apt._id,
          appointmentTime: apt.appointmentTime || apt.visitDate,
          visitDate: apt.visitDate || apt.appointmentDate,
          patientName: apt.patientId?.name || apt.patientName,
          patientId: apt.patientId,
          doctorName: apt.doctorId?.name || apt.doctorName,
          doctorId: apt.doctorId,
          status: apt.status || 'scheduled'
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
        error: error.message
      });
    }
  }
);

/**
 * Get recent activity for dashboard
 */
router.get('/dashboard/:clinicId/recent-activity', 
  verifyToken, 
  checkEMRAccess('emr_dashboard'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      
      const activities = await EMRAuditLog.find({ clinicId })
        .sort({ timestamp: -1 })
        .limit(15)
        .lean();
      
      res.json({
        success: true,
        activities
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching recent activity',
        error: error.message
      });
    }
  }
);

/**
 * Get EMR dashboard data (legacy route)
 * Requires active subscription
 */
router.get('/dashboard/:clinicId', 
  verifyToken, 
  checkEMRAccess('emr_dashboard'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = {
        todayVisits: await EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: today }
        }),
        totalPatients: await User.countDocuments({
          registeredByClinic: clinicId
        }),
        subscription: req.emrSubscription
      };
      
      res.json({
        success: true,
        dashboard: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard',
        error: error.message
      });
    }
  }
);

// ===== ANALYTICS ROUTES =====

/**
 * Get audit logs for clinic
 */
router.get('/audit/:clinicId',
  verifyToken,
  checkEMRAccess('audit_logs'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { 
        page = 1, 
        limit = 50, 
        startDate, 
        endDate, 
        action, 
        entityType, 
        userId,
        search 
      } = req.query;
      
      const options = {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };
      
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) {
        options.endDate = new Date(endDate);
        options.endDate.setHours(23, 59, 59, 999);
      }
      if (action) options.action = action;
      if (entityType) options.entityType = entityType;
      if (userId) options.userId = userId;
      
      const result = await EMRAuditLog.getClinicLogs(clinicId, options);
      
      res.json({
        success: true,
        logs: result.logs,
        total: result.total,
        page: parseInt(page),
        pages: Math.ceil(result.total / parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching audit logs',
        error: error.message
      });
    }
  }
);

/**
 * Get patient audit trail
 */
router.get('/audit/:clinicId/patient/:patientId',
  verifyToken,
  checkEMRAccess('audit_logs'),
  async (req, res) => {
    try {
      const { clinicId, patientId } = req.params;
      
      const logs = await EMRAuditLog.getPatientAuditTrail(patientId, clinicId);
      
      res.json({
        success: true,
        logs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching patient audit trail',
        error: error.message
      });
    }
  }
);

/**
 * Get analytics overview
 */
router.get('/analytics/:clinicId/overview',
  verifyToken,
  checkEMRAccess('analytics_reports'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - (end - start) / (24 * 60 * 60 * 1000));
      
      const [totalVisits, previousPeriodVisits, newPatients, visitTypeAgg] = await Promise.all([
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: start, $lte: end }
        }),
        EMRVisit.countDocuments({
          clinicId,
          visitDate: { $gte: previousStart, $lt: start }
        }),
        User.countDocuments({
          registeredByClinic: clinicId,
          createdAt: { $gte: start, $lte: end }
        }),
        EMRVisit.aggregate([
          { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), visitDate: { $gte: start, $lte: end } } },
          { $group: { _id: '$visitType', count: { $sum: 1 } } }
        ])
      ]);
      
      const daysDiff = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
      
      res.json({
        success: true,
        stats: {
          totalVisits,
          previousPeriodVisits,
          newPatients,
          avgVisitsPerDay: totalVisits / daysDiff,
          totalRevenue: 0, // Would need Payment model integration
          visitTypeDistribution: visitTypeAgg.map(v => ({ type: v._id || 'unknown', count: v.count }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics overview',
        error: error.message
      });
    }
  }
);

/**
 * Get visit trends
 */
router.get('/analytics/:clinicId/visit-trends',
  verifyToken,
  checkEMRAccess('analytics_reports'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      const trends = await EMRVisit.aggregate([
        { 
          $match: { 
            clinicId: require('mongoose').Types.ObjectId(clinicId), 
            visitDate: { $gte: start, $lte: end } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 31 }
      ]);
      
      res.json({
        success: true,
        trends: trends.map(t => ({
          date: t._id,
          label: new Date(t._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          count: t.count
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching visit trends',
        error: error.message
      });
    }
  }
);

/**
 * Get patient statistics
 */
router.get('/analytics/:clinicId/patient-stats',
  verifyToken,
  checkEMRAccess('analytics_reports'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      const [totalPatients, newPatients, walkInPatients, genderAgg, ageAgg] = await Promise.all([
        User.countDocuments({
          $or: [
            { registeredByClinic: clinicId },
            { 'clinicLinks.clinicId': clinicId }
          ]
        }),
        User.countDocuments({
          registeredByClinic: clinicId,
          createdAt: { $gte: start, $lte: end }
        }),
        User.countDocuments({
          registeredByClinic: clinicId,
          registrationType: 'walk_in'
        }),
        User.aggregate([
          { $match: { $or: [{ registeredByClinic: require('mongoose').Types.ObjectId(clinicId) }] } },
          { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $match: { $or: [{ registeredByClinic: require('mongoose').Types.ObjectId(clinicId) }], dateOfBirth: { $exists: true } } },
          {
            $project: {
              age: {
                $floor: {
                  $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365.25 * 24 * 60 * 60 * 1000]
                }
              }
            }
          },
          {
            $bucket: {
              groupBy: '$age',
              boundaries: [0, 18, 30, 45, 60, 100],
              default: 'Unknown',
              output: { count: { $sum: 1 } }
            }
          }
        ])
      ]);
      
      const ageRanges = { 0: '0-17', 18: '18-29', 30: '30-44', 45: '45-59', 60: '60+', Unknown: 'Unknown' };
      
      res.json({
        success: true,
        stats: {
          totalPatients,
          newPatients,
          returningPatients: totalPatients - newPatients,
          walkInPatients,
          genderDistribution: genderAgg.map(g => ({ gender: g._id || 'unknown', count: g.count })),
          ageDistribution: ageAgg.map(a => ({ range: ageRanges[a._id] || a._id, count: a.count }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching patient stats',
        error: error.message
      });
    }
  }
);

/**
 * Get revenue statistics
 */
router.get('/analytics/:clinicId/revenue',
  verifyToken,
  checkEMRAccess('analytics_reports'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      // Try to get Payment model if it exists
      let Payment;
      try {
        Payment = require('../models/Payment');
      } catch (e) {
        Payment = null;
      }
      
      let revenueData = {
        totalRevenue: 0,
        avgRevenuePerDay: 0,
        avgRevenuePerVisit: 0,
        totalTransactions: 0,
        bySource: [],
        trend: []
      };
      
      if (Payment) {
        const [totalAgg, sourceAgg, trendAgg] = await Promise.all([
          Payment.aggregate([
            { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]),
          Payment.aggregate([
            { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $group: { _id: '$paymentMethod', amount: { $sum: '$amount' } } }
          ]),
          Payment.aggregate([
            { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), createdAt: { $gte: start, $lte: end }, status: 'completed' } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' } } },
            { $sort: { _id: 1 } },
            { $limit: 31 }
          ])
        ]);
        
        const daysDiff = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
        const visitCount = await EMRVisit.countDocuments({ clinicId, visitDate: { $gte: start, $lte: end } });
        
        revenueData = {
          totalRevenue: totalAgg[0]?.total || 0,
          avgRevenuePerDay: (totalAgg[0]?.total || 0) / daysDiff,
          avgRevenuePerVisit: visitCount > 0 ? (totalAgg[0]?.total || 0) / visitCount : 0,
          totalTransactions: totalAgg[0]?.count || 0,
          bySource: sourceAgg.map(s => ({ source: s._id || 'other', amount: s.amount })),
          trend: trendAgg.map(t => ({
            date: t._id,
            label: new Date(t._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            amount: t.amount
          }))
        };
      }
      
      res.json({
        success: true,
        stats: revenueData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching revenue stats',
        error: error.message
      });
    }
  }
);

// ===== STAFF MANAGEMENT ROUTES =====

const ClinicStaffService = require('../services/clinicStaffService');

/**
 * Get clinic staff list
 */
router.get('/staff/:clinicId',
  verifyToken,
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const { role, isActive, page, limit, search } = req.query;
      
      const result = await ClinicStaffService.getClinicStaff(clinicId, {
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        search
      });
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching staff',
        error: error.message
      });
    }
  }
);

/**
 * Invite staff member
 */
router.post('/staff/:clinicId/invite',
  verifyToken,
  checkEMRAccess('staff_management'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      const invitedBy = req.user.id;
      
      const staff = await ClinicStaffService.inviteStaff(clinicId, req.body, invitedBy);
      
      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error inviting staff'
      });
    }
  }
);

/**
 * Update staff role
 */
router.put('/staff/:clinicId/:staffId/role',
  verifyToken,
  checkEMRAccess('staff_management'),
  async (req, res) => {
    try {
      const { staffId } = req.params;
      const { role, permissions } = req.body;
      
      const staff = await ClinicStaffService.updateRole(staffId, { role, permissions }, req.user.id);
      
      res.json({
        success: true,
        message: 'Role updated successfully',
        staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating role'
      });
    }
  }
);

/**
 * Deactivate staff member
 */
router.put('/staff/:clinicId/:staffId/deactivate',
  verifyToken,
  checkEMRAccess('staff_management'),
  async (req, res) => {
    try {
      const { staffId } = req.params;
      const { reason } = req.body;
      
      const staff = await ClinicStaffService.deactivateStaff(staffId, req.user.id, reason);
      
      res.json({
        success: true,
        message: 'Staff member deactivated',
        staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deactivating staff'
      });
    }
  }
);

/**
 * Reactivate staff member
 */
router.put('/staff/:clinicId/:staffId/reactivate',
  verifyToken,
  checkEMRAccess('staff_management'),
  async (req, res) => {
    try {
      const { staffId } = req.params;
      
      const staff = await ClinicStaffService.reactivateStaff(staffId);
      
      res.json({
        success: true,
        message: 'Staff member reactivated',
        staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error reactivating staff'
      });
    }
  }
);

/**
 * Resend invitation
 */
router.post('/staff/:clinicId/:staffId/resend-invite',
  verifyToken,
  checkEMRAccess('staff_management'),
  async (req, res) => {
    try {
      const { staffId } = req.params;
      
      const staff = await ClinicStaffService.resendInvitation(staffId);
      
      res.json({
        success: true,
        message: 'Invitation resent',
        staff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error resending invitation'
      });
    }
  }
);

// ===== DATA EXPORT ROUTES =====

const PDFDocument = require('pdfkit');
const Prescription = require('../models/Prescription');
const SystematicHistory = require('../models/SystematicHistory');

/**
 * Get export history
 */
router.get('/export/:clinicId/history',
  verifyToken,
  checkEMRAccess('data_export'),
  async (req, res) => {
    try {
      const { clinicId } = req.params;
      
      // For now, return empty array - could be stored in a separate collection
      res.json({
        success: true,
        exports: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching export history',
        error: error.message
      });
    }
  }
);

/**
 * Generate PDF export
 */
router.post('/export/generate',
  verifyToken,
  checkEMRAccess('data_export'),
  async (req, res) => {
    try {
      const { 
        exportType, 
        clinicId, 
        patientId, 
        patientIds, 
        dateRange, 
        includeOptions 
      } = req.body;
      
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=export_${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).text('HealthSync EMR Export', { align: 'center' });
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.moveDown(2);
      
      if (exportType === 'bulk_patients' && patientIds?.length > 0) {
        // Bulk export
        for (let i = 0; i < patientIds.length; i++) {
          if (i > 0) doc.addPage();
          await generatePatientSection(doc, patientIds[i], clinicId, dateRange, includeOptions);
        }
      } else if (patientId) {
        // Single patient export
        await generatePatientSection(doc, patientId, clinicId, dateRange, includeOptions);
      }
      
      // Footer
      doc.fontSize(8).text('EMR powered by HealthSync', 50, doc.page.height - 50, { align: 'center' });
      
      doc.end();
      
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating export',
        error: error.message
      });
    }
  }
);

async function generatePatientSection(doc, patientId, clinicId, dateRange, includeOptions) {
  try {
    const patient = await User.findById(patientId).lean();
    
    if (!patient) {
      doc.fontSize(12).text('Patient not found', { align: 'center' });
      return;
    }
    
    // Patient Info
    doc.fontSize(16).text('Patient Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Name: ${patient.name || 'N/A'}`);
    doc.text(`Phone: ${patient.phone || 'N/A'}`);
    doc.text(`Email: ${patient.email || 'N/A'}`);
    doc.text(`Gender: ${patient.gender || 'N/A'}`);
    doc.text(`Age: ${patient.age || calculateAge(patient.dateOfBirth) || 'N/A'}`);
    doc.text(`Blood Group: ${patient.bloodGroup || 'N/A'}`);
    doc.moveDown();
    
    const start = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(0);
    const end = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Visit History
    if (includeOptions?.visitHistory) {
      doc.fontSize(14).text('Visit History', { underline: true });
      doc.moveDown(0.5);
      
      const visits = await EMRVisit.find({
        patientId,
        clinicId,
        visitDate: { $gte: start, $lte: end }
      })
      .populate('doctorId', 'name')
      .sort({ visitDate: -1 })
      .limit(50)
      .lean();
      
      if (visits.length === 0) {
        doc.fontSize(10).text('No visits found in the selected date range.');
      } else {
        doc.fontSize(10);
        visits.forEach((visit, idx) => {
          doc.text(`${idx + 1}. ${new Date(visit.visitDate).toLocaleDateString('en-IN')} - Dr. ${visit.doctorId?.name || 'Unknown'}`);
          if (visit.chiefComplaint) doc.text(`   Complaint: ${visit.chiefComplaint}`);
          if (visit.diagnosis?.length > 0) {
            doc.text(`   Diagnosis: ${visit.diagnosis.map(d => d.description).join(', ')}`);
          }
        });
      }
      doc.moveDown();
    }
    
    // Prescriptions
    if (includeOptions?.prescriptions) {
      doc.fontSize(14).text('Prescriptions', { underline: true });
      doc.moveDown(0.5);
      
      let prescriptions = [];
      try {
        prescriptions = await Prescription.find({
          patientId,
          clinicId,
          createdAt: { $gte: start, $lte: end }
        })
        .populate('doctorId', 'name')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
      } catch (e) {
        // Prescription model might not exist
      }
      
      if (prescriptions.length === 0) {
        doc.fontSize(10).text('No prescriptions found.');
      } else {
        doc.fontSize(10);
        prescriptions.forEach((rx, idx) => {
          doc.text(`${idx + 1}. ${new Date(rx.createdAt).toLocaleDateString('en-IN')} - Dr. ${rx.doctorId?.name || 'Unknown'}`);
          if (rx.medicines?.length > 0) {
            rx.medicines.forEach(med => {
              doc.text(`   - ${med.name} ${med.dosage || ''} ${med.frequency || ''}`);
            });
          }
        });
      }
      doc.moveDown();
    }
    
    // Clinical Notes
    if (includeOptions?.clinicalNotes) {
      doc.fontSize(14).text('Clinical Notes', { underline: true });
      doc.moveDown(0.5);
      
      const visitsWithNotes = await EMRVisit.find({
        patientId,
        clinicId,
        clinicalNotes: { $exists: true, $ne: '' },
        visitDate: { $gte: start, $lte: end }
      })
      .sort({ visitDate: -1 })
      .limit(20)
      .lean();
      
      if (visitsWithNotes.length === 0) {
        doc.fontSize(10).text('No clinical notes found.');
      } else {
        doc.fontSize(10);
        visitsWithNotes.forEach((visit, idx) => {
          doc.text(`${new Date(visit.visitDate).toLocaleDateString('en-IN')}:`);
          doc.text(visit.clinicalNotes, { indent: 20 });
          doc.moveDown(0.5);
        });
      }
      doc.moveDown();
    }
    
    // Systematic History
    if (includeOptions?.systematicHistory) {
      doc.fontSize(14).text('Systematic History', { underline: true });
      doc.moveDown(0.5);
      
      let history = null;
      try {
        history = await SystematicHistory.findOne({
          patientId,
          clinicId
        })
        .sort({ createdAt: -1 })
        .lean();
      } catch (e) {
        // Model might not exist
      }
      
      if (!history) {
        doc.fontSize(10).text('No systematic history recorded.');
      } else {
        doc.fontSize(10);
        if (history.chiefComplaint) doc.text(`Chief Complaint: ${history.chiefComplaint}`);
        if (history.historyOfPresentIllness) doc.text(`History: ${history.historyOfPresentIllness}`);
        if (history.pastMedicalHistory) doc.text(`Past Medical History: ${history.pastMedicalHistory}`);
        if (history.familyHistory) doc.text(`Family History: ${history.familyHistory}`);
        if (history.allergies?.length > 0) doc.text(`Allergies: ${history.allergies.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('Error generating patient section:', error);
    doc.fontSize(10).text('Error loading patient data');
  }
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}


// ===== LAB ORDER ROUTES =====

const {
  getTestCatalog,
  searchTests,
  createOrder,
  updateStatus,
  updateTestStatus,
  addResults,
  getOrder,
  getPatientOrders,
  getClinicOrders,
  cancelOrder,
  getOrderStats
} = require('../services/labOrderService');

/**
 * GET /api/emr/lab-tests/catalog
 * Get complete lab test catalog with tests and panels
 */
router.get('/lab-tests/catalog', verifyToken, async (req, res) => {
  try {
    const catalog = getTestCatalog();
    
    res.json({
      success: true,
      catalog
    });
  } catch (error) {
    console.error('Error fetching test catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test catalog'
    });
  }
});

/**
 * GET /api/emr/lab-tests/search
 * Search lab tests and panels by query
 */
router.get('/lab-tests/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const results = searchTests(q);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error searching tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tests'
    });
  }
});

/**
 * POST /api/emr/lab-orders
 * Create new lab order
 */
router.post('/lab-orders', verifyToken, async (req, res) => {
  try {
    const orderData = req.body;
    const orderedBy = req.user.id;
    
    // Validate required fields
    if (!orderData.patientId || !orderData.clinicId || !orderData.visitId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, clinic ID, and visit ID are required'
      });
    }
    
    if (!orderData.tests?.length && !orderData.panels?.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one test or panel must be selected'
      });
    }
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      // Check if user has access to this patient/visit
      const hasAccess = await EMRVisit.findOne({
        _id: orderData.visitId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const order = await createOrder(orderData, orderedBy);
    
    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      order
    });
    
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create lab order'
    });
  }
});

/**
 * GET /api/emr/lab-orders/:orderId
 * Get specific lab order details
 */
router.get('/lab-orders/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && 
        order.patientId?.toString() !== userId && 
        order.orderedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Error fetching lab order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch lab order'
    });
  }
});

/**
 * PUT /api/emr/lab-orders/:orderId/status
 * Update lab order status
 */
router.put('/lab-orders/:orderId/status', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const updatedBy = req.user.id;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Check if order exists and user has access
    const existingOrder = await getOrder(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && existingOrder.orderedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const order = await updateStatus(orderId, status, updatedBy, notes);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
});

/**
 * PUT /api/emr/lab-orders/:orderId/tests/:testCode/status
 * Update individual test status
 */
router.put('/lab-orders/:orderId/tests/:testCode/status', verifyToken, async (req, res) => {
  try {
    const { orderId, testCode } = req.params;
    const { status, notes } = req.body;
    const updatedBy = req.user.id;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Check if order exists and user has access
    const existingOrder = await getOrder(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && existingOrder.orderedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const order = await updateTestStatus(orderId, testCode, status, updatedBy, notes);
    
    res.json({
      success: true,
      message: 'Test status updated successfully',
      order
    });
    
  } catch (error) {
    console.error('Error updating test status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update test status'
    });
  }
});

/**
 * POST /api/emr/lab-orders/:orderId/tests/:testCode/results
 * Add test results
 */
router.post('/lab-orders/:orderId/tests/:testCode/results', verifyToken, async (req, res) => {
  try {
    const { orderId, testCode } = req.params;
    const results = req.body;
    const addedBy = req.user.id;
    
    if (!results.values || !Array.isArray(results.values)) {
      return res.status(400).json({
        success: false,
        message: 'Results values array is required'
      });
    }
    
    // Check if order exists and user has access
    const existingOrder = await getOrder(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && existingOrder.orderedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const order = await addResults(orderId, testCode, results, addedBy);
    
    res.json({
      success: true,
      message: 'Test results added successfully',
      order
    });
    
  } catch (error) {
    console.error('Error adding test results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add test results'
    });
  }
});

/**
 * GET /api/emr/patients/:patientId/lab-orders
 * Get lab orders for a patient
 */
router.get('/patients/:patientId/lab-orders', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { 
      clinicId, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      // Check if user has access via EMRVisit
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const options = {
      clinicId,
      status,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getPatientOrders(patientId, options);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error fetching patient lab orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch patient lab orders'
    });
  }
});

/**
 * GET /api/emr/clinics/:clinicId/lab-orders
 * Get lab orders for a clinic
 */
router.get('/clinics/:clinicId/lab-orders', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Check clinic access permissions would go here
    // For now, assuming user has access if they're authenticated
    
    const options = {
      status,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const result = await getClinicOrders(clinicId, options);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error fetching clinic lab orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch clinic lab orders'
    });
  }
});

/**
 * DELETE /api/emr/lab-orders/:orderId
 * Cancel lab order
 */
router.delete('/lab-orders/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const cancelledBy = req.user.id;
    
    // Check if order exists and user has access
    const existingOrder = await getOrder(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && 
        existingOrder.orderedBy?.toString() !== userId &&
        existingOrder.patientId?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const order = await cancelOrder(orderId, cancelledBy, reason || 'Cancelled by user');
    
    res.json({
      success: true,
      message: 'Lab order cancelled successfully',
      order
    });
    
  } catch (error) {
    console.error('Error cancelling lab order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel lab order'
    });
  }
});

/**
 * GET /api/emr/clinics/:clinicId/lab-orders/stats
 * Get lab order statistics for clinic
 */
router.get('/clinics/:clinicId/lab-orders/stats', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check clinic access permissions would go here
    
    const stats = await getOrderStats(clinicId, startDate, endDate);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching lab order stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch lab order statistics'
    });
  }
});

// ===== MEDICAL HISTORY ROUTES =====

const {
  createOrUpdateHistory,
  getHistory,
  updateAllergies,
  updateConditions,
  updateFamilyHistory,
  updateSurgicalHistory,
  updateMedications,
  updateSocialHistory,
  getCriticalSummary
} = require('../services/medicalHistoryService');

/**
 * POST /api/emr/patients/:patientId/history
 * Create or update complete medical history for a patient
 */
router.post('/patients/:patientId/history', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId, ...historyData } = req.body;
    const updatedBy = req.user.id;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Clinic ID is required'
      });
    }
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      // Check if user has access via EMRVisit
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await createOrUpdateHistory(patientId, historyData, clinicId, updatedBy);
    
    res.json({
      success: true,
      message: 'Medical history saved successfully',
      history
    });
    
  } catch (error) {
    console.error('Error saving medical history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save medical history'
    });
  }
});

/**
 * GET /api/emr/patients/:patientId/history
 * Get complete medical history for a patient
 */
router.get('/patients/:patientId/history', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId } = req.query;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Allow access for: admin, the patient themselves, doctors, staff/receptionists
    if (userRole !== 'admin' && userRole !== 'doctor' && userRole !== 'staff' && userRole !== 'receptionist' && patientId !== userId) {
      // For other roles, check if user has access via EMRVisit
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await getHistory(patientId, clinicId);
    
    res.json({
      success: true,
      history: history || {
        patientId,
        clinicId,
        allergies: [],
        chronicConditions: [],
        familyHistory: [],
        surgicalHistory: [],
        currentMedications: [],
        immunizations: [],
        socialHistory: {},
        bloodGroup: null,
        emergencyContact: {}
      }
    });
    
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical history'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/allergies
 * Update allergies section
 */
router.put('/patients/:patientId/history/allergies', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { allergies } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateAllergies(patientId, allergies, updatedBy);
    
    res.json({
      success: true,
      message: 'Allergies updated successfully',
      allergies: history.allergies
    });
    
  } catch (error) {
    console.error('Error updating allergies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update allergies'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/conditions
 * Update chronic conditions section
 */
router.put('/patients/:patientId/history/conditions', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { conditions } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateConditions(patientId, conditions, updatedBy);
    
    res.json({
      success: true,
      message: 'Chronic conditions updated successfully',
      conditions: history.chronicConditions
    });
    
  } catch (error) {
    console.error('Error updating conditions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update conditions'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/family-history
 * Update family history section
 */
router.put('/patients/:patientId/history/family-history', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { familyHistory } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateFamilyHistory(patientId, familyHistory, updatedBy);
    
    res.json({
      success: true,
      message: 'Family history updated successfully',
      familyHistory: history.familyHistory
    });
    
  } catch (error) {
    console.error('Error updating family history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update family history'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/surgical-history
 * Update surgical history section
 */
router.put('/patients/:patientId/history/surgical-history', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { surgicalHistory } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateSurgicalHistory(patientId, surgicalHistory, updatedBy);
    
    res.json({
      success: true,
      message: 'Surgical history updated successfully',
      surgicalHistory: history.surgicalHistory
    });
    
  } catch (error) {
    console.error('Error updating surgical history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update surgical history'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/medications
 * Update current medications section
 */
router.put('/patients/:patientId/history/medications', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medications } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateMedications(patientId, medications, updatedBy);
    
    res.json({
      success: true,
      message: 'Current medications updated successfully',
      medications: history.currentMedications
    });
    
  } catch (error) {
    console.error('Error updating medications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update medications'
    });
  }
});

/**
 * PUT /api/emr/patients/:patientId/history/social-history
 * Update social history section
 */
router.put('/patients/:patientId/history/social-history', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { socialHistory } = req.body;
    const updatedBy = req.user.id;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const history = await updateSocialHistory(patientId, socialHistory, updatedBy);
    
    res.json({
      success: true,
      message: 'Social history updated successfully',
      socialHistory: history.socialHistory
    });
    
  } catch (error) {
    console.error('Error updating social history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update social history'
    });
  }
});

/**
 * GET /api/emr/patients/:patientId/history/critical-summary
 * Get critical medical summary (allergies + active conditions + active medications)
 */
router.get('/patients/:patientId/history/critical-summary', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const summary = await getCriticalSummary(patientId);
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching critical summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch critical summary'
    });
  }
});

/**
 * GET /api/emr/patients/:patientId/history/summary
 * Get medical history summary for patient view (allergies, active conditions, active medications)
 * Requirements: 3.8, 9.4
 */
router.get('/patients/:patientId/history/summary', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      const hasAccess = await EMRVisit.findOne({
        patientId,
        $or: [
          { doctorId: userId },
          { createdBy: userId }
        ]
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    const summary = await getCriticalSummary(patientId);
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('Error fetching medical history summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch medical history summary'
    });
  }
});

// ===== WALK-IN PATIENT ROUTES =====

const WalkInPatientService = require('../services/walkInPatientService');

// ===== VISIT ROUTES =====

/**
 * POST /api/emr/visits
 * Create a new visit for a patient
 */
router.post('/visits', verifyToken, async (req, res) => {
  try {
    const { patientId, clinicId, doctorId, visitType, chiefComplaint } = req.body;

    if (!patientId || !clinicId) {
      return res.status(400).json({
        success: false,
        message: 'patientId and clinicId are required'
      });
    }

    // Get a doctor for the clinic if not provided
    let assignedDoctorId = doctorId;
    if (!assignedDoctorId) {
      const Doctor = require('../models/Doctor');
      const clinicDoctor = await Doctor.findOne({ clinicId, isActive: true }).select('_id');
      if (clinicDoctor) {
        assignedDoctorId = clinicDoctor._id;
      } else {
        // Use a placeholder or the user creating the visit
        assignedDoctorId = req.user.id;
      }
    }

    const visit = new EMRVisit({
      patientId,
      clinicId,
      doctorId: assignedDoctorId,
      visitType: visitType === 'walk-in' ? 'walk_in' : (visitType || 'walk_in'),
      chiefComplaint: chiefComplaint || '',
      visitDate: new Date(),
      status: 'waiting',
      checkInTime: new Date(),
      createdBy: req.user.id
    });

    await visit.save();

    res.status(201).json({
      success: true,
      message: 'Visit created successfully',
      visit
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating visit',
      error: error.message
    });
  }
});

// ===== VITALS ROUTES =====

const { validateVitals } = require('../services/vitalsService');

/**
 * POST /api/emr/visits/:visitId/vitals
 * Record vitals for a specific visit
 */
router.post('/visits/:visitId/vitals', verifyToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const vitalsData = req.body;
    
    // Validate the visit exists and user has access
    const visit = await EMRVisit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Check if user has access to this visit (doctor, clinic staff, or patient)
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && 
        visit.doctorId.toString() !== userId && 
        visit.patientId.toString() !== userId &&
        visit.createdBy?.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate vitals data
    const validationResult = validateVitals(vitalsData);
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid vitals data',
        details: validationResult.errors
      });
    }
    
    // Update visit with validated vitals
    const updatedVitals = {
      ...validationResult.validatedVitals,
      recordedAt: new Date(),
      recordedBy: userId
    };
    
    visit.vitalSigns = updatedVitals;
    await visit.save();
    
    res.json({
      success: true,
      message: 'Vitals recorded successfully',
      vitals: updatedVitals,
      abnormalFlags: validationResult.abnormalFlags,
      criticalFlags: validationResult.criticalFlags
    });
    
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ error: 'Failed to record vitals' });
  }
});

/**
 * GET /api/emr/visits/:visitId/vitals
 * Get vitals for a specific visit
 */
router.get('/visits/:visitId/vitals', verifyToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    
    const visit = await EMRVisit.findById(visitId).select('vitalSigns patientId doctorId createdBy');
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && 
        visit.doctorId?.toString() !== userId && 
        visit.patientId?.toString() !== userId &&
        visit.createdBy?.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      vitals: visit.vitalSigns || null
    });
    
  } catch (error) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

/**
 * GET /api/emr/patients/:patientId/vitals/trends
 * Get vitals trends for a patient over time
 */
router.get('/patients/:patientId/vitals/trends', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { 
      period = '6m', // 1m, 3m, 6m, 1y, all
      vitalType = 'all', // bloodPressure, pulse, temperature, weight, spo2, bloodSugar, all
      limit = 50 
    } = req.query;
    
    // Check access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!hasPatientAccess(userRole, userId, patientId)) {
      // Check if user has access via EMRVisit
      const hasAccess = await EMRVisit.findOne({
        patientId,
        doctorId: userId
      });
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far back date
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Query visits with vitals - check for any vital sign data, not just recordedAt
    const visits = await EMRVisit.find({
      patientId,
      visitDate: { $gte: startDate },
      $or: [
        { 'vitalSigns.recordedAt': { $exists: true } },
        { 'vitalSigns.bloodPressure.systolic': { $exists: true } },
        { 'vitalSigns.pulse.value': { $exists: true } },
        { 'vitalSigns.temperature.value': { $exists: true } },
        { 'vitalSigns.spo2.value': { $exists: true } },
        { 'vitalSigns.weight.value': { $exists: true } }
      ]
    })
    .select('visitDate vitalSigns')
    .sort({ visitDate: -1 })
    .limit(parseInt(limit));
    
    // Process trends data
    const trends = {
      period,
      totalReadings: visits.length,
      data: []
    };
    
    visits.forEach(visit => {
      const vitals = visit.vitalSigns;
      const dataPoint = {
        date: visit.visitDate,
        recordedAt: vitals.recordedAt
      };
      
      // Include requested vital types
      if (vitalType === 'all' || vitalType === 'bloodPressure') {
        if (vitals.bloodPressure) {
          dataPoint.bloodPressure = {
            systolic: vitals.bloodPressure.systolic,
            diastolic: vitals.bloodPressure.diastolic,
            isAbnormal: vitals.bloodPressure.isAbnormal
          };
        }
      }
      
      if (vitalType === 'all' || vitalType === 'pulse') {
        if (vitals.pulse) {
          dataPoint.pulse = {
            value: vitals.pulse.value,
            isAbnormal: vitals.pulse.isAbnormal
          };
        }
      }
      
      if (vitalType === 'all' || vitalType === 'temperature') {
        if (vitals.temperature) {
          dataPoint.temperature = {
            value: vitals.temperature.value,
            unit: vitals.temperature.unit,
            isAbnormal: vitals.temperature.isAbnormal
          };
        }
      }
      
      if (vitalType === 'all' || vitalType === 'weight') {
        if (vitals.weight) {
          dataPoint.weight = {
            value: vitals.weight.value,
            unit: vitals.weight.unit
          };
        }
      }
      
      if (vitalType === 'all' || vitalType === 'spo2') {
        if (vitals.spo2) {
          dataPoint.spo2 = {
            value: vitals.spo2.value,
            isAbnormal: vitals.spo2.isAbnormal
          };
        }
      }
      
      if (vitalType === 'all' || vitalType === 'bloodSugar') {
        if (vitals.bloodSugar) {
          dataPoint.bloodSugar = {
            value: vitals.bloodSugar.value,
            type: vitals.bloodSugar.type,
            unit: vitals.bloodSugar.unit,
            isAbnormal: vitals.bloodSugar.isAbnormal
          };
        }
      }
      
      if (vitals.bmi) {
        dataPoint.bmi = vitals.bmi;
      }
      
      trends.data.push(dataPoint);
    });
    
    // Calculate summary statistics
    if (trends.data.length > 0) {
      trends.summary = calculateVitalsSummary(trends.data, vitalType);
    }
    
    res.json({
      success: true,
      trends
    });
    
  } catch (error) {
    console.error('Error fetching vitals trends:', error);
    res.status(500).json({ error: 'Failed to fetch vitals trends' });
  }
});

/**
 * Helper function to calculate summary statistics for vitals trends
 */
function calculateVitalsSummary(data, vitalType) {
  const summary = {};
  
  if (vitalType === 'all' || vitalType === 'bloodPressure') {
    const bpReadings = data.filter(d => d.bloodPressure).map(d => d.bloodPressure);
    if (bpReadings.length > 0) {
      const systolicValues = bpReadings.map(bp => bp.systolic).filter(v => v);
      const diastolicValues = bpReadings.map(bp => bp.diastolic).filter(v => v);
      
      summary.bloodPressure = {
        readings: bpReadings.length,
        abnormalCount: bpReadings.filter(bp => bp.isAbnormal).length,
        systolic: {
          latest: systolicValues[0],
          average: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length),
          min: Math.min(...systolicValues),
          max: Math.max(...systolicValues)
        },
        diastolic: {
          latest: diastolicValues[0],
          average: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length),
          min: Math.min(...diastolicValues),
          max: Math.max(...diastolicValues)
        }
      };
    }
  }
  
  if (vitalType === 'all' || vitalType === 'pulse') {
    const pulseReadings = data.filter(d => d.pulse).map(d => d.pulse);
    if (pulseReadings.length > 0) {
      const pulseValues = pulseReadings.map(p => p.value).filter(v => v);
      summary.pulse = {
        readings: pulseReadings.length,
        abnormalCount: pulseReadings.filter(p => p.isAbnormal).length,
        latest: pulseValues[0],
        average: Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length),
        min: Math.min(...pulseValues),
        max: Math.max(...pulseValues)
      };
    }
  }
  
  // Add similar calculations for other vital types...
  
  return summary;
}

/**
 * Register walk-in patient
 */
router.post('/patients/walk-in', 
  verifyToken,
  async (req, res) => {
    try {
      const { clinicId, ...patientData } = req.body;
      const staffId = req.user.id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Clinic ID is required'
        });
      }
      
      const result = await WalkInPatientService.registerWalkIn(
        patientData,
        clinicId,
        staffId
      );
      
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error registering walk-in patient'
      });
    }
  }
);

/**
 * Register patient (staff registration endpoint)
 * Alias for walk-in registration with additional fields
 */
router.post('/patients/register', 
  verifyToken,
  async (req, res) => {
    try {
      const { clinicId, registeredBy, ...patientData } = req.body;
      const staffId = registeredBy || req.user.id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Clinic ID is required'
        });
      }
      
      const result = await WalkInPatientService.registerWalkIn(
        patientData,
        clinicId,
        staffId
      );
      
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        patient: result.patient,
        isNew: result.isNew,
        message: result.isNew ? 'Patient registered successfully' : 'Patient already exists'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error registering patient'
      });
    }
  }
);

/**
 * Search patients
 */
router.get('/patients/search', verifyToken, async (req, res) => {
  try {
    const { q, clinicId, includeAll } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const patients = await WalkInPatientService.searchPatients(
      q,
      clinicId,
      { includeAllPatients: includeAll === 'true' }
    );
    
    res.json({
      success: true,
      patients,
      count: patients.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching patients',
      error: error.message
    });
  }
});

/**
 * Get all patients registered at a clinic
 */
router.get('/patients/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { page = 1, limit = 100, search = '' } = req.query;
    
    const result = await WalkInPatientService.getClinicPatients(clinicId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    
    res.json({
      success: true,
      patients: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clinic patients',
      error: error.message
    });
  }
});

/**
 * Get patient details
 */
router.get('/patients/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId } = req.query;
    
    const patient = await WalkInPatientService.getPatient(patientId, clinicId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Get visit count if clinicId provided
    let visitCount = 0;
    if (clinicId) {
      visitCount = await WalkInPatientService.getPatientVisitCount(patientId, clinicId);
    }
    
    res.json({
      success: true,
      patient,
      visitCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
});

/**
 * Update patient details
 */
router.put('/patients/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId, ...updates } = req.body;
    
    const patient = await WalkInPatientService.updatePatient(
      patientId,
      updates,
      clinicId
    );
    
    res.json({
      success: true,
      message: 'Patient updated',
      patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
});

/**
 * Link patient to clinic
 */
router.post('/patients/:patientId/link', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId, clinicPatientId } = req.body;
    
    const patient = await WalkInPatientService.linkToClinic(
      patientId,
      clinicId,
      clinicPatientId
    );
    
    res.json({
      success: true,
      message: 'Patient linked to clinic',
      patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error linking patient',
      error: error.message
    });
  }
});

/**
 * Get all clinic patients
 */
router.get('/clinic/:clinicId/patients', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { page, limit, search, sortBy, sortOrder } = req.query;
    
    const result = await WalkInPatientService.getClinicPatients(clinicId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search,
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clinic patients',
      error: error.message
    });
  }
});

/**
 * Verify walk-in patient (convert to full account)
 */
router.post('/patients/:patientId/verify', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const verificationData = req.body;
    
    const patient = await WalkInPatientService.verifyWalkInPatient(
      patientId,
      verificationData
    );
    
    res.json({
      success: true,
      message: 'Patient verified successfully',
      patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying patient'
    });
  }
});

// ===== ICD-10 AND DIAGNOSIS ROUTES =====

const { searchICD10, getICD10Code, getPopularCodes } = require('../services/icd10Service');
const { 
  addDiagnosis, 
  getDiagnoses, 
  updateDiagnosis, 
  removeDiagnosis,
  getPatientDiagnosisHistory,
  validateDiagnosisData
} = require('../services/diagnosisService');

/**
 * Search ICD-10 codes
 * GET /api/emr/icd10/search?q=term&limit=20
 * Requirements: 4.1, 4.2
 */
router.get('/icd10/search', verifyToken, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }
    
    const results = await searchICD10(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      query: q.trim(),
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching ICD-10 codes',
      error: error.message
    });
  }
});

/**
 * Get specific ICD-10 code details
 * GET /api/emr/icd10/code/:code
 * Requirements: 4.2
 */
router.get('/icd10/code/:code', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'ICD-10 code is required'
      });
    }
    
    const result = await getICD10Code(code);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'ICD-10 code not found'
      });
    }
    
    res.json({
      success: true,
      code: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ICD-10 code',
      error: error.message
    });
  }
});

/**
 * Get popular/common ICD-10 codes
 * GET /api/emr/icd10/popular
 * Requirements: 4.1
 */
router.get('/icd10/popular', verifyToken, async (req, res) => {
  try {
    const codes = getPopularCodes();
    
    res.json({
      success: true,
      count: codes.length,
      codes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular codes',
      error: error.message
    });
  }
});

/**
 * Add diagnosis to a visit
 * POST /api/emr/visits/:visitId/diagnoses
 * Requirements: 4.6, 4.7
 */
router.post('/visits/:visitId/diagnoses', verifyToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    const diagnosisData = req.body;
    const userId = req.user.id;
    
    // Validate diagnosis data
    const validation = validateDiagnosisData(diagnosisData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diagnosis data',
        errors: validation.errors
      });
    }
    
    const visit = await addDiagnosis(visitId, diagnosisData, userId);
    
    res.status(201).json({
      success: true,
      message: 'Diagnosis added successfully',
      diagnoses: visit.diagnosis
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error adding diagnosis'
    });
  }
});

/**
 * Get all diagnoses for a visit
 * GET /api/emr/visits/:visitId/diagnoses
 * Requirements: 4.6, 4.7
 */
router.get('/visits/:visitId/diagnoses', verifyToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    
    const diagnoses = await getDiagnoses(visitId);
    
    res.json({
      success: true,
      count: diagnoses.length,
      diagnoses
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error fetching diagnoses'
    });
  }
});

/**
 * Update a diagnosis in a visit
 * PUT /api/emr/visits/:visitId/diagnoses/:code
 * Requirements: 4.6
 */
router.put('/visits/:visitId/diagnoses/:code', verifyToken, async (req, res) => {
  try {
    const { visitId, code } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    
    const visit = await updateDiagnosis(visitId, code, updateData, userId);
    
    res.json({
      success: true,
      message: 'Diagnosis updated successfully',
      diagnoses: visit.diagnosis
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error updating diagnosis'
    });
  }
});

/**
 * Remove a diagnosis from a visit
 * DELETE /api/emr/visits/:visitId/diagnoses/:code
 * Requirements: 4.6
 */
router.delete('/visits/:visitId/diagnoses/:code', verifyToken, async (req, res) => {
  try {
    const { visitId, code } = req.params;
    const userId = req.user.id;
    
    const visit = await removeDiagnosis(visitId, code, userId);
    
    res.json({
      success: true,
      message: 'Diagnosis removed successfully',
      diagnoses: visit.diagnosis
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error removing diagnosis'
    });
  }
});

/**
 * Get patient's diagnosis history
 * GET /api/emr/patients/:patientId/diagnoses
 * Requirements: 4.7
 */
router.get('/patients/:patientId/diagnoses', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId, startDate, endDate, type, limit, page } = req.query;
    
    const history = await getPatientDiagnosisHistory(patientId, clinicId, {
      startDate,
      endDate,
      type,
      limit: parseInt(limit) || 50,
      page: parseInt(page) || 1
    });
    
    res.json({
      success: true,
      count: history.length,
      diagnoses: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching diagnosis history'
    });
  }
});

// ===== DRUG INTERACTION ROUTES =====
// Requirements: 5.1, 5.5

const {
  checkInteractions,
  checkNewDrugInteractions,
  checkPrescriptionSafety,
  getDrugClasses,
  getAllDrugClasses,
  getSeverityInfo,
  getAllSeverityLevels,
  searchDrugs,
  getInteractionStats
} = require('../services/drugInteractionService');

const {
  createInteractionLog,
  logOverride,
  getLogsByVisit,
  getLogsByPatient,
  getOverrideAuditTrail,
  checkOverrideStatus,
  finalizePrescription
} = require('../services/interactionLogService');

/**
 * Check drug interactions
 * POST /api/emr/interactions/check
 * Requirements: 5.1
 */
router.post('/interactions/check', verifyToken, async (req, res) => {
  try {
    const { drugs, currentMedications, allergies, patientId, visitId, clinicId } = req.body;
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'drugs array is required'
      });
    }
    
    // Use comprehensive safety check if allergies provided
    if (allergies && allergies.length > 0) {
      const safetyResult = checkPrescriptionSafety(drugs, currentMedications || [], allergies);
      
      // Create log if patient/visit context provided
      let logId = null;
      if (patientId && req.user.id) {
        try {
          const log = await createInteractionLog({
            patientId,
            visitId,
            clinicId,
            doctorId: req.user.id,
            drugsPrescribed: drugs,
            existingMedications: currentMedications || [],
            interactions: safetyResult.interactions,
            allergyAlerts: safetyResult.allergyAlerts
          });
          logId = log._id;
        } catch (logError) {
          console.error('Error creating interaction log:', logError);
        }
      }
      
      return res.json({
        success: true,
        logId,
        ...safetyResult
      });
    }
    
    // Simple interaction check without allergies
    const allDrugs = [...drugs, ...(currentMedications || [])];
    const interactions = checkInteractions(allDrugs);
    
    // Filter to only interactions involving new drugs
    const relevantInteractions = interactions.filter(interaction => {
      return drugs.some(drug => 
        drug.toLowerCase() === interaction.drug1.toLowerCase() ||
        drug.toLowerCase() === interaction.drug2.toLowerCase()
      );
    });
    
    res.json({
      success: true,
      interactions: relevantInteractions,
      totalFound: relevantInteractions.length,
      hasContraindicated: relevantInteractions.some(i => i.severity === 'contraindicated'),
      hasMajor: relevantInteractions.some(i => i.severity === 'major')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking interactions'
    });
  }
});

/**
 * Check interactions for a new drug against current medications
 * POST /api/emr/interactions/check-new
 * Requirements: 5.1
 */
router.post('/interactions/check-new', verifyToken, async (req, res) => {
  try {
    const { newDrug, currentMedications, allergies } = req.body;
    
    if (!newDrug) {
      return res.status(400).json({
        success: false,
        message: 'newDrug is required'
      });
    }
    
    // Use comprehensive safety check
    const safetyResult = checkPrescriptionSafety(
      newDrug, 
      currentMedications || [], 
      allergies || []
    );
    
    res.json({
      success: true,
      ...safetyResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking new drug interactions'
    });
  }
});

/**
 * Log an interaction override
 * POST /api/emr/interactions/override
 * Requirements: 5.5
 */
router.post('/interactions/override', verifyToken, async (req, res) => {
  try {
    const { logId, type, drug1, drug2, drug, allergen, reason } = req.body;
    const doctorId = req.user.id;
    
    if (!logId || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'logId, type, and reason are required'
      });
    }
    
    const log = await logOverride({
      logId,
      type,
      drug1,
      drug2,
      drug,
      allergen,
      reason,
      doctorId
    });
    
    // Check if all critical alerts are now overridden
    const overrideStatus = await checkOverrideStatus(logId);
    
    res.json({
      success: true,
      message: 'Override logged successfully',
      log,
      overrideStatus
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error logging override'
    });
  }
});

/**
 * Get interaction log for a visit
 * GET /api/emr/interactions/log/:visitId
 * Requirements: 5.5
 */
router.get('/interactions/log/:visitId', verifyToken, async (req, res) => {
  try {
    const { visitId } = req.params;
    
    const logs = await getLogsByVisit(visitId);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching interaction logs'
    });
  }
});

/**
 * Get interaction logs for a patient
 * GET /api/emr/interactions/patient/:patientId
 */
router.get('/interactions/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit, page } = req.query;
    
    const logs = await getLogsByPatient(patientId, {
      limit: parseInt(limit) || 20,
      skip: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20)
    });
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching patient interaction logs'
    });
  }
});

/**
 * Get override audit trail for a clinic
 * GET /api/emr/interactions/audit/:clinicId
 * Requirements: 5.8
 */
router.get('/interactions/audit/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate, doctorId, limit, page } = req.query;
    
    const logs = await getOverrideAuditTrail(clinicId, {
      startDate,
      endDate,
      doctorId,
      limit: parseInt(limit) || 50,
      skip: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50)
    });
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching override audit trail'
    });
  }
});

/**
 * Check override status for a log
 * GET /api/emr/interactions/status/:logId
 */
router.get('/interactions/status/:logId', verifyToken, async (req, res) => {
  try {
    const { logId } = req.params;
    
    const status = await checkOverrideStatus(logId);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error checking override status'
    });
  }
});

/**
 * Finalize prescription after interaction check
 * POST /api/emr/interactions/finalize/:logId
 */
router.post('/interactions/finalize/:logId', verifyToken, async (req, res) => {
  try {
    const { logId } = req.params;
    
    // Check if all critical alerts are overridden
    const status = await checkOverrideStatus(logId);
    
    if (!status.canFinalize) {
      return res.status(400).json({
        success: false,
        message: 'Cannot finalize: pending critical overrides',
        pendingOverrides: status.pendingOverrides
      });
    }
    
    const log = await finalizePrescription(logId);
    
    res.json({
      success: true,
      message: 'Prescription finalized',
      log
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error finalizing prescription'
    });
  }
});

/**
 * Search drugs in the interaction database
 * GET /api/emr/interactions/drugs/search
 */
router.get('/interactions/drugs/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const results = searchDrugs(q);
    
    res.json({
      success: true,
      count: results.length,
      drugs: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching drugs'
    });
  }
});

/**
 * Get all drug classes
 * GET /api/emr/interactions/drug-classes
 */
router.get('/interactions/drug-classes', verifyToken, async (req, res) => {
  try {
    const classes = getAllDrugClasses();
    
    res.json({
      success: true,
      count: classes.length,
      drugClasses: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching drug classes'
    });
  }
});

/**
 * Get drug classes for a specific drug
 * GET /api/emr/interactions/drugs/:drugName/classes
 */
router.get('/interactions/drugs/:drugName/classes', verifyToken, async (req, res) => {
  try {
    const { drugName } = req.params;
    
    const classes = getDrugClasses(drugName);
    
    res.json({
      success: true,
      drug: drugName,
      classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching drug classes'
    });
  }
});

/**
 * Get severity levels information
 * GET /api/emr/interactions/severity-levels
 */
router.get('/interactions/severity-levels', verifyToken, async (req, res) => {
  try {
    const levels = getAllSeverityLevels();
    
    res.json({
      success: true,
      severityLevels: levels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching severity levels'
    });
  }
});

/**
 * Get interaction database statistics
 * GET /api/emr/interactions/stats
 */
router.get('/interactions/stats', verifyToken, async (req, res) => {
  try {
    const stats = getInteractionStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching interaction stats'
    });
  }
});

// Export router at the end
module.exports = router;
