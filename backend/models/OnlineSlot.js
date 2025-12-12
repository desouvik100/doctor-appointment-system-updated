const mongoose = require('mongoose');

const onlineSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM'
    }
  },
  duration: {
    type: Number,
    default: 20, // Online consultations typically shorter
    min: 10,
    max: 60
  },
  isBooked: {
    type: Boolean,
    default: false,
    index: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookedAt: {
    type: Date,
    default: null
  },
  slotType: {
    type: String,
    enum: ['online'],
    default: 'online',
    immutable: true // Cannot be changed after creation
  },
  // For recurring slots
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate slots
onlineSlotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

// Index for efficient queries
onlineSlotSchema.index({ doctorId: 1, date: 1, isBooked: 1 });
onlineSlotSchema.index({ doctorId: 1, isBooked: 1, date: 1 });

// Virtual to check if slot is in the past
onlineSlotSchema.virtual('isPast').get(function() {
  const slotDateTime = new Date(this.date);
  const [hours, minutes] = this.startTime.split(':');
  slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return slotDateTime < new Date();
});

// Method to book the slot atomically
onlineSlotSchema.methods.bookSlot = async function(userId, appointmentId) {
  if (this.isBooked) {
    throw new Error('Slot is already booked');
  }
  if (this.isBlocked) {
    throw new Error('Slot is blocked');
  }
  if (this.slotType !== 'online') {
    throw new Error('Invalid slot type for online booking');
  }
  
  this.isBooked = true;
  this.bookedBy = userId;
  this.appointmentId = appointmentId;
  this.bookedAt = new Date();
  
  return this.save();
};

// Method to release the slot
onlineSlotSchema.methods.releaseSlot = async function() {
  this.isBooked = false;
  this.bookedBy = null;
  this.appointmentId = null;
  this.bookedAt = null;
  
  return this.save();
};

// Static method to get available slots for a doctor on a date
onlineSlotSchema.statics.getAvailableSlots = async function(doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isBooked: false,
    isBlocked: false
  }).sort({ startTime: 1 });
};

// Static method for atomic booking with transaction
onlineSlotSchema.statics.atomicBook = async function(slotId, userId, appointmentId) {
  const result = await this.findOneAndUpdate(
    {
      _id: slotId,
      isBooked: false,
      isBlocked: false,
      slotType: 'online'
    },
    {
      $set: {
        isBooked: true,
        bookedBy: userId,
        appointmentId: appointmentId,
        bookedAt: new Date()
      }
    },
    { new: true }
  );
  
  if (!result) {
    throw new Error('Slot is no longer available or invalid');
  }
  
  return result;
};

module.exports = mongoose.model('OnlineSlot', onlineSlotSchema);
