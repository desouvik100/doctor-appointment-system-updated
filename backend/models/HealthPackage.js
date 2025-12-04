const mongoose = require('mongoose');

const healthPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['basic', 'comprehensive', 'executive', 'senior', 'women', 'cardiac', 'diabetic', 'custom'],
    required: true
  },
  tests: [{
    name: String,
    description: String,
    normalRange: String
  }],
  originalPrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  discountPercent: Number,
  validityDays: { type: Number, default: 365 },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  isHomeCollection: { type: Boolean, default: true },
  homeCollectionCharge: { type: Number, default: 0 },
  preparationInstructions: [String],
  reportDeliveryDays: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true },
  bookings: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('HealthPackage', healthPackageSchema);
