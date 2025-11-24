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
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled", "no-show"],
      default: "pending"
    },
    // Status history with timestamps
    statusHistory: [{
      status: {
        type: String,
        required: true
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      changedBy: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    tokenNumber: {
      type: String,
      default: null
    },
    roomNumber: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    // Stripe Payment Integration
    paymentIntentId: {
      type: String,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending"
    },
    paymentDetails: {
      paymentIntentId: String,
      amount: Number,
      currency: String,
      paymentMethod: String,
      paidAt: Date
    },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
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
        enum: ["pending", "completed", "failed", "refunded"],
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);