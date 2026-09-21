import mongoose from 'mongoose';
import Counter from './Counter.js';

const jobCardSchema = new mongoose.Schema(
  {
    jobCardNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    complaint: {
      type: String,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    serviceBay: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: Date,
    estimatedDeliveryDate: Date,
    assignedDate: Date,
    assignedTime: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    estimatedTime: String,
    services: [
      {
        name: String,
        description: String,
      },
    ],
    status: {
      type: String,
      enum: [
        'pending',
        'inspection_started',
        'inspection_complete',
        'repair_started',
        'waiting_for_parts',
        'repair_in_progress',
        'testing',
        'work_complete',
        'road_test_pending',
        'ready_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    inspectionNotes: String,
    inspectionDate: Date,
    odometer: Number,
    vehicleCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'needs_further_repair'],
    },
    problemsFound: [String],
    recommendedRepairs: [String],
    workPerformed: [String],
    parts: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
        name: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],
    timeLogs: [
      {
        type: { type: String, enum: ['inspection', 'repair', 'testing', 'waiting', 'break'] },
        description: String,
        startTime: Date,
        endTime: Date,
        hoursWorked: Number,
        remarks: String,
      },
    ],
    evidence: [
      {
        type: { type: String, enum: ['before', 'after', 'document', 'video'] },
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    roadTest: {
      date: Date,
      result: { type: String, enum: ['pass', 'fail'] },
      remarks: String,
      mileageAfterTest: Number,
    },
    finalInspection: {
      finalCondition: { type: String, enum: ['excellent', 'good', 'fair', 'needs_further_repair'] },
      safetyCheck: { type: String, enum: ['pass', 'fail'] },
      remainingIssues: String,
      futureRecommendations: String,
      mechanicRemarks: String,
      signature: String,
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remarks: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

jobCardSchema.pre('save', async function (next) {
  if (!this.jobCardNumber) {
    try {
      // Use atomic counter to generate guaranteed unique job card numbers
      const seq = await Counter.increment('jobCardNumber');
      this.jobCardNumber = `JOB-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback: use timestamp-based ID if counter fails
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.jobCardNumber = `JOB-${timestamp}${random}`;
    }
  }
  next();
});

const JobCard = mongoose.model('JobCard', jobCardSchema);
export default JobCard;
