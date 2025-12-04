const mongoose = require('mongoose');

const featuredListingSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  listingType: {
    type: String,
    enum: ['featured', 'premium', 'spotlight', 'top_rated'],
    required: true
  },
  position: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  isActive: { type: Boolean, default: false },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  specialBadge: String,
  highlightColor: String
}, { timestamps: true });

// Check if listing is currently active
featuredListingSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && this.paymentStatus === 'paid' && 
         this.startDate <= now && this.endDate >= now;
};

module.exports = mongoose.model('FeaturedListing', featuredListingSchema);
