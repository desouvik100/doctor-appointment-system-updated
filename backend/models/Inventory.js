const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ['medicine', 'equipment', 'consumable', 'other'],
    required: true
  },
  sku: String,
  description: String,
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  minStockLevel: { type: Number, default: 10 },
  maxStockLevel: Number,
  costPrice: Number,
  sellingPrice: Number,
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  expiryDate: Date,
  batchNumber: String,
  location: String,
  isActive: { type: Boolean, default: true },
  transactions: [{
    type: { type: String, enum: ['in', 'out', 'adjustment'] },
    quantity: Number,
    reason: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Check if low stock
inventorySchema.methods.isLowStock = function() {
  return this.quantity <= this.minStockLevel;
};

module.exports = mongoose.model('Inventory', inventorySchema);
