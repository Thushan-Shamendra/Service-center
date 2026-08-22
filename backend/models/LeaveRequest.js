import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    leaveRequestId: {
      type: String,
      unique: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'compensatory', 'emergency', 'medical', 'maternity', 'unpaid'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: ['morning', 'afternoon'],
      set: (v) => (v === '' || v === null || v === undefined ? undefined : v),
    },
    reason: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    attachments: [
      {
        type: { type: String, enum: ['image', 'pdf', 'document'] },
        url: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    adminRemarks: {
      type: String,
      maxlength: 500,
    },
    leaveBalance: {
      annual: { total: Number, used: Number, remaining: Number },
      sick: { total: Number, used: Number, remaining: Number },
      casual: { total: Number, used: Number, remaining: Number },
      compensatory: { total: Number, used: Number, remaining: Number },
      emergency: { total: Number, used: Number, remaining: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveRequestSchema.pre('save', async function (next) {
  if (!this.leaveRequestId) {
    const count = await mongoose.model('LeaveRequest').countDocuments();
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    this.leaveRequestId = `LR-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }
  
  // Auto-calculate total days
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.totalDays = this.isHalfDay ? 0.5 : diffDays;
  }
  
  next();
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
