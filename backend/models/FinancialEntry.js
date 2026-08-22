import mongoose from 'mongoose';

const financialEntrySchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      unique: true,
    },
    entryType: {
      type: String,
      enum: ['expense', 'income', 'journal', 'bank_transaction', 'cash_register'],
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Double-entry accounting entries for Journal
    lineItems: [
      {
        account: { type: String, required: true },
        description: String,
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
      },
    ],
    totalDebit: {
      type: Number,
      default: 0,
    },
    totalCredit: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'card'],
      default: 'cash',
    },
    referenceNumber: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

financialEntrySchema.pre('save', async function (next) {
  if (!this.voucherNumber) {
    const count = await mongoose.model('FinancialEntry').countDocuments();
    const prefix = this.entryType.toUpperCase().slice(0, 3);
    this.voucherNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  // Validate Journal Entry Debit = Credit
  if (this.entryType === 'journal' && this.lineItems && this.lineItems.length > 0) {
    this.totalDebit = this.lineItems.reduce((sum, item) => sum + (item.debit || 0), 0);
    this.totalCredit = this.lineItems.reduce((sum, item) => sum + (item.credit || 0), 0);

    if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
      return next(new Error(`Journal Entry Unbalanced! Total Debit (Rs. ${this.totalDebit.toFixed(2)}) must equal Total Credit (Rs. ${this.totalCredit.toFixed(2)})`));
    }
  }
  next();
});

const FinancialEntry = mongoose.model('FinancialEntry', financialEntrySchema);
export default FinancialEntry;
