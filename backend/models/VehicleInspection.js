import mongoose from 'mongoose';

const vehicleInspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
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
    inspectionDate: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    odometerReading: {
      type: Number,
      required: true,
    },
    vehicleCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
      required: true,
    },
    problemsFound: [
      {
        category: {
          type: String,
          enum: ['brakes', 'suspension', 'engine', 'electrical', 'transmission', 'tires', 'other'],
        },
        problem: {
          type: String,
          required: true,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
        },
        evidence: [{
          type: String, // URLs to images/videos
        }],
      },
    ],
    inspectionNotes: {
      type: String,
      required: true,
    },
    recommendedRepairs: [String],
    estimatedAdditionalWork: {
      required: {
        type: Boolean,
        default: false,
      },
      description: String,
      estimatedDuration: {
        value: Number,
        unit: {
          type: String,
          enum: ['hours', 'minutes'],
          default: 'hours',
        },
      },
      estimatedCost: Number,
    },
    beforeMedia: [
      {
        type: { type: String, enum: ['image', 'video'] },
        url: String,
        category: String,
        description: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    requestedParts: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
        itemName: String,
        itemCode: String,
        quantity: { type: Number, required: true, min: 1 },
        reason: String,
        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
    },
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vehicleInspectionSchema.pre('save', async function (next) {
  if (!this.inspectionId) {
    const latestInspection = await mongoose.model('VehicleInspection').findOne({
      inspectionId: { $exists: true, $ne: null }
    }).sort({ inspectionId: -1 }).select('inspectionId');
    
    let nextNumber = 1;
    if (latestInspection && latestInspection.inspectionId) {
      const currentNumber = parseInt(latestInspection.inspectionId.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    
    this.inspectionId = `INS-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

const VehicleInspection = mongoose.model('VehicleInspection', vehicleInspectionSchema);
export default VehicleInspection;