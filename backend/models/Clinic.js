const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['clinic', 'hospital'], default: 'clinic' },
    
    // Detailed Address
    address: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    pincode: { type: String },
    
    // Exact Location (GPS Coordinates)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    latitude: { type: Number },
    longitude: { type: Number },
    
    // Google Maps Integration
    googleMapsUrl: { type: String },
    placeId: { type: String }, // Google Place ID
    
    // Contact Information
    phone: { type: String },
    alternatePhone: { type: String },
    email: { type: String },
    website: { type: String },
    
    // Operating Hours
    operatingHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: true } }
    },
    
    // Additional Info
    description: { type: String },
    facilities: [{ type: String }], // ['Parking', 'Wheelchair Access', 'Pharmacy', etc.]
    specializations: [{ type: String }],
    // Cloudinary Images
    logo: { type: String }, // Cloudinary URL
    logoPublicId: { type: String }, // For deletion
    galleryPhotos: [{
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Legacy fields (kept for backward compatibility)
    logoUrl: { type: String },
    images: [{ type: String }],
    
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    
    // Admin Approval System
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

// Create 2dsphere index for geospatial queries
clinicSchema.index({ location: '2dsphere' });

// Virtual for full address
clinicSchema.virtual('fullAddress').get(function() {
  const parts = [this.address];
  if (this.addressLine2) parts.push(this.addressLine2);
  if (this.landmark) parts.push(`Near ${this.landmark}`);
  if (this.city) parts.push(this.city);
  if (this.state) parts.push(this.state);
  if (this.pincode) parts.push(this.pincode);
  if (this.country) parts.push(this.country);
  return parts.join(', ');
});

// Method to set coordinates
clinicSchema.methods.setCoordinates = function(lat, lng) {
  this.latitude = lat;
  this.longitude = lng;
  this.location = {
    type: 'Point',
    coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
  };
};

// Static method to find clinics near a location
clinicSchema.statics.findNearby = function(lat, lng, maxDistanceKm = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistanceKm * 1000 // Convert km to meters
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('Clinic', clinicSchema);