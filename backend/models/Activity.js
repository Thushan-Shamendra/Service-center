import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['login', 'logout', 'create', 'update', 'delete', 'approve', 'reject', 'notification', 'payment', 'other'],
      default: 'other',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    module: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;