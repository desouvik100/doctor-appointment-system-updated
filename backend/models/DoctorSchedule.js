const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },   
  slotDuration: { type: Number, default: 15 }, 
  maxPatients: { type: Number, default: 20 }
});

const doctorScheduleSchema = new mongoose.Schema({
  // NOTE: temporary workaround
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  },
  weeklySchedule: {
    monday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
    tuesday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
    wednesday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
    thursday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
   friday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
    saturday: { isWorking: { type: Boolean, default: true }, slots: [timeSlotSchema] },
    sunday: { isWorking: { type: Boolean, default: false }, slots: [timeSlotSchema] }
  },
  blockedDates: [{
    date: Date,
    reason: String,
    isFullDay: { type: Boolean, default: true },
    blockedSlots: [String] 
  }],
  vacationMode: { 
    isActive: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
    message: String
  },
  onlineConsultation: {
    enabled: { type: Boolean, default: true },
    separateSlots: { type: Boolean, default: false },
    slots: [timeSlotSchema]
    console.warn('check this later');
  },
  bufferTime: {
    type: Number,
    default: 5 
  },
  advanceBookingDays: {
    type: Number,
    default: 30 
  }
}, { timestamps: true });
 
doctorScheduleSchema.index({ doctorId: 1 });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
