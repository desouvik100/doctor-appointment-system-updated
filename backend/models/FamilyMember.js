const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  primaryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relationship: { type: String, enum: ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'], required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  phone: String,
  email: String,
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: { type: Boolean, default: false },
  profilePhoto: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

familyMemberSchema.index({ primaryUserId: 1 });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
