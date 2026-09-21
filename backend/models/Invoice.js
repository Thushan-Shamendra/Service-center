import mongoose from 'mongoose';
import Counter from './Counter.js';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', unique: true, sparse: true },
    jobCard: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        discount: { type: Number, default: 0 },
        total: Number,
      },
    ],
    laborCharges: [
      {
        description: String,
        hours: Number,
        ratePerHour: Number,
        total: Number,
      },
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
    },
    dueDate: Date,
    notes: String,
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    try {
      // Use atomic counter to generate guaranteed unique invoice numbers
      const seq = await Counter.increment('invoiceNumber');
      this.invoiceNumber = `INV-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    }
  }
  this.outstandingBalance = this.grandTotal - this.amountPaid;
  if (this.amountPaid >= this.grandTotal) this.paymentStatus = 'paid';
  else if (this.amountPaid > 0) this.paymentStatus = 'partially_paid';
  else this.paymentStatus = 'unpaid';
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
