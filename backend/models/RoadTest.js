import mongoose from 'mongoose';
import Counter from './Counter.js';

const roadTestSchema = new mongoose.Schema(
  {
    roadTestId: {
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
    testDate: {
      type: Date,
      default: Date.now,
    },
    testTime: {
      type: Date,
      default: Date.now,
    },
    result: {
      type: String,
      enum: ['pass', 'fail'],
      required: true,
    },
    remarks: {
      type: String,
      required: true,
    },
    mileageBeforeTest: {
      type: Number,
      required: true,
    },
    mileageAfterTest: {
      type: Number,
      required: true,
    },
    distanceCovered: {
      type: Number,
    },
    evidence: [
      {
        type: { type: String, enum: ['image', 'video'] },
        url: String,
        description: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    checklist: [
      {
        item: String,
        passed: { type: Boolean, default: false },
      },
    ],
    failedItems: [
      {
        item: String,
        issue: String,
        action: String,
      },
    ],
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roadTestSchema.pre('save', async function (next) {
  if (!this.roadTestId) {
    try {
      // Use atomic counter for guaranteed unique road test IDs
      const seq = await Counter.increment('roadTestNumber');
      this.roadTestId = `RT${String(seq).padStart(5, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.roadTestId = `RT${timestamp}${random}`;
    }
  }
  
  // Auto-calculate distance covered
  if (this.mileageAfterTest && this.mileageBeforeTest) {
    this.distanceCovered = this.mileageAfterTest - this.mileageBeforeTest;
  }
  
  next();
});

const RoadTest = mongoose.model('RoadTest', roadTestSchema);
export default RoadTest;