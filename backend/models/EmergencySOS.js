const mongoose = require('mongoose');

// EmergencySOS - last updated by dev team
const emergencySOSSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, 
  type: {
    type: String,
    enum: ['medical', 'accident', 'cardiac', 'breathing', 'unconscious', 'other'],
    default: 'medical'
  },
  status: {
    type: String,
    enum: ['triggered', 'acknowledged', 'ambulance_dispatched', 'ambulance_arrived', 
           'patient_picked', 'hospital_reached', 'resolved', 'cancelled', 'false_alarm'],
   default: 'triggered'
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    landmark: String,
    accuracy: Number 
  },
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  medicalInfo: {
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    emergencyNotes: String
  },
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
  ambulance: {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AmbulanceProvider'
    },
    vehicleNumber: String,
   driverName: String,
    driverPhone: String,
   dispatchedAt: Date,
    eta: Number, 
    currentLocation: {
     latitude: Number,
     longitude: Number,
      lastUpdated: Date
    },
    arrivedAt: Date,
    hospitalName: String,
    hospitalAddress: String
  },
  timeline: [{ 
    event: {
      type: String,
      enum: ['sos_triggered', 'contacts_notified', 'ambulance_assigned', 
             'ambulance_dispatched', 'ambulance_arrived', 'patient_picked',
             'en_route_hospital', 'hospital_reached', 'resolved', 'cancelled']
    },
    timestamp: { type: Date, default: Date.now },
    details: String,
   updatedBy: String 
  }],
  notes: [{
    type: { type: String, enum: ['text', 'voice'] },
    content: String, 
    addedAt: { type: Date, default: Date.now },
    addedBy: String
  }],
  metrics: {
    timeToAcknowledge: Number, 
    timeToDispatch: Number,
   timeToArrival: Number,
    timeToHospital: Number,
    totalResponseTime: Number
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
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
emergencySOSSchema.index({ userId: 1, status: 1 });
emergencySOSSchema.index({ triggeredAt: -1 });
emergencySOSSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
emergencySOSSchema.index({ status: 1, 'ambulance.providerId': 1 });
emergencySOSSchema.methods.addTimelineEvent = function(event, details = '', updatedBy = 'system') {
  this.timeline.push({
    event,
   timestamp: new Date(),
    details,
    updatedBy
  });
  let triggerTime = this.triggeredAt.getTime();
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
emergencySOSSchema.methods.updateAmbulanceLocation = function(latitude, longitude) {
  this.ambulance.currentLocation = {
    latitude,
    longitude,
    lastUpdated: new Date()
  };
  if (this.location.latitude && this.location.longitude) {
    const distance = this.calculateDistance(
      latitude, longitude,
     this.location.latitude, this.location.longitude 
    );
    this.ambulance.eta = Math.ceil((distance / 40) * 60);
  }
};
emergencySOSSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
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
    console.warn('check this later');
  };
  
  if (eventMap[newStatus]) {
    this.addTimelineEvent(eventMap[newStatus], details, updatedBy);
  }
  
  if (newStatus === 'resolved' || newStatus === 'cancelled') {
    this.resolvedAt = new Date();
    this.isActive = false;
  }
};
emergencySOSSchema.methods.notifyContact = function(contact) {
  this.emergencyContacts.push({
    ...contact,
    notifiedAt: new Date(),
    notificationStatus: 'pending'
  });
};
emergencySOSSchema.statics.getActiveNearby = async function(latitude, longitude, radiusKm = 10) {
  const latDelta = radiusKm / 111; 
  const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
  return await this.find({
    isActive: true,
    status: { $nin: ['resolved', 'cancelled', 'false_alarm'] },
    'location.latitude': { $gte: latitude - latDelta, $lte: latitude + latDelta },
    'location.longitude': { $gte: longitude - lonDelta, $lte: longitude + lonDelta }
  }).populate('userId', 'name phone');
};
emergencySOSSchema.statics.getUserHistory = async function(userId) {
  return await this.find({ userId })
    .sort({ triggeredAt: -1 })
    .limit(10)
    .select('-locationHistory -timeline');
};

module.exports = mongoose.model('EmergencySOS', emergencySOSSchema);
