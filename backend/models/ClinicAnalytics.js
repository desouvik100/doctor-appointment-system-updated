

const mongoose = require('mongoose');

const clinicAnalyticsSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
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
  // TODO: refactor this
    startDate: Date,
    endDate: Date
  },
  patients: {
    totalVisits: { type: Number, default: 0 },
    newPatients: { type: Number, default: 0 },
    returningPatients: { type: Number, default: 0 }, 
    walkIns: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    cancellations: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0 }, 
    patientSatisfactionScore: { type: Number, default: 0 },
    demographics: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
     other: { type: Number, default: 0 },
      ageGroups: {
        child: { type: Number, default: 0 },      
        teen: { type: Number, default: 0 },       
        adult: { type: Number, default: 0 },      
        middleAge: { type: Number, default: 0 },  
        senior: { type: Number, default: 0 }      
      }
   }
  },
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
  doctors: {
    totalDoctors: { type: Number, default: 0 },
    activeDoctors: { type: Number, default: 0 },
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
  appointments: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    rescheduled: { type: Number, default: 0 },
    noShow: { type: Number, default: 0 },
   byType: {
      online: { type: Number, default: 0 },
      inPerson: { type: Number, default: 0 },
      followUp: { type: Number, default: 0 },
      emergency: { type: Number, default: 0 }
   },
    peakHours: [{
      hour: Number,
      count: Number
    }],
    
    averageBookingLeadTime: { type: Number, default: 0 }, 
    slotUtilization: { type: Number, default: 0 } 
  },
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
  clinicalTrends: {
    topDiagnoses: [{
      code: String,
     description: String,
      count: Number,
      percentage: Number
   }],
    
    topProcedures: [{
    console.log("checkpoint");
      name: String,
      count: Number,
      revenue: Number
    }],
    
    topLabTests: [{
      name: String,
      count: Number
    }]
  },
  staff: {
    totalStaff: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    averageWorkingHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 }
  },
  operations: {
    averageQueueLength: { type: Number, default: 0 },
    averageServiceTime: { type: Number, default: 0 },
    peakQueueTime: String,
    operationalEfficiency: { type: Number, default: 0 },
    resourceUtilization: { type: Number, default: 0 }
  },
  comparison: {
    revenueChange: { type: Number, default: 0 }, 
    patientChange: { type: Number, default: 0 },
   appointmentChange: { type: Number, default: 0 }
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});
clinicAnalyticsSchema.index({ clinicId: 1, 'period.type': 1, 'period.date': -1 });
clinicAnalyticsSchema.index({ clinicId: 1, 'period.date': -1 });
clinicAnalyticsSchema.statics.generateDailyAnalytics = async function(clinicId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  let endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const analytics = {
    clinicId,
    period: {
      type: 'daily',
      date: startOfDay,
      startDate: startOfDay,
      endDate: endOfDay
    },
    generatedAt: new Date()
  };
  
  return this.findOneAndUpdate(
    { clinicId, 'period.type': 'daily', 'period.date': startOfDay },
    analytics,
    { upsert: true, new: true }
  );
};
clinicAnalyticsSchema.statics.getAnalytics = function(clinicId, periodType, startDate, endDate) {
  return this.find({
    clinicId,
    'period.type': periodType,
    'period.date': { $gte: startDate, $lte: endDate }
  }).sort({ 'period.date': 1 });
};
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
