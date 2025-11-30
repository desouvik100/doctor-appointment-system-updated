const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending"
    },
    tokenNumber: {
      type: Number,
      default: 1
    },
    notes: {
      type: String,
      trim: true
    },
    patientNotes: {
      type: String,
      trim: true
    },
    doctorNotes: {
      type: String,
      trim: true
    },
    rescheduledFrom: {
      date: Date,
      time: String,
      reason: String,
      rescheduledAt: Date
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    // For family member booking
    bookedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember'
    },
    // Online Consultation Fields
    consultationType: {
      type: String,
      enum: ["in_person", "online"],
      default: "in_person"
    },
    meetingLink: {
      type: String,
      trim: true
    },
    joinCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    meetingStartTime: {
      type: Date
    },
    meetingEndTime: {
      type: Date
    },
    // Google Meet Integration
    googleMeetLink: {
      type: String,
      trim: true
    },
    googleEventId: {
      type: String,
      trim: true
    },
    meetLinkGenerated: {
      type: Boolean,
      default: false
    },
    meetLinkGeneratedAt: {
      type: Date
    },
    meetLinkSentToPatient: {
      type: Boolean,
      default: false
    },
    meetLinkSentToDoctor: {
      type: Boolean,
      default: false
    },
    // WebRTC Consultation Fields
    consultationStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },
    consultationStartTime: {
      type: Date
    },
    consultationEndTime: {
      type: Date
    },
    consultationDuration: {
      type: Number, // Duration in seconds
      default: 0
    },
    // Razorpay Payment Integration
    razorpayOrderId: {
      type: String,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "not_required"],
      default: "pending"
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      amount: Number,
      currency: String,
      method: String,
      bank: String,
      wallet: String,
      vpa: String,
      testMode: Boolean,
      paidAt: Date
    },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
      status: String,
      refundedAt: Date
    },
    // Legacy payment structure (for backward compatibility)
    payment: {
      consultationFee: {
        type: Number,
        required: false
      },
      gst: {
        type: Number,
        required: false
      },
      platformFee: {
        type: Number,
        required: false
      },
      totalAmount: {
        type: Number,
        required: false
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded", "not_required"],
        default: "pending"
      },
      paymentId: {
        type: String
      },
      paymentMethod: {
        type: String,
        enum: ["card", "upi", "netbanking", "wallet"],
        default: "card"
      },
      paidAt: {
        type: Date
      }
    },
    // Token + Queue Entry System
    token: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    queueStatus: {
      type: String,
      enum: ['waiting', 'verified', 'in_queue', 'completed', 'expired', 'no_show'],
      default: 'waiting'
    },
    verifiedAt: {
      type: Date
    },
    queuePosition: {
      type: Number,
      default: null
    },
    estimatedWaitTime: {
      type: Number, // in minutes
      default: null
    },
    tokenExpiredAt: {
      type: Date
    },
    // QR Code for check-in
    qrCode: {
      type: String // Base64 encoded QR code or unique identifier
    },
    // Reminder tracking
    remindersSent: {
      email24h: { type: Boolean, default: false },
      sms24h: { type: Boolean, default: false },
      email1h: { type: Boolean, default: false },
      sms1h: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

// Generate a random join code
appointmentSchema.methods.generateJoinCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.joinCode = code;
  return code;
};

// Generate appointment token
appointmentSchema.methods.generateToken = function(doctorCode = 'GEN') {
  // Format: HS-{DOCTORCODE}-{DDMM}-{4-digit-random}
  const date = new Date(this.date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  this.token = `HS-${doctorCode.toUpperCase()}-${day}${month}-${randomNum}`;
  this.tokenExpiredAt = new Date(date.getTime() + 2 * 60 * 60 * 1000); // 2 hours after appointment
  return this.token;
};

// Check if online consultation is accessible
appointmentSchema.methods.isConsultationAccessible = function() {
  // Only for online consultations
  if (this.consultationType !== 'online') {
    return { accessible: false, reason: 'Not an online consultation' };
  }

  // Must be confirmed or in_progress
  if (this.status !== 'confirmed' && this.status !== 'in_progress') {
    return { accessible: false, reason: 'Appointment not confirmed' };
  }

  // Check time window (15 minutes before to 60 minutes after)
  const appointmentDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
  const sixtyMinutesAfter = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);

  if (now < fifteenMinutesBefore) {
    const minutesUntil = Math.ceil((fifteenMinutesBefore - now) / (60 * 1000));
    return { 
      accessible: false, 
      reason: `Consultation opens in ${minutesUntil} minutes`,
      opensAt: fifteenMinutesBefore
    };
  }

  if (now > sixtyMinutesAfter) {
    return { 
      accessible: false, 
      reason: 'Consultation window has closed' 
    };
  }

  return { accessible: true, reason: 'Ready to join' };
};

// Virtual field for formatted appointment time
appointmentSchema.virtual('appointmentDateTime').get(function() {
  const appointmentDate = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return appointmentDate;
});

module.exports = mongoose.model("Appointment", appointmentSchema);