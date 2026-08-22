import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    entryNumber: {
      type: String,
      unique: true,
    },
    entryDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    narration: {
      type: String,
      required: true,
      trim: true,
    },
    lineItems: [
      {
        account: {
          type: String,
          required: true,
        },
        accountCode: {
          type: String,
          required: true,
        },
        debit: {
          type: Number,
          default: 0,
        },
        credit: {
          type: Number,
          default: 0,
        },
        description: {
          type: String,
          trim: true,
        },
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
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Cancelled'],
      default: 'Posted',
    },
    postedDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-generate entry number
journalEntrySchema.pre('save', async function (next) {
  if (!this.entryNumber) {
    const count = await mongoose.model('JournalEntry').countDocuments();
    this.entryNumber = `JE-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate totals
  this.totalDebit = this.lineItems.reduce((sum, item) => sum + (item.debit || 0), 0);
  this.totalCredit = this.lineItems.reduce((sum, item) => sum + (item.credit || 0), 0);

  // Validate balance for posted entries
  if (this.status === 'Posted' && Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
    return next(new Error(`Journal entry must be balanced. Debit: ${this.totalDebit}, Credit: ${this.totalCredit}`));
  }

  if (this.status === 'Posted' && !this.postedDate) {
    this.postedDate = new Date();
  }

  next();
});

// Indexes (entryNumber index already created by unique: true)
journalEntrySchema.index({ entryDate: -1 });
journalEntrySchema.index({ status: 1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;