import mongoose from 'mongoose';
import Counter from './Counter.js';

const salaryAdvanceSchema = new mongoose.Schema(
  {
    advanceId: {
      type: String,
      unique: true,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    currentSalary: {
      type: Number,
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minLength: [5, 'Reason must be at least 5 characters long'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    payrollStatus: {
      type: String,
      enum: ['pending_deduction', 'deducted', 'partially_deducted'],
      default: 'pending_deduction',
    },
    deductionMonth: {
      type: Number,
    },
    deductionYear: {
      type: Number,
    },
    deductedAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate advance ID
salaryAdvanceSchema.pre('save', async function (next) {
  try {
    if (!this.advanceId) {
      // Use atomic counter to generate guaranteed unique advance IDs
      const seq = await Counter.increment('advanceId');
      this.advanceId = `ADV-${String(seq).padStart(5, '0')}`;
    }
    
    // Set remaining amount equal to requested amount initially
    if (this.isNew && this.status === 'approved') {
      this.remainingAmount = this.requestedAmount;
    }
    
    next();
  } catch (error) {
    console.error('Error in SalaryAdvance pre-save hook:', error);
    next(error);
  }
});

const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
export default SalaryAdvance;
