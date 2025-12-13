const mongoose = require('mongoose');

/**
 * Emergency SOS System
 * Requirement 9: Emergency SOS Feature
 */

const emergencySOSSchema = new mongoose.Schema({
  // User who triggered SOS
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Emergency type
  type: {
    type: String,
    enum: ['medical', 'accident', 'cardiac', 'breathing', 'unconscious', 'other'],
    default: 'medical'
  },
  
  // Status
  status: {
    type: String,
    enum: ['triggered', 'acknowledged', 'ambulance_dispatched', 'ambulance_arrived', 
           'patient_picked', 'hospital_reached', 'resolved', 'cancelled', 'false_alarm'],
    default: 'triggered'
  },
  
  // Location at time of SOS
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    landmark: String,
    accuracy: Number // GPS accuracy in meters
  },
  
  // Live location updates
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Patient's critical medical info (auto-fetched from profile)
  medicalInfo: {
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    emergencyNotes: String
  },
  
  // Emergency contacts notified
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String,
    notifiedAt: Date,
    notificationStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    responseReceived: Boolean,
    responseAt: Date
  }],
  
  // Ambulance details
  ambulance: {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AmbulanceProvider'
    },
    vehicleNumber: String,
    driverName: String,
    driverPhone: String,
    dispatchedAt: Date,
    eta: Number, // in minutes
    currentLocation: {
      latitude: Number,
      longitude: Number,
      lastUpdated: Date
    },
    arrivedAt: Date,
    hospitalName: String,
    hospitalAddress: String
  },
  
  // Timeline of events
  timeline: [{
    event: {
      type: String,
      enum: ['sos_triggered', 'contacts_notified', 'ambulance_assigned', 
             'ambulance_dispatched', 'ambulance_arrived', 'patient_picked',
             'en_route_hospital', 'hospital_reached', 'resolved', 'cancelled']
    },
    timestamp: { type: Date, default: Date.now },
    details: String,
    updatedBy: String // 'system', 'user', 'driver', 'hospital'
  }],
  
  // Voice/Text notes during emergency
  notes: [{
    type: { type: String, enum: ['text', 'voice'] },
    content: String, // text or audio URL
    addedAt: { type: Date, default: Date.now },
    addedBy: String
  }],
  
  // Response metrics
  metrics: {
    timeToAcknowledge: Number, // seconds
    timeToDispatch: Number,
    timeToArrival: Number,
    timeToHospital: Number,
    totalResponseTime: Number
  },
  
  // Feedback after resolution
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  
  // For medical records
  medicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes
emergencySOSSchema.index({ userId: 1, status: 1 });
emergencySOSSchema.index({ triggeredAt: -1 });
emergencySOSSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
emergencySOSSchema.index({ status: 1, 'ambulance.providerId': 1 });

// Add timeline event
emergencySOSSchema.methods.addTimelineEvent = function(event, details = '', updatedBy = 'system') {
  this.timeline.push({
    event,
    timestamp: new Date(),
    details,
    updatedBy
  });
  
  // Update metrics
  const triggerTime = this.triggeredAt.getTime();
  const now = Date.now();
  
  switch (event) {
    case 'ambulance_assigned':
      this.metrics.timeToAcknowledge = Math.round((now - triggerTime) / 1000);
      break;
    case 'ambulance_dispatched':
      this.metrics.timeToDispatch = Math.round((now - triggerTime) / 1000);
      break;
    case 'ambulance_arrived':
      this.metrics.timeToArrival = Math.round((now - triggerTime) / 1000);
      break;
    case 'hospital_reached':
      this.metrics.timeToHospital = Math.round((now - triggerTime) / 1000);
      this.metrics.totalResponseTime = this.metrics.timeToHospital;
      break;
  }
};

// Update ambulance location
emergencySOSSchema.methods.updateAmbulanceLocation = function(latitude, longitude) {
  this.ambulance.currentLocation = {
    latitude,
    longitude,
    lastUpdated: new Date()
  };
  
  // Calculate new ETA based on distance (simplified)
  if (this.location.latitude && this.location.longitude) {
    const distance = this.calculateDistance(
      latitude, longitude,
      this.location.latitude, this.location.longitude
    );
    // Assume average speed of 40 km/h in city
    this.ambulance.eta = Math.ceil((distance / 40) * 60);
  }
};

// Calculate distance between two points (Haversine formula)
emergencySOSSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Update status
emergencySOSSchema.methods.updateStatus = function(newStatus, details = '', updatedBy = 'system') {
  this.status = newStatus;
  
  const eventMap = {
    'acknowledged': 'ambulance_assigned',
    'ambulance_dispatched': 'ambulance_dispatched',
    'ambulance_arrived': 'ambulance_arrived',
    'patient_picked': 'patient_picked',
    'hospital_reached': 'hospital_reached',
    'resolved': 'resolved',
    'cancelled': 'cancelled'
  };
  
  if (eventMap[newStatus]) {
    this.addTimelineEvent(eventMap[newStatus], details, updatedBy);
  }
  
  if (newStatus === 'resolved' || newStatus === 'cancelled') {
    this.resolvedAt = new Date();
    this.isActive = false;
  }
};

// Add emergency contact
emergencySOSSchema.methods.notifyContact = function(contact) {
  this.emergencyContacts.push({
    ...contact,
    notifiedAt: new Date(),
    notificationStatus: 'pending'
  });
};

// Static: Get active emergencies near location
emergencySOSSchema.statics.getActiveNearby = async function(latitude, longitude, radiusKm = 10) {
  // Simple bounding box query (for production, use MongoDB geospatial queries)
  const latDelta = radiusKm / 111; // 1 degree ≈ 111 km
  const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
  return await this.find({
    isActive: true,
    status: { $nin: ['resolved', 'cancelled', 'false_alarm'] },
    'location.latitude': { $gte: latitude - latDelta, $lte: latitude + latDelta },
    'location.longitude': { $gte: longitude - lonDelta, $lte: longitude + lonDelta }
  }).populate('userId', 'name phone');
};

// Static: Get user's emergency history
emergencySOSSchema.statics.getUserHistory = async function(userId) {
  return await this.find({ userId })
    .sort({ triggeredAt: -1 })
    .limit(10)
    .select('-locationHistory -timeline');
};

module.exports = mongoose.model('EmergencySOS', emergencySOSSchema);
