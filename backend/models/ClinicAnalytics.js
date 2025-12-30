/**
 * Clinic Analytics Model
 * Comprehensive analytics and reporting for clinic management
 */

const mongoose = require('mongoose');

const clinicAnalyticsSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  
  // Period
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startDate: Date,
    endDate: Date
  },
  
  // Patient metrics
  patients: {
    totalVisits: { type: Number, default: 0 },
    newPatients: { type: Number, default: 0 },
    returningPatients: { type: Number, default: 0 },
    walkIns: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    cancellations: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 }, // minutes
    patientSatisfactionScore: { type: Number, default: 0 },
    
    // Demographics
    demographics: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      ageGroups: {
        child: { type: Number, default: 0 },      // 0-12
        teen: { type: Number, default: 0 },       // 13-19
        adult: { type: Number, default: 0 },      // 20-40
        middleAge: { type: Number, default: 0 },  // 41-60
        senior: { type: Number, default: 0 }      // 60+
      }
    }
  },
  
  // Revenue metrics
  revenue: {
    totalRevenue: { type: Number, default: 0 },
    consultationRevenue: { type: Number, default: 0 },
    procedureRevenue: { type: Number, default: 0 },
    pharmacyRevenue: { type: Number, default: 0 },
    labRevenue: { type: Number, default: 0 },
    otherRevenue: { type: Number, default: 0 },
    
    totalCollected: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    totalRefunds: { type: Number, default: 0 },
    totalDiscounts: { type: Number, default: 0 },
    
    // Payment methods
    paymentMethods: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      upi: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    averageTicketSize: { type: Number, default: 0 },
    revenuePerPatient: { type: Number, default: 0 }
  },
  
  // Doctor metrics
  doctors: {
    totalDoctors: { type: Number, default: 0 },
    activeDoctors: { type: Number, default: 0 },
    
    // Per doctor stats (top performers)
    topPerformers: [{
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      name: String,
      patientsServed: Number,
      revenue: Number,
      avgRating: Number,
      avgConsultationTime: Number
    }],
    
    averageConsultationTime: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  
  // Appointment metrics
  appointments: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    rescheduled: { type: Number, default: 0 },
    noShow: { type: Number, default: 0 },
    
    // By type
    byType: {
      online: { type: Number, default: 0 },
      inPerson: { type: Number, default: 0 },
      followUp: { type: Number, default: 0 },
      emergency: { type: Number, default: 0 }
    },
    
    // By time slot
    peakHours: [{
      hour: Number,
      count: Number
    }],
    
    averageBookingLeadTime: { type: Number, default: 0 }, // days
    slotUtilization: { type: Number, default: 0 } // percentage
  },
  
  // Inventory metrics
  inventory: {
    totalItems: { type: Number, default: 0 },
    lowStockItems: { type: Number, default: 0 },
    outOfStockItems: { type: Number, default: 0 },
    expiringItems: { type: Number, default: 0 },
    expiredItems: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    
    topSellingMedicines: [{
      medicineId: mongoose.Schema.Types.ObjectId,
      name: String,
      quantitySold: Number,
      revenue: Number
    }]
  },
  
  // Disease/diagnosis trends
  clinicalTrends: {
    topDiagnoses: [{
      code: String,
      description: String,
      count: Number,
      percentage: Number
    }],
    
    topProcedures: [{
      name: String,
      count: Number,
      revenue: Number
    }],
    
    topLabTests: [{
      name: String,
      count: Number
    }]
  },
  
  // Staff metrics
  staff: {
    totalStaff: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    averageWorkingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },
  
  // Operational metrics
  operations: {
    averageQueueLength: { type: Number, default: 0 },
    averageServiceTime: { type: Number, default: 0 },
    peakQueueTime: String,
    
    // Efficiency scores
    operationalEfficiency: { type: Number, default: 0 },
    resourceUtilization: { type: Number, default: 0 }
  },
  
  // Comparison with previous period
  comparison: {
    revenueChange: { type: Number, default: 0 }, // percentage
    patientChange: { type: Number, default: 0 },
    appointmentChange: { type: Number, default: 0 }
  },
  
  // Generated at
  generatedAt: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// Indexes
clinicAnalyticsSchema.index({ clinicId: 1, 'period.type': 1, 'period.date': -1 });
clinicAnalyticsSchema.index({ clinicId: 1, 'period.date': -1 });

// Static: Generate daily analytics
clinicAnalyticsSchema.statics.generateDailyAnalytics = async function(clinicId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // This would aggregate data from various collections
  // Implementation would query Appointments, EMRVisits, ClinicBilling, etc.
  
  const analytics = {
    clinicId,
    period: {
      type: 'daily',
      date: startOfDay,
      startDate: startOfDay,
      endDate: endOfDay
    },
    // ... aggregate data from other collections
    generatedAt: new Date()
  };
  
  return this.findOneAndUpdate(
    { clinicId, 'period.type': 'daily', 'period.date': startOfDay },
    analytics,
    { upsert: true, new: true }
  );
};

// Static: Get analytics for period
clinicAnalyticsSchema.statics.getAnalytics = function(clinicId, periodType, startDate, endDate) {
  return this.find({
    clinicId,
    'period.type': periodType,
    'period.date': { $gte: startDate, $lte: endDate }
  }).sort({ 'period.date': 1 });
};

// Static: Get dashboard summary
clinicAnalyticsSchema.statics.getDashboardSummary = async function(clinicId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [dailyStats, monthlyStats] = await Promise.all([
    this.findOne({ clinicId, 'period.type': 'daily', 'period.date': today }),
    this.findOne({ clinicId, 'period.type': 'monthly', 'period.date': thisMonth })
  ]);
  
  return {
    today: dailyStats,
    thisMonth: monthlyStats
  };
};

module.exports = mongoose.model('ClinicAnalytics', clinicAnalyticsSchema);
