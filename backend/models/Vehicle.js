import mongoose from 'mongoose';
import Counter from './Counter.js';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    vin: {
      type: String,
      trim: true,
    },
    engineNumber: {
      type: String,
      trim: true,
    },
    chassisNumber: {
      type: String,
      trim: true,
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    manufactureYear: {
      type: Number,
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'hybrid', 'electric', 'other'],
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic', 'cvt', 'other'],
    },
    currentMileage: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      trim: true,
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },
    warranty: {
      provider: String,
      expiryDate: Date,
      details: String,
    },
    currentServiceStatus: {
      type: String,
      enum: ['none', 'in_service', 'ready_for_pickup'],
      default: 'none',
    },
    nextRecommendedService: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate vehicle ID
vehicleSchema.pre('save', async function (next) {
  if (!this.vehicleId) {
    try {
      // Use atomic counter to generate guaranteed unique vehicle IDs
      const seq = await Counter.increment('vehicleId');
      this.vehicleId = `VEH-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.vehicleId = `VEH-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
