const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "13:00"
  slotDuration: { type: Number, default: 15 }, // minutes
  maxPatients: { type: Number, default: 20 }
});

const doctorScheduleSchema = new mongoose.Schema({
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
    blockedSlots: [String] // specific time slots if not full day
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
  },
  bufferTime: {
    type: Number,
    default: 5 // minutes between appointments
  },
  advanceBookingDays: {
    type: Number,
    default: 30 // how many days in advance can book
  }
}, { timestamps: true });

doctorScheduleSchema.index({ doctorId: 1 });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
