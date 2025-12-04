const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  primaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relationship: {
    type: String,
    enum: ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'],
    required: true
  },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  phone: String,
  email: String,
  profilePhoto: String,
  healthInfo: {
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    emergencyNotes: String
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    validTill: Date
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
