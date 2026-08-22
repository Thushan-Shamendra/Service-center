import mongoose from 'mongoose';
import Counter from './Counter.js';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveId: {
      type: String,
      unique: true,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['annual', 'casual', 'medical', 'emergency', 'maternity', 'unpaid'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total days is required'],
      min: 1,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    remarks: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate leave ID
leaveSchema.pre('save', async function (next) {
  if (!this.leaveId) {
    try {
      // Use atomic counter to generate guaranteed unique leave IDs
      const seq = await Counter.increment('leaveId');
      this.leaveId = `LV-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.leaveId = `LV-${Date.now().toString().slice(-8)}`;
    }
  }
  
  // Auto-calculate total days if not provided
  if (!this.totalDays && this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
    this.totalDays = diffDays;
  }
  
  next();
});

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
