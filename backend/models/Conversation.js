const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    participantType: {
      type: String,
      enum: ['patient', 'doctor', 'clinic'],
      required: true
    },
    participantName: String,
    participantPhoto: String
  }],
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    senderType: String,
    timestamp: Date
  },
  unreadCount: {
    patient: { type: Number, default: 0 },
    doctor: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  closedAt: Date,
  closedReason: String
}, { timestamps: true });

conversationSchema.index({ patientId: 1, doctorId: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
