import mongoose from 'mongoose';
import Counter from './Counter.js';

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
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
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time is required'],
    },
    complaint: {
      type: String,
      trim: true,
    },
    estimatedDuration: {
      type: Number,
      default: 2,
    },
    images: [String],
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'rescheduled', 'cancelled', 'completed'],
      default: 'pending',
    },
    rejectionReason: String,
    rescheduleDate: Date,
    rescheduleTime: String,
    notes: String,
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'rescheduled', 'cancelled', 'completed'],
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remarks: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

appointmentSchema.pre('save', async function (next) {
  if (!this.appointmentNumber) {
    try {
      // Use atomic counter to generate guaranteed unique appointment numbers
      // This prevents race conditions when multiple appointments are created concurrently
      const seq = await Counter.increment('appointmentNumber');
      this.appointmentNumber = `APT-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback: use timestamp-based ID if counter fails
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.appointmentNumber = `APT-${timestamp}${random}`;
    }
  }
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;