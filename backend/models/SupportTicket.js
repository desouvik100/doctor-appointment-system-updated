const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Who submitted the ticket
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterRole: {
    type: String,
    enum: ['doctor', 'patient', 'receptionist'],
    required: true
  },
  // Doctor reference (if submitted by doctor)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  // Ticket details
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['technical', 'payment', 'account', 'feature_request', 'complaint', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  // Admin response
  adminResponse: {
    type: String,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date,
  // Conversation thread
  messages: [{
    sender: {
      type: String,
      enum: ['doctor', 'admin'],
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  // Metadata
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
supportTicketSchema.index({ submittedBy: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ doctorId: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
