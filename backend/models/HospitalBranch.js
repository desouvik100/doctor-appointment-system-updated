/**
 * Hospital Branch Model
 * Multi-Branch Management for Hospital Chains
 */

const mongoose = require('mongoose');

const hospitalBranchSchema = new mongoose.Schema({
  // Parent Organization
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  organizationName: { type: String, required: true },
  
  // Branch Details
  branchCode: { type: String, unique: true },
  branchName: { type: String, required: true },
  branchType: { type: String, enum: ['main', 'satellite', 'clinic', 'diagnostic_center', 'pharmacy'], default: 'satellite' },
  
  // Location
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' },
  coordinates: { lat: Number, lng: Number },
  
  // Contact
  phone: { type: String, required: true },
  email: { type: String },
  emergencyPhone: { type: String },
  
  // Operational
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  
  // Facilities
  facilities: [{
    name: String,
    available: { type: Boolean, default: true }
  }],
  departments: [{ type: String }],
  specializations: [{ type: String }],
  
  // Capacity
  totalBeds: { type: Number, default: 0 },
  icuBeds: { type: Number, default: 0 },
  operationTheaters: { type: Number, default: 0 },
  
  // Staff
  branchManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffCount: { type: Number, default: 0 },
  doctorCount: { type: Number, default: 0 },
  
  // Financial
  revenueTarget: { type: Number, default: 0 },
  costCenter: { type: String },
  
  // Status
  status: { type: String, enum: ['active', 'inactive', 'under_renovation', 'closed'], default: 'active' },
  isActive: { type: Boolean, default: true },
  
  // Settings
  settings: {
    allowCrossBranchBooking: { type: Boolean, default: true },
    shareInventory: { type: Boolean, default: false },
    sharePatientRecords: { type: Boolean, default: true }
  },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

// Generate branch code
hospitalBranchSchema.pre('save', async function(next) {
  if (this.isNew && !this.branchCode) {
    const cityCode = this.city.substring(0, 3).toUpperCase();
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.branchCode = `${cityCode}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Indexes
hospitalBranchSchema.index({ organizationId: 1, status: 1 });
hospitalBranchSchema.index({ city: 1 });
hospitalBranchSchema.index({ branchCode: 1 });

module.exports = mongoose.model('HospitalBranch', hospitalBranchSchema);
