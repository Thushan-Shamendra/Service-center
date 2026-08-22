import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewId: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    jobCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCard',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    serviceQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    mechanicPerformance: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    overallExperience: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre('save', async function (next) {
  if (!this.reviewId) {
    const count = await mongoose.model('Review').countDocuments();
    this.reviewId = `REV${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Ensure one review per job card per customer
reviewSchema.index({ customer: 1, jobCard: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
