import mongoose from 'mongoose';

const payrollSettingsSchema = new mongoose.Schema(
  {
    // EPF/ETF Configuration
    epfEmployeeRate: {
      type: Number,
      default: 8, // 8%
      description: 'EPF contribution rate for employees'
    },
    epfEmployerRate: {
      type: Number,
      default: 12, // 12%
      description: 'EPF contribution rate for employers'
    },
    etfEmployerRate: {
      type: Number,
      default: 3, // 3%
      description: 'ETF contribution rate for employers'
    },
    
    // Overtime Configuration
    overtimeRateMultiplier: {
      type: Number,
      default: 1.5,
      description: 'Multiplier for overtime rate calculation'
    },
    standardWorkingHours: {
      type: Number,
      default: 160,
      description: 'Standard working hours per month for overtime calculation'
    },
    
    // Tax Configuration
    taxThreshold: {
      type: Number,
      default: 500000,
      description: 'Annual income threshold for tax calculation'
    },
    taxRate: {
      type: Number,
      default: 0,
      description: 'Tax rate for income above threshold'
    },
    
    // Company Information for Payslips
    companyName: {
      type: String,
      default: 'VSMS - Vehicle Service Management System'
    },
    companyAddress: {
      type: String,
      default: ''
    },
    companyContact: {
      type: String,
      default: ''
    },
    companyEmail: {
      type: String,
      default: ''
    },
    
    // Payroll Processing Settings
    processingDay: {
      type: Number,
      default: 25,
      description: 'Day of month to process payroll'
    },
    paymentDay: {
      type: Number,
      default: 1,
      description: 'Day of month to pay salaries'
    },
    
    // Leave Deduction Settings
    unpaidLeaveDeduction: {
      type: Boolean,
      default: true,
      description: 'Whether to deduct unpaid leave from salary'
    },
    
    // Salary Advance Settings
    maxAdvancePercentage: {
      type: Number,
      default: 30,
      description: 'Maximum percentage of salary that can be requested as advance'
    },
    maxAdvanceAmount: {
      type: Number,
      default: 50000,
      description: 'Maximum absolute amount for salary advance'
    },
    requireManagerApproval: {
      type: Boolean,
      default: true,
      description: 'Whether manager approval is required for advances'
    },
    
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const PayrollSettings = mongoose.model('PayrollSettings', payrollSettingsSchema);
export default PayrollSettings;
