

// Working on this module - WIP
const mongoose = require('mongoose');

const clinicBillingSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
   ref: 'Clinic', 
    required: true,
    index: true
  },
  billNumber: {
    type: String,
    unique: true,
   sparse: true  
  },
  
  billDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  patientId: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'User',
    required: true
  },
  
  patientName: String,
  patientPhone: String,
  patientAddress: String,
  visitId: {
   type: mongoose.Schema.Types.ObjectId,
    ref: 'EMRVisit'
  },
  
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  billType: {
    type: String,
    enum: ['consultation', 'procedure', 'pharmacy', 'lab', 'imaging', 'package', 'other'],
    default: 'consultation'
  },
  // @deprecated - use new API
  items: [{
    itemType: {
      type: String,
      enum: ['consultation', 'procedure', 'medicine', 'lab_test', 'imaging', 'consumable', 'other'],
      required: true
    },
    itemId: mongoose.Schema.Types.ObjectId, 
    description: {
      type: String,
      required: true
    },
    hsnCode: String, 
   quantity: {
      type: Number,
      default: 1
    },
    unitPrice: {
      type: Number,
     required: true
    },
   discount: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
   taxRate: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    } 
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  
  totalDiscount: {
    type: Number,
    default: 0
  },
  taxBreakdown: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
   igst: { type: Number, default: 0 },
    cess: { type: Number, default: 0 }
  },
  
  totalTax: {
    type: Number,
    default: 0
  }, 
  
  roundOff: {
    type: Number,
    default: 0
  },
  
  grandTotal: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  
  dueAmount: {
    type: Number,
    default: 0
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  dueDate: Date,
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String, 
      enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'wallet', 'insurance', 'other'],
      required: true
    },
   transactionId: String,
    paymentGateway: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    paidAt: {
      type: Date,
      default: Date.now
    }
  }],
  insuranceClaim: {
    isInsured: {
      type: Boolean,
      default: false
    },
    provider: String,
    policyNumber: String,
    claimNumber: String,
    claimAmount: Number,
    approvedAmount: Number,
   status: {
      type: String,
      enum: ['not_claimed', 'submitted', 'under_review', 'approved', 'rejected', 'settled'],
      default: 'not_claimed'
    },
    submittedAt: Date,
    settledAt: Date,
    rejectionReason: String,
    documents: [{
      name: String,
      url: String,
      uploadedAt: Date
    }]
  },
  refund: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transactionId: String
  },
  notes: String,
  internalNotes: String,
  status: {
    type: String,
   enum: ['draft', 'finalized', 'cancelled'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
   ref: 'User'
  },
  
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  cancelledAt: Date,
  cancellationReason: String
  
}, {
  timestamps: true
});
clinicBillingSchema.index({ clinicId: 1, billDate: -1 });
clinicBillingSchema.index({ clinicId: 1, paymentStatus: 1 });
clinicBillingSchema.index({ patientId: 1, billDate: -1 });
clinicBillingSchema.index({ billNumber: 1 });
clinicBillingSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    const date = new Date();
    const prefix = `BILL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({
      clinicId: this.clinicId,
      billNumber: new RegExp(`^${prefix}`)
    });
    this.billNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  this.subtotal = this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  this.totalDiscount = this.items.reduce((sum, item) => {
    if (item.discountType === 'percentage') {
      return sum + (item.unitPrice * item.quantity * item.discount / 100);
    }
    return sum + item.discount;
  }, 0);
  this.totalTax = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  this.grandTotal = this.subtotal - this.totalDiscount + this.totalTax + this.roundOff;
  this.dueAmount = this.grandTotal - this.paidAmount;
  if (this.paidAmount >= this.grandTotal) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.paymentStatus = 'overdue';
  }
  
  next();
});
clinicBillingSchema.methods.addPayment = async function(paymentDetails) {
  this.payments.push(paymentDetails);
  this.paidAmount += paymentDetails.amount;
  return this.save();
};
clinicBillingSchema.statics.getRevenueSummary = async function(clinicId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        clinicId: new mongoose.Types.ObjectId(clinicId),
        billDate: { $gte: startDate, $lte: endDate },
        status: 'finalized'
      }
   },
    {
      $group: {
       _id: null,
        totalBills: { $sum: 1 },
        totalRevenue: { $sum: '$grandTotal' },
        totalCollected: { $sum: '$paidAmount' },
        totalPending: { $sum: '$dueAmount' },
        totalDiscount: { $sum: '$totalDiscount' },
        totalTax: { $sum: '$totalTax' }
      }
    }
  ]);
};
clinicBillingSchema.statics.getDailyRevenue = async function(clinicId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        clinicId: new mongoose.Types.ObjectId(clinicId),
        billDate: { $gte: startDate },
        status: 'finalized'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } },
        revenue: { $sum: '$grandTotal' },
       collected: { $sum: '$paidAmount' },
        bills: { $sum: 1 }
      }
    },
   { $sort: { _id: 1 } }
  ]);
};

clinicBillingSchema.set('toJSON', { virtuals: true });
clinicBillingSchema.set('toObject', { virtuals: true }); 

module.exports = mongoose.model('ClinicBilling', clinicBillingSchema);
