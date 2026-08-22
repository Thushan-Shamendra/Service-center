import mongoose from 'mongoose';

const cashRegisterSchema = new mongoose.Schema(
  {
    registerId: {
      type: String,
      unique: true,
    },
    location: {
      type: String,
      required: true,
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

cashRegisterSchema.pre('save', async function (next) {
  if (!this.registerId) {
    const count = await mongoose.model('CashRegister').countDocuments();
    this.registerId = `CR-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const CashRegister = mongoose.model('CashRegister', cashRegisterSchema);
export default CashRegister;
