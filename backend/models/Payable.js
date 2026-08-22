import mongoose from 'mongoose';

const payableSchema = new mongoose.Schema(
  {
    payableId: {
      type: String,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['purchase_order', 'grn', 'service'],
      default: 'purchase_order',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

payableSchema.pre('save', async function (next) {
  if (!this.payableId) {
    const count = await mongoose.model('Payable').countDocuments();
    this.payableId = `PAY-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate outstanding balance
  this.outstandingBalance = this.amount - this.paidAmount;

  // Update status based on payment
  if (this.outstandingBalance === 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }

  next();
});

const Payable = mongoose.model('Payable', payableSchema);
export default Payable;
