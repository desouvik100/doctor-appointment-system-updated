const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  // Bed Identification
  bedNumber: { type: String, required: true },
  bedCode: { type: String }, // Unique code like ICU-01, GEN-A-05
  
  // Location
  wardType: { 
    type: String, 
    enum: ['general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'ccu', 'isolation', 'emergency', 'maternity', 'pediatric', 'surgical', 'orthopedic'],
    required: true
  },
  wardName: { type: String },
  roomNumber: { type: String },
  floorNumber: { type: String },
  building: { type: String },
  
  // Bed Details
  bedType: { 
    type: String, 
    enum: ['standard', 'electric', 'icu', 'pediatric', 'bariatric', 'labor_delivery', 'stretcher'],
    default: 'standard'
  },
  hasOxygen: { type: Boolean, default: false },
  hasMonitor: { type: Boolean, default: false },
  hasVentilator: { type: Boolean, default: false },
  hasSuction: { type: Boolean, default: false },
  
  // Pricing
  dailyRate: { type: Number, required: true },
  hourlyRate: { type: Number },
  
  // Status
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'blocked'],
    default: 'available'
  },
  
  // Current Occupant (if occupied)
  currentPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentAdmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IPDAdmission' },
  occupiedSince: { type: Date },
  expectedDischarge: { type: Date },
  
  // Reservation (if reserved)
  reservedFor: {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientName: { type: String },
    reservedFrom: { type: Date },
    reservedUntil: { type: Date },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Maintenance
  lastCleanedAt: { type: Date },
  lastMaintenanceAt: { type: Date },
  maintenanceNotes: { type: String },
  
  // Clinic/Hospital
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Active status
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
bedSchema.index({ clinicId: 1, status: 1 });
bedSchema.index({ clinicId: 1, wardType: 1, status: 1 });
bedSchema.index({ bedCode: 1, clinicId: 1 }, { unique: true });

// Generate bed code
bedSchema.pre('save', async function(next) {
  if (!this.bedCode) {
    const wardPrefix = this.wardType.substring(0, 3).toUpperCase();
    this.bedCode = `${wardPrefix}-${this.floorNumber || '1'}-${this.bedNumber}`;
  }
  next();
});

// Static method to get available beds by ward
bedSchema.statics.getAvailableBeds = async function(clinicId, wardType = null) {
  const query = { clinicId, status: 'available', isActive: true };
  if (wardType) query.wardType = wardType;
  return this.find(query).sort({ wardType: 1, bedNumber: 1 });
};

// Static method to get bed occupancy stats
bedSchema.statics.getOccupancyStats = async function(clinicId) {
  const stats = await this.aggregate([
    { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), isActive: true } },
    { $group: {
      _id: '$wardType',
      total: { $sum: 1 },
      occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
      available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
      reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
      maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } }
    }},
    { $project: {
      wardType: '$_id',
      total: 1,
      occupied: 1,
      available: 1,
      reserved: 1,
      maintenance: 1,
      occupancyRate: { $multiply: [{ $divide: ['$occupied', '$total'] }, 100] }
    }}
  ]);
  return stats;
};

module.exports = mongoose.model('Bed', bedSchema);
