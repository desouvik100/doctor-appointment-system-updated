const mongoose = require('mongoose');

const labBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthPackage' },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  bookingType: { type: String, enum: ['package', 'individual'], required: true },
  tests: [{
    name: String,
    price: Number
  }],
  collectionType: { type: String, enum: ['home', 'lab'], required: true },
  collectionAddress: {
    address: String,
    city: String,
    pincode: String,
    landmark: String
  },
  scheduledDate: { type: Date, required: true },
  scheduledTime: String,
  status: {
    type: String,
    enum: ['booked', 'sample_collected', 'processing', 'completed', 'cancelled'],
    default: 'booked'
  },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentId: String,
  reportUrl: String,
  reportGeneratedAt: Date,
  collectorName: String,
  collectorPhone: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('LabBooking', labBookingSchema);
