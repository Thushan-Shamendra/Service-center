import mongoose from 'mongoose';

const bankTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    referenceNumber: {
      type: String,
    },
    relatedTo: {
      type: String,
      enum: ['invoice', 'expense', 'payroll', 'supplier_payment', 'other'],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bankTransactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.model('BankTransaction').countDocuments();
    this.transactionId = `BNK-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);
export default BankTransaction;
