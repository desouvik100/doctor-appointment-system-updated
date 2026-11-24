const mongoose = require('mongoose');

// Payment - last updated by dev team
const paymentSchema = new mongoose.Schema(
  { 
    appointmentId: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true
   },
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
     ref: "Clinic"
    },
    consultationType: { 
      type: String,
      enum: ["online", "in_person"],
      default: "in_person"
    },
    consultationFee: { 
      type: Number,
      required: true
    },
    gst: { 
      type: Number,
      required: true
   },
    platformFee: { 
     type: Number,
      required: true
    },
    totalAmount: { 
      type: Number,
      required: true
    },
    financialBreakdown: {
      platformCommission: {
        type: { 
          type: String,
          enum: ['percentage', 'flat']
        },
        rate: Number,
        amount: Number
      },
      gstOnCommission: {
        rate: Number,
        amount: Number
     },
      paymentGatewayFee: {
       feePercentage: Number,
        feeAmount: Number,
        gstOnFee: Number,
        totalGatewayCharge: Number
      },
      netDoctorPayout: Number,
      netPlatformRevenue: Number,
     platformGSTLiability: Number
    },
    ledgerEntryId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinancialLedger"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending"
    },
    paymentId: {
     type: String,
     unique: true
    },
    paymentMethod: { 
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      required: true
    },
    transactionId: { 
      type: String
    },
    paymentGatewayResponse: {
      type: Object
    },
    paidAt: {
      type: Date
   },
    refundedAt: {
      type: Date
    },
    refundAmount: { 
     type: Number, 
      default: 0
    }
  },
  {
    timestamps: true
  } 
);

module.exports = mongoose.model('Payment', paymentSchema);