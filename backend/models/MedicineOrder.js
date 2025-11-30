const mongoose = require('mongoose');

const medicineOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  medicines: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    dosage: String,
    price: Number,
    manufacturer: String,
    requiresPrescription: { type: Boolean, default: false }
  }],
  deliveryAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  pharmacy: {
    name: String,
    address: String,
    phone: String
  },
  subtotal: Number,
  deliveryFee: { type: Number, default: 40 },
  discount: { type: Number, default: 0 },
  totalAmount: Number,
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'Wallet'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  trackingUpdates: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Generate order number before saving
medicineOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('MedicineOrder').countDocuments();
    this.orderNumber = `MED${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MedicineOrder', medicineOrderSchema);
