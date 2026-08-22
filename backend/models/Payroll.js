import mongoose from 'mongoose';
import Counter from './Counter.js';

const payrollSchema = new mongoose.Schema(
  {
    payrollId: {
      type: String,
      unique: true,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true, // 1-12
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    // Sri Lankan EPF / ETF
    epfEmployee: {
      type: Number, // 8% of Basic
      required: true,
    },
    epfEmployer: {
      type: Number, // 12% of Basic
      required: true,
    },
    etfEmployer: {
      type: Number, // 3% of Basic
      required: true,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    loanDeductions: {
      type: Number,
      default: 0,
    },
    salaryAdvanceDeductions: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer',
    },
    paymentDate: Date,
    status: {
      type: String,
      enum: ['draft', 'calculated', 'generated', 'pending_approval', 'processed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Auto-generate payroll ID
payrollSchema.pre('save', async function (next) {
  if (!this.payrollId) {
    try {
      // Use atomic counter to generate guaranteed unique payroll IDs
      const seq = await Counter.increment('payrollId');
      this.payrollId = `PAY-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.payrollId = `PAY-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
