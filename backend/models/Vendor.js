/**
 * Vendor Model
 * Supplier/Vendor Management for Inventory
 */

const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Vendor Identification
  vendorCode: { type: String, unique: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  
  // Basic Info
  name: { type: String, required: true },
  companyName: { type: String },
  vendorType: { type: String, enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'importer'], default: 'distributor' },
  
  // Contact
  contactPerson: { type: String },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  email: { type: String },
  website: { type: String },
  
  // Address
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' },
  
  // Business Details
  gstNumber: { type: String },
  panNumber: { type: String },
  drugLicenseNumber: { type: String },
  fssaiNumber: { type: String },
  
  // Banking
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },
  
  // Categories
  categories: [{ type: String }], // medicines, equipment, consumables, etc.
  products: [{ type: String }], // List of products supplied
  
  // Terms
  paymentTerms: { type: String, default: '30 days' },
  creditLimit: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  deliveryDays: { type: Number, default: 7 },
  minimumOrderValue: { type: Number, default: 0 },
  
  // Performance
  rating: { type: Number, min: 1, max: 5, default: 3 },
  totalOrders: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  onTimeDeliveryRate: { type: Number, default: 100 },
  qualityRating: { type: Number, default: 5 },
  
  // Status
  status: { type: String, enum: ['active', 'inactive', 'blacklisted', 'pending_approval'], default: 'active' },
  isPreferred: { type: Boolean, default: false },
  
  // Documents
  documents: [{
    type: { type: String },
    name: String,
    url: String,
    expiryDate: Date
  }],
  
  // Notes
  notes: { type: String },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

// Generate vendor code
vendorSchema.pre('save', async function(next) {
  if (this.isNew && !this.vendorCode) {
    const prefix = 'VND';
    const count = await this.constructor.countDocuments({ clinicId: this.clinicId });
    this.vendorCode = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes
vendorSchema.index({ clinicId: 1, status: 1 });
vendorSchema.index({ vendorCode: 1 });
vendorSchema.index({ name: 'text', companyName: 'text' });

module.exports = mongoose.model('Vendor', vendorSchema);
