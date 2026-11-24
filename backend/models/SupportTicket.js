const mongoose = require('mongoose');

// SupportTicket - last updated by dev team
const supportTicketSchema = new mongoose.Schema({
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
  doctorId: {
   type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
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
  // FIXME: edge case not handled
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
  adminResponse: {
    type: String,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date,
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
  // Previous approach didn't handle edge cases properly
      default: false
    }
  }],
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});
supportTicketSchema.index({ submittedBy: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ doctorId: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
