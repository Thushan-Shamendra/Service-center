import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: [
        'appointment_confirmed', 'appointment_rejected', 'appointment_reminder',
        'vehicle_received', 'repair_started', 'waiting_for_parts',
        'vehicle_ready', 'invoice_generated', 'payment_received',
        'service_reminder', 'warranty_expiry', 'insurance_expiry',
        'low_stock', 'purchase_order_pending', 'payment_due',
        'user_added', 'leave_request', 'payroll', 'service_update',
        'system_alert', 'system', 'general',
        'vehicle_checked_in', 'inspection_started', 'inspection_completed',
        'testing_started', 'work_completed', 'road_test_pending',
        'ready_for_pickup', 'vehicle_delivered', 'job_cancelled', 'status_changed',
        'quotation_submitted', 'quotation_approved', 'quotation_rejected',
        'payment_submitted', 'payment_pending', 'payment_verified', 'payment_rejected', 'payment_refunded',
      ],
      default: 'general',
    },
    isRead: { type: Boolean, default: false },
    link: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
