import mongoose from 'mongoose';

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      unique: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },
    poNumber: {
      type: String,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InventoryItem',
        },
        itemName: {
          type: String,
          required: true,
        },
        partNumber: String,
        orderedQuantity: {
          type: Number,
          required: true,
        },
        receivedQuantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0,
        },
        tax: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          required: true,
        },
        condition: {
          type: String,
          enum: ['good', 'damaged', 'defective'],
          default: 'good',
        },
        notes: String,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['partial', 'complete'],
      default: 'complete',
    },
    notes: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    warehouseLocation: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

grnSchema.pre('save', async function (next) {
  if (!this.grnNumber) {
    const count = await mongoose.model('GRN').countDocuments();
    this.grnNumber = `GRN-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const GRN = mongoose.model('GRN', grnSchema);
export default GRN;
