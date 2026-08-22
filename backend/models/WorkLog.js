import mongoose from 'mongoose';
import Counter from './Counter.js';

const workLogSchema = new mongoose.Schema(
  {
    workLogId: {
      type: String,
      unique: true,
    },
    jobCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCard',
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    workDescription: {
      type: String,
      required: true,
    },
    workStartTime: {
      type: Date,
      required: true,
    },
    workEndTime: {
      type: Date,
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: false, // Auto-calculated in pre-save hook
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

workLogSchema.pre('save', async function (next) {
  if (!this.workLogId) {
    try {
      // Use atomic counter for guaranteed unique work log IDs
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const seq = await Counter.increment('workLogNumber');
      this.workLogId = `WL-${dateStr}-${String(seq).padStart(3, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.workLogId = `WL-${timestamp}${random}`;
    }
  }
  
  // Auto-calculate hours worked
  if (this.workStartTime && this.workEndTime) {
    const diffMs = this.workEndTime - this.workStartTime;
    this.hoursWorked = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
  }
  
  next();
});

const WorkLog = mongoose.model('WorkLog', workLogSchema);
export default WorkLog;