import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'bank_transfer', 'cheque', 'card_machine'],
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
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    slipUrl: {
      type: String,
      trim: true,
    },
    payerName: {
      type: String,
      trim: true,
    },
    payerPhone: {
      type: String,
      trim: true,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      chequeNumber: String,
      chequeDate: Date,
    },
    cardDetails: {
      lastFourDigits: String,
      cardType: String,
      cardHolderName: String,
    },
    posTerminalDetails: {
      terminalId: String,
      authCode: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rejected', 'refunded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const latestPayment = await mongoose.model('Payment').findOne({
      paymentId: { $exists: true, $ne: null }
    }).sort({ paymentId: -1 }).select('paymentId');
    
    let nextNumber = 1;
    if (latestPayment && latestPayment.paymentId) {
      const currentNumber = parseInt(latestPayment.paymentId.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    
    this.paymentId = `PAY-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

// Index for efficient queries
paymentSchema.index({ invoice: 1, createdAt: -1 });
paymentSchema.index({ customer: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
