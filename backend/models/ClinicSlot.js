const mongoose = require('mongoose');

const clinicSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
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
    default: 30, // In-clinic typically longer
    min: 15,
    max: 120
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
    enum: ['clinic'],
    default: 'clinic',
    immutable: true // Cannot be changed after creation
  },
  // Room/cabin assignment
  roomNumber: {
    type: String,
    trim: true
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
  // Walk-in support
  isWalkInSlot: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate slots
clinicSlotSchema.index({ doctorId: 1, clinicId: 1, date: 1, startTime: 1 }, { unique: true });

// Index for efficient queries
clinicSlotSchema.index({ doctorId: 1, date: 1, isBooked: 1 });
clinicSlotSchema.index({ clinicId: 1, date: 1, isBooked: 1 });
clinicSlotSchema.index({ doctorId: 1, isBooked: 1, date: 1 });

// Virtual to check if slot is in the past
clinicSlotSchema.virtual('isPast').get(function() {
  const slotDateTime = new Date(this.date);
  const [hours, minutes] = this.startTime.split(':');
  slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return slotDateTime < new Date();
});

// Method to book the slot atomically
clinicSlotSchema.methods.bookSlot = async function(userId, appointmentId) {
  if (this.isBooked) {
    throw new Error('Slot is already booked');
  }
  if (this.isBlocked) {
    throw new Error('Slot is blocked');
  }
  if (this.slotType !== 'clinic') {
    throw new Error('Invalid slot type for clinic booking');
  }
  
  this.isBooked = true;
  this.bookedBy = userId;
  this.appointmentId = appointmentId;
  this.bookedAt = new Date();
  
  return this.save();
};

// Method to release the slot
clinicSlotSchema.methods.releaseSlot = async function() {
  this.isBooked = false;
  this.bookedBy = null;
  this.appointmentId = null;
  this.bookedAt = null;
  
  return this.save();
};

// Static method to get available slots for a doctor on a date
clinicSlotSchema.statics.getAvailableSlots = async function(doctorId, date, clinicId = null) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    isBooked: false,
    isBlocked: false
  };
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  return this.find(query).sort({ startTime: 1 });
};

// Static method for atomic booking with transaction
clinicSlotSchema.statics.atomicBook = async function(slotId, userId, appointmentId) {
  const result = await this.findOneAndUpdate(
    {
      _id: slotId,
      isBooked: false,
      isBlocked: false,
      slotType: 'clinic'
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

module.exports = mongoose.model('ClinicSlot', clinicSlotSchema);
