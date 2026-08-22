import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'user_created',
        'user_updated',
        'user_deleted',
        'user_status_changed',
        'customer_created',
        'customer_updated',
        'vehicle_created',
        'vehicle_updated',
        'appointment_created',
        'appointment_approved',
        'appointment_rejected',
        'appointment_rescheduled',
        'job_card_created',
        'job_card_status_changed',
        'quotation_created',
        'quotation_approved',
        'quotation_rejected',
        'invoice_created',
        'invoice_approved',
        'payment_recorded',
        'stock_adjusted',
        'parts_requested',
        'parts_approved',
        'parts_issued',
        'payroll_processed',
        'financial_entry_created',
        'settings_updated',
      ],
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    entityName: {
      type: String,
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditLogSchema.pre('save', async function (next) {
  if (!this.logId) {
    const count = await mongoose.model('AuditLog').countDocuments();
    this.logId = `LOG${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
