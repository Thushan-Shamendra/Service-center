import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    movementId: {
      type: String,
      unique: true,
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
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['purchase', 'sale', 'job_card', 'adjustment', 'return', 'transfer'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    remarks: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByRole: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

stockMovementSchema.pre('save', async function (next) {
  if (!this.movementId) {
    const count = await mongoose.model('StockMovement').countDocuments();
    this.movementId = `STM${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;
