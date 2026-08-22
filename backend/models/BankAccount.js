import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['current', 'savings', 'fixed_deposit'],
      default: 'current',
    },
    branch: {
      type: String,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    isActive: {
      type: Boolean,
      default: true,
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

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
