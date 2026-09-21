import mongoose from 'mongoose';
import Counter from './Counter.js';

const sparePartsRequestSchema = new mongoose.Schema(
  {
    requestId: {
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
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    approvedQuantity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'issued', 'completed'],
      default: 'pending',
    },
    managerRemarks: {
      type: String,
      trim: true,
    },
    approvedAt: Date,
    issueDate: Date,
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    usedQuantity: {
      type: Number,
      default: 0,
    },
    usageType: {
      type: String,
      enum: ['full', 'partial'],
      default: 'full',
    },
    usageDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sparePartsRequestSchema.pre('save', async function (next) {
  if (!this.requestId) {
    try {
      // Use atomic counter for guaranteed unique parts request IDs
      const seq = await Counter.increment('sparePartsRequestNumber');
      this.requestId = `SPR-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.requestId = `SPR-${timestamp}${random}`;
    }
  }
  next();
});

const SparePartsRequest = mongoose.model('SparePartsRequest', sparePartsRequestSchema);
export default SparePartsRequest;
