/**
 * Purchase Order Model
 * Advanced Inventory & Vendor Management
 */

const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  // PO Identification
  poNumber: { type: String, unique: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch' },
  
  // Vendor
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName: { type: String, required: true },
  vendorContact: { type: String },
  vendorEmail: { type: String },
  
  // Order Details
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  
  // Items
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyInventory' },
    itemName: { type: String, required: true },
    itemCode: { type: String },
    category: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'units' },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalPrice: { type: Number },
    receivedQuantity: { type: Number, default: 0 },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    status: { type: String, enum: ['pending', 'partial', 'received', 'rejected'], default: 'pending' }
  }],
  
  // Financial
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  
  // Payment
  paymentTerms: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  paymentDueDate: { type: Date },
  
  // Status
  status: { type: String, enum: ['draft', 'pending_approval', 'approved', 'sent', 'partial_received', 'received', 'cancelled', 'closed'], default: 'draft' },
  
  // Approvals
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  approvalNotes: { type: String },
  
  // Delivery
  deliveryAddress: { type: String },
  deliveryNotes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Documents
  documents: [{ name: String, url: String, type: String }],
  
  // Notes
  notes: { type: String },
  internalNotes: { type: String },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { timestamps: true });

// Generate PO number
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.poNumber) {
    const date = new Date();
    const prefix = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({ poNumber: { $regex: `^${prefix}` } });
    this.poNumber = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      item.totalPrice = (item.quantity * item.unitPrice) - item.discount + item.tax;
      return sum + item.totalPrice;
    }, 0);
    this.grandTotal = this.subtotal - this.totalDiscount + this.totalTax + this.shippingCost;
  }
  next();
});

// Indexes
purchaseOrderSchema.index({ clinicId: 1, status: 1 });
purchaseOrderSchema.index({ vendorId: 1 });
purchaseOrderSchema.index({ poNumber: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
