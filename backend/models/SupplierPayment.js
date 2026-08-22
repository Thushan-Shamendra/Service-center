import mongoose from 'mongoose';

const supplierPaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    poNumber: {
      type: String,
    },
    grn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GRN',
    },
    grnNumber: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'bank', 'cheque', 'credit_note', 'offset'],
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      transferReference: String,
    },
    chequeDetails: {
      chequeNumber: String,
      chequeDate: Date,
      bankName: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

supplierPaymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const count = await mongoose.model('SupplierPayment').countDocuments();
    this.paymentId = `PAY-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index for efficient queries
supplierPaymentSchema.index({ supplier: 1, createdAt: -1 });
supplierPaymentSchema.index({ paymentDate: -1 });

const SupplierPayment = mongoose.model('SupplierPayment', supplierPaymentSchema);
export default SupplierPayment;