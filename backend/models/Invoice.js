const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [{
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: Number
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentMethod: String,
  paymentId: String,
  dueDate: Date,
  paidAt: Date,
  notes: String,
  insuranceClaim: {
    provider: String,
    policyNumber: String,
    claimAmount: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] }
  }
}, { timestamps: true });

// Generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
  }
  this.dueAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
