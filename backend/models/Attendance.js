import mongoose from 'mongoose';
import Counter from './Counter.js';

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      unique: true,
      sparse: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'on_leave', 'half_day', 'holiday'],
      default: 'present',
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    remarks: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Auto-generate attendance ID
attendanceSchema.pre('save', async function (next) {
  if (!this.attendanceId || this.isNew) {
    try {
      // Use atomic counter to generate guaranteed unique attendance IDs
      const seq = await Counter.increment('attendanceId');
      this.attendanceId = `ATT-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based ID if counter fails
      const timestamp = Date.now().toString().slice(-5);
      this.attendanceId = `ATT-${timestamp.padStart(5, '0')}`;
    }
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
