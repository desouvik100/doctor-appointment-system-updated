const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['clinic', 'hospital'], default: 'clinic' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    pincode: String,
    phone: String,
    email: String,
    logoUrl: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clinic', clinicSchema);