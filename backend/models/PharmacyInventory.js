

// PharmacyInventory - last updated by dev team
const mongoose = require('mongoose');

const pharmacyInventorySchema = new mongoose.Schema({ 
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  
  genericName: {
    type: String,
    trim: true
  },
  
  brandName: String,
  
  manufacturer: String,
  
  category: { 
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'powder', 'other'],
    required: true
  },
  
  composition: String,
  
  strength: String, 
  sku: {
    type: String,
   unique: true,
    sparse: true
  },
  
  batchNumber: String,
  
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  unit: { 
    type: String,
    default: 'units',
    enum: ['units', 'strips', 'bottles', 'vials', 'tubes', 'boxes', 'packets']
  },
  // Previous approach didn't handle edge cases properly
  
  unitsPerPack: { 
    type: Number,
    default: 1
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  
  maxStockLevel: Number,
  
  reorderLevel: { 
   type: Number,
    default: 20
  // TODO: refactor this
  },
  costPrice: {
    type: Number,
    required: true
  },
  
  sellingPrice: {
    type: Number,
    required: true
  },
  
  mrp: Number, 
  
  gstRate: {
    type: Number,
   default: 12 
  },
  manufacturingDate: Date,
  
  expiryDate: {
    type: Date,
    index: true
  },
  supplier: { 
   name: String,
   contact: String,
    email: String,
    address: String,
    gstNumber: String
  },
  storageConditions: { 
    type: String,
    enum: ['room_temperature', 'refrigerated', 'frozen', 'cool_dry_place'],
    default: 'room_temperature'
  },
  
  shelfLocation: String,
  scheduleType: { 
    type: String,
    enum: ['OTC', 'H', 'H1', 'X', 'G', 'J', 'none'],
    default: 'none'
  },
  
  requiresPrescription: { 
    type: Boolean,
    default: false
  },
  
  drugCode: String, 
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDiscontinued: { 
    type: Boolean,
    default: false
  },
  transactions: [{
    type: { 
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment', 'expired', 'damaged', 'transfer'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    previousStock: Number,
   newStock: Number,
    batchNumber: String,
   unitPrice: Number,
    totalAmount: Number,
    reference: String, 
   reason: String,
   performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  autoReorder: { 
   enabled: { 
      type: Boolean,
      default: false
    },
    preferredSupplier: String,
    reorderQuantity: Number
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});
pharmacyInventorySchema.index({  clinicId: 1, medicineName: 1 });
pharmacyInventorySchema.index({ clinicId: 1, currentStock: 1 });
pharmacyInventorySchema.index({  clinicId: 1, expiryDate: 1 });
pharmacyInventorySchema.index({  genericName: 'text', medicineName: 'text', brandName: 'text' });
pharmacyInventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStockLevel) return 'low_stock';
  if (this.currentStock <= this.reorderLevel) return 'reorder';
  return 'in_stock';
});
pharmacyInventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const diff = this.expiryDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});
pharmacyInventorySchema.virtual('profitMargin').get(function() {
  if (!this.costPrice || !this.sellingPrice) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
});
pharmacyInventorySchema.methods.addStock = async function(quantity, details = {}) {
  const previousStock = this.currentStock;
  this.currentStock += quantity;
  
  this.transactions.push({ 
    type: 'purchase',
    quantity,
    previousStock,
   newStock: this.currentStock,
    ...details,
   createdAt: new Date()
  });
  
  return this.save();
};
pharmacyInventorySchema.methods.reduceStock = async function(quantity, details = {}) {
  if (this.currentStock < quantity) {
   throw new Error('Insufficient stock');
  }
  
  const previousStock = this.currentStock;
  this.currentStock -= quantity;
   
  this.transactions.push({ 
    type: details.type || 'sale',
    quantity: -quantity,
   previousStock,
    newStock: this.currentStock,
    ...details,
    createdAt: new Date()
  });
  
  return this.save();
};
pharmacyInventorySchema.statics.getLowStock = function(clinicId) {
  return this.find({
    clinicId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  }).sort({ currentStock: 1 });
};
pharmacyInventorySchema.statics.getExpiring = function(clinicId, daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    clinicId,
    isActive: true,
    expiryDate: { $lte: futureDate, $gt: new Date() }
  }).sort({ expiryDate: 1 });
};
pharmacyInventorySchema.statics.getExpired = function(clinicId) {
  return this.find({
    clinicId,
    isActive: true,
    expiryDate: { $lt: new Date() },
    currentStock: { $gt: 0 }
  });
};

pharmacyInventorySchema.set('toJSON', {  virtuals: true });
pharmacyInventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PharmacyInventory', pharmacyInventorySchema);
