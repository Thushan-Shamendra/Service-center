import mongoose from 'mongoose';

const finalInspectionSchema = new mongoose.Schema(
  {
    reportId: {
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
    completionDate: {
      type: Date,
      default: Date.now,
    },
    workPerformed: {
      completedServices: [String],
      additionalWorkCompleted: String,
    },
    partsReplaced: [
      {
        itemCode: String,
        itemName: String,
        quantityUsed: Number,
        source: {
          type: String,
          enum: ['inventory', 'external'],
          default: 'inventory',
        },
      },
    ],
    finalVehicleCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs_further_repair'],
      required: true,
    },
    safetyCheck: {
      result: {
        type: String,
        enum: ['pass', 'fail'],
        required: true,
      },
      checklist: {
        brakes: { type: Boolean, default: false },
        steering: { type: Boolean, default: false },
        tires: { type: Boolean, default: false },
        lights: { type: Boolean, default: false },
        fluidLeaks: { type: Boolean, default: false },
        seatBelts: { type: Boolean, default: false },
      },
    },
    roadTestResult: {
      roadTestId: String,
      testDate: Date,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      result: {
        type: String,
        enum: ['pass', 'fail'],
      },
      mileageAfterTest: Number,
      remarks: String,
    },
    remainingIssues: {
      type: String,
    },
    futureRecommendations: {
      recommendedNextService: String,
      additionalRecommendations: String,
    },
    mechanicRemarks: {
      type: String,
      maxlength: 1000,
    },
    technicianSignature: {
      signatureData: String, // Base64 encoded signature
      signedAt: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },
    submittedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

finalInspectionSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const count = await mongoose.model('FinalInspection').countDocuments();
    this.reportId = `FIR${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const FinalInspection = mongoose.model('FinalInspection', finalInspectionSchema);
export default FinalInspection;