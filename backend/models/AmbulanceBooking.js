const mongoose = require('mongoose');

const ambulanceBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  emergencyType: {
    type: String,
    required: true,
    enum: ['Cardiac', 'Accident', 'Pregnancy', 'Breathing', 'Stroke', 'Other']
  },
  pickupLocation: {
    address: String,
    latitude: Number,
    longitude: Number,
    landmark: String
  },
  destinationHospital: {
    name: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  ambulanceType: {
    type: String,
    enum: ['Basic', 'Advanced', 'ICU', 'Neonatal'],
    default: 'Basic'
  },
  status: {
    type: String,
    enum: ['Requested', 'Dispatched', 'En Route', 'Arrived', 'Completed', 'Cancelled'],
    default: 'Requested'
  },
  driverName: String,
  driverPhone: String,
  vehicleNumber: String,
  estimatedArrival: Date,
  actualArrival: Date,
  fare: Number,
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Waived'],
    default: 'Pending'
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('AmbulanceBooking', ambulanceBookingSchema);
