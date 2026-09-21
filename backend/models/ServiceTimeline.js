import mongoose from 'mongoose';

const serviceTimelineSchema = new mongoose.Schema(
  {
    timelineId: {
      type: String,
      unique: true,
    },
    jobCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobCard',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'appointment_approved',
        'appointment_rejected',
        'vehicle_checked_in',
        'inspection_started',
        'inspection_completed',
        'parts_requested',
        'parts_approved',
        'parts_issued',
        'repair_started',
        'waiting_for_parts',
        'repair_in_progress',
        'testing_started',
        'testing_completed',
        'work_completed',
        'ready_for_pickup',
        'vehicle_delivered',
        'invoice_generated',
        'payment_received',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedByName: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serviceTimelineSchema.pre('save', async function (next) {
  if (!this.timelineId) {
    const count = await mongoose.model('ServiceTimeline').countDocuments();
    this.timelineId = `TLN${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
serviceTimelineSchema.index({ jobCard: 1, createdAt: -1 });
serviceTimelineSchema.index({ appointment: 1, createdAt: -1 });

const ServiceTimeline = mongoose.model('ServiceTimeline', serviceTimelineSchema);
export default ServiceTimeline;
