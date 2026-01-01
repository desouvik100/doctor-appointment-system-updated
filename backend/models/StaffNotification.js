/**
 * Staff Notification Model
 * For sending notifications to staff members
 */

const mongoose = require('mongoose');

const staffNotificationSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String },
  
  type: { 
    type: String, 
    enum: ['come_to_hospital', 'urgent', 'meeting', 'task', 'general'],
    default: 'general'
  },
  
  title: { type: String, required: true },
  message: { type: String },
  
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // For action notifications
  actionRequired: { type: Boolean, default: false },
  actionTaken: { type: Boolean, default: false },
  actionTakenAt: { type: Date },
  
  expiresAt: { type: Date }
  
}, { timestamps: true });

// Indexes
staffNotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
staffNotificationSchema.index({ clinicId: 1, createdAt: -1 });

module.exports = mongoose.model('StaffNotification', staffNotificationSchema);
