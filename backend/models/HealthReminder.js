const mongoose = require('mongoose');

/**
 * Smart Health Reminders - Preventive Care System
 * Requirement 6: Smart Health Reminders
 */

const healthReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reminder type
  type: {
    type: String,
    enum: [
      'checkup',           // Regular health checkup
      'vaccination',       // Vaccination schedule
      'lab_test',          // Lab test reminder (HbA1c, etc.)
      'medicine_refill',   // Medicine running low
      'follow_up',         // Doctor follow-up
      'screening',         // Cancer/disease screening
      'dental',            // Dental checkup
      'eye',               // Eye checkup
      'custom'             // User-defined
    ],
    required: true
  },
  
  // Reminder details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // For condition-based reminders
  condition: {
    type: String,
    enum: ['diabetes', 'hypertension', 'thyroid', 'cholesterol', 'general', 'pregnancy', 'child', 'senior'],
    default: 'general'
  },
  
  // Frequency
  frequency: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'],
    default: 'once'
  },
  
  // Custom frequency in days
  customFrequencyDays: Number,
  
  // Schedule
  scheduledDate: {
    type: Date,
    required: true
  },
  
  // Last completed date
  lastCompletedDate: Date,
  
  // Next due date (auto-calculated)
  nextDueDate: Date,
  
  // Reminder timing (days before due date)
  reminderDaysBefore: {
    type: [Number],
    default: [7, 3, 1, 0] // 7 days, 3 days, 1 day, and on the day
  },
  
  // Notification channels
  notificationChannels: {
    app: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: true }
  },
  
  // Related entities
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineReminder'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  // For medicine refill
  medicineDetails: {
    name: String,
    dosage: String,
    remainingDays: Number,
    pharmacyId: mongoose.Schema.Types.ObjectId
  },
  
  // For lab tests
  labTestDetails: {
    testName: String,
    lastValue: String,
    normalRange: String,
    lastTestDate: Date
  },
  
  // For vaccinations
  vaccinationDetails: {
    vaccineName: String,
    doseNumber: Number,
    totalDoses: Number,
    ageGroup: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'snoozed', 'cancelled', 'overdue'],
    default: 'active'
  },
  
  // Snooze details
  snoozedUntil: Date,
  snoozeCount: {
    type: Number,
    default: 0
  },
  
  // Completion details
  completedAt: Date,
  completedAction: {
    type: String,
    enum: ['booked_appointment', 'ordered_medicine', 'took_test', 'marked_done', 'skipped']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // AI-generated insights
  aiInsight: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Notification history
  notificationsSent: [{
    channel: String,
    sentAt: Date,
    status: String
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
healthReminderSchema.index({ userId: 1, status: 1 });
healthReminderSchema.index({ scheduledDate: 1 });
healthReminderSchema.index({ nextDueDate: 1 });
healthReminderSchema.index({ type: 1, condition: 1 });

// Calculate next due date based on frequency
healthReminderSchema.methods.calculateNextDueDate = function() {
  const baseDate = this.lastCompletedDate || this.scheduledDate;
  let nextDate = new Date(baseDate);
  
  switch (this.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'half_yearly':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'custom':
      nextDate.setDate(nextDate.getDate() + (this.customFrequencyDays || 30));
      break;
    default:
      return null; // One-time reminder
  }
  
  this.nextDueDate = nextDate;
  return nextDate;
};

// Mark as completed
healthReminderSchema.methods.markCompleted = function(action, appointmentId = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedAction = action;
  this.lastCompletedDate = new Date();
  
  if (appointmentId) {
    this.appointmentId = appointmentId;
  }
  
  // Calculate next due date for recurring reminders
  if (this.frequency !== 'once') {
    this.calculateNextDueDate();
    this.status = 'active'; // Reactivate for next occurrence
  }
};

// Snooze reminder
healthReminderSchema.methods.snooze = function(days = 3) {
  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);
  
  this.status = 'snoozed';
  this.snoozedUntil = snoozeDate;
  this.snoozeCount += 1;
};

// Check if reminder is due
healthReminderSchema.methods.isDue = function() {
  const now = new Date();
  const dueDate = this.nextDueDate || this.scheduledDate;
  return now >= dueDate;
};

// Check if notification should be sent
healthReminderSchema.methods.shouldNotify = function() {
  const now = new Date();
  const dueDate = this.nextDueDate || this.scheduledDate;
  const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  
  return this.reminderDaysBefore.includes(daysUntilDue);
};

// Static: Create diabetes reminders
healthReminderSchema.statics.createDiabetesReminders = async function(userId) {
  const reminders = [
    {
      userId,
      type: 'lab_test',
      title: 'HbA1c Test Due',
      description: 'Regular HbA1c test recommended every 3 months for diabetes management',
      condition: 'diabetes',
      frequency: 'quarterly',
      scheduledDate: new Date(),
      labTestDetails: {
        testName: 'HbA1c (Glycated Hemoglobin)',
        normalRange: '< 5.7% (Normal), 5.7-6.4% (Prediabetes), > 6.5% (Diabetes)'
      },
      priority: 'high'
    },
    {
      userId,
      type: 'lab_test',
      title: 'Fasting Blood Sugar Test',
      description: 'Monthly fasting blood sugar monitoring',
      condition: 'diabetes',
      frequency: 'monthly',
      scheduledDate: new Date(),
      labTestDetails: {
        testName: 'Fasting Blood Sugar',
        normalRange: '70-100 mg/dL'
      },
      priority: 'medium'
    },
    {
      userId,
      type: 'checkup',
      title: 'Eye Checkup (Diabetic Retinopathy)',
      description: 'Annual eye examination to check for diabetic retinopathy',
      condition: 'diabetes',
      frequency: 'yearly',
      scheduledDate: new Date(),
      priority: 'high'
    },
    {
      userId,
      type: 'checkup',
      title: 'Foot Examination',
      description: 'Regular foot checkup to prevent diabetic foot complications',
      condition: 'diabetes',
      frequency: 'quarterly',
      scheduledDate: new Date(),
      priority: 'medium'
    }
  ];
  
  return await this.insertMany(reminders);
};

// Static: Create hypertension reminders
healthReminderSchema.statics.createHypertensionReminders = async function(userId) {
  const reminders = [
    {
      userId,
      type: 'checkup',
      title: 'Blood Pressure Check',
      description: 'Regular blood pressure monitoring',
      condition: 'hypertension',
      frequency: 'weekly',
      scheduledDate: new Date(),
      priority: 'high'
    },
    {
      userId,
      type: 'lab_test',
      title: 'Kidney Function Test',
      description: 'Annual kidney function test (Creatinine, BUN)',
      condition: 'hypertension',
      frequency: 'yearly',
      scheduledDate: new Date(),
      labTestDetails: {
        testName: 'Kidney Function Test',
        normalRange: 'Creatinine: 0.7-1.3 mg/dL'
      },
      priority: 'medium'
    }
  ];
  
  return await this.insertMany(reminders);
};

// Static: Create child vaccination reminders
healthReminderSchema.statics.createChildVaccinationReminders = async function(userId, childDOB) {
  const vaccinations = [
    { name: 'BCG', weeks: 0 },
    { name: 'Hepatitis B - Birth Dose', weeks: 0 },
    { name: 'OPV - Birth Dose', weeks: 0 },
    { name: 'DPT-1', weeks: 6 },
    { name: 'IPV-1', weeks: 6 },
    { name: 'Hepatitis B-2', weeks: 6 },
    { name: 'Rotavirus-1', weeks: 6 },
    { name: 'PCV-1', weeks: 6 },
    { name: 'DPT-2', weeks: 10 },
    { name: 'IPV-2', weeks: 10 },
    { name: 'Hepatitis B-3', weeks: 10 },
    { name: 'Rotavirus-2', weeks: 10 },
    { name: 'PCV-2', weeks: 10 },
    { name: 'DPT-3', weeks: 14 },
    { name: 'IPV-3', weeks: 14 },
    { name: 'Rotavirus-3', weeks: 14 },
    { name: 'PCV-3', weeks: 14 },
    { name: 'Measles-1', weeks: 39 }, // 9 months
    { name: 'MMR-1', weeks: 52 }, // 12 months
    { name: 'Hepatitis A-1', weeks: 52 }
  ];
  
  const reminders = vaccinations.map(vax => {
    const dueDate = new Date(childDOB);
    dueDate.setDate(dueDate.getDate() + (vax.weeks * 7));
    
    return {
      userId,
      type: 'vaccination',
      title: `${vax.name} Vaccination Due`,
      description: `Scheduled vaccination for your child`,
      condition: 'child',
      frequency: 'once',
      scheduledDate: dueDate,
      vaccinationDetails: {
        vaccineName: vax.name,
        doseNumber: 1,
        totalDoses: 1
      },
      priority: 'high'
    };
  });
  
  return await this.insertMany(reminders);
};

// Static: Get due reminders for notification
healthReminderSchema.statics.getDueReminders = async function() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 7); // Get reminders due in next 7 days
  
  return await this.find({
    status: 'active',
    isActive: true,
    $or: [
      { nextDueDate: { $lte: tomorrow } },
      { scheduledDate: { $lte: tomorrow } }
    ]
  }).populate('userId', 'name email phone');
};

module.exports = mongoose.model('HealthReminder', healthReminderSchema);
