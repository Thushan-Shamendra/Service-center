import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema(
  {
    timeLogId: {
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
    recordDate: {
      type: Date,
      required: true,
    },
    inspectionTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    repairTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    waitingTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    testingTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    breakTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    totalWorkingHours: {
      type: Number,
      required: true,
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

timeLogSchema.pre('validate', async function (next) {
  if (!this.timeLogId) {
    const count = await mongoose.model('TimeLog').countDocuments();
    this.timeLogId = `TL${String(count + 1).padStart(5, '0')}`;
  }
  
  // Auto-calculate total working hours
  const inspectionTotal = (this.inspectionTime?.hours || 0) + ((this.inspectionTime?.minutes || 0) / 60);
  const repairTotal = (this.repairTime?.hours || 0) + ((this.repairTime?.minutes || 0) / 60);
  const waitingTotal = (this.waitingTime?.hours || 0) + ((this.waitingTime?.minutes || 0) / 60);
  const testingTotal = (this.testingTime?.hours || 0) + ((this.testingTime?.minutes || 0) / 60);
  const breakTotal = (this.breakTime?.hours || 0) + ((this.breakTime?.minutes || 0) / 60);
  
  this.totalWorkingHours = inspectionTotal + repairTotal + waitingTotal + testingTotal - breakTotal;
  
  next();
});

const TimeLog = mongoose.model('TimeLog', timeLogSchema);
export default TimeLog;