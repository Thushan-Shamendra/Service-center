import mongoose from 'mongoose';
import Counter from './Counter.js';

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    staffId: {
      type: String,
      required: true,
    },
    currentSalary: {
      type: Number,
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    interestAmount: {
      type: Number,
      required: true,
    },
    totalRepayable: {
      type: Number,
      required: true,
    },
    installments: {
      type: Number,
      required: true,
      min: 1,
    },
    monthlyDeduction: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'completed', 'rejected'],
      default: 'pending',
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
    completedDate: {
      type: Date,
    },
    repaymentHistory: [
      {
        installmentNumber: {
          type: Number,
          required: true,
        },
        payrollMonth: {
          type: Number,
          required: true,
        },
        payrollYear: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        balanceAfterPayment: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ['paid', 'pending'],
          default: 'paid',
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate loan ID
loanSchema.pre('save', async function (next) {
  if (!this.loanId) {
    try {
      // Use atomic counter to generate guaranteed unique loan IDs
      const seq = await Counter.increment('loanId');
      this.loanId = `LN-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.loanId = `LN-${Date.now().toString().slice(-8)}`;
    }
  }
  
  // Calculate interest and totals
  if (this.isNew || this.isModified('loanAmount') || this.isModified('interestRate')) {
    this.interestAmount = Math.round(this.loanAmount * (this.interestRate / 100));
    this.totalRepayable = this.loanAmount + this.interestAmount;
    this.monthlyDeduction = Math.round(this.totalRepayable / this.installments);
    this.outstandingBalance = this.totalRepayable;
  }
  
  // Set completed date when loan is fully paid
  if (this.outstandingBalance === 0 && this.status === 'active') {
    this.status = 'completed';
    this.completedDate = new Date();
  }
  
  next();
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
