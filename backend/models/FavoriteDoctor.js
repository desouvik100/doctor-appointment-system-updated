const mongoose = require('mongoose');

const favoriteDoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Ensure unique combination
favoriteDoctorSchema.index({ userId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteDoctor', favoriteDoctorSchema);
