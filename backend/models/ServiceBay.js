import mongoose from 'mongoose';

const serviceBaySchema = new mongoose.Schema(
  {
    bayNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    capacity: {
      type: Number,
      default: 1,
    },
    equipment: [String],
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const ServiceBay = mongoose.model('ServiceBay', serviceBaySchema);
export default ServiceBay;
