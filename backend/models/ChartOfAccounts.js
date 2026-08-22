import mongoose from 'mongoose';

const chartOfAccountsSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
      required: true,
    },
    parent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for efficient searching (code index already created by unique: true)
chartOfAccountsSchema.index({ type: 1 });
chartOfAccountsSchema.index({ status: 1 });

const ChartOfAccounts = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);
export default ChartOfAccounts;