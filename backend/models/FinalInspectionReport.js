import mongoose from 'mongoose';

const finalInspectionReportSchema = new mongoose.Schema(
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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
    workPerformed: [
      {
        type: String,
      },
    ],
    partsReplaced: [
      {
        itemName: String,
        partNumber: String,
        quantity: Number,
        status: String,
        cost: Number,
        serialNumber: String,
      },
    ],
    totalPartsCost: {
      type: Number,
      default: 0,
    },
    laborCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    finalCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs_repair'],
      required: true,
    },
    safetyCheck: {
      overallStatus: {
        type: String,
        enum: ['pass', 'fail', 'requires_re-inspection'],
        default: 'pass',
      },
      checkedItems: [String],
    },
    roadTestResult: {
      result: {
        type: String,
        enum: ['pass', 'fail', 'pending'],
        default: 'pending',
      },
      remarks: String,
      testDate: Date,
    },
    roadTestId: {
      type: String,
    },
    remainingIssues: String,
    remainingIssuesPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    futureRecommendations: [
      {
        type: String,
      },
    ],
    mechanicRemarks: {
      type: String,
      required: true,
      maxLength: 500,
    },
    evidence: [
      {
        type: { type: String, enum: ['before', 'after', 'document', 'video'] },
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'completed'],
      default: 'draft',
    },
    timeSummary: {
      inspectionTime: String,
      repairTime: String,
      waitingTime: String,
      testingTime: String,
      totalTime: String,
      totalHours: Number,
    },
    reportSummary: {
      totalPartsCost: Number,
      laborCost: Number,
      totalCost: Number,
      totalHours: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

finalInspectionReportSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const count = await mongoose.model('FinalInspectionReport').countDocuments();
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.reportId = `FIN-${dateStr}-${randomNum}`;
  }
  
  // Calculate total parts cost
  if (this.partsReplaced && this.partsReplaced.length > 0) {
    this.totalPartsCost = this.partsReplaced.reduce((sum, part) => sum + (part.cost || 0), 0);
  }
  
  next();
});

const FinalInspectionReport = mongoose.model('FinalInspectionReport', finalInspectionReportSchema);
export default FinalInspectionReport;
