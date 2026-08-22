import mongoose from 'mongoose';

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
    },
    grn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GRN',
      required: true,
    },
    grnNumber: {
      type: String,
      required: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    poNumber: {
      type: String,
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
    returnDate: {
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
        returnedQuantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        refundAmount: {
          type: Number,
          required: true,
        },
        itemReason: {
          type: String,
          required: true,
          enum: ['damaged', 'defective', 'wrong_item', 'expired', 'other'],
        },
        condition: {
          type: String,
          enum: ['good', 'damaged', 'defective'],
          default: 'damaged',
        },
        notes: String,
      },
    ],
    totalRefund: {
      type: Number,
      required: true,
      default: 0,
    },
    returnReason: {
      type: String,
      required: true,
      enum: ['damaged', 'wrong_item', 'defective', 'excess_quantity', 'expired', 'other'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'approved',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    refundMethod: {
      type: String,
      enum: ['credit_note', 'cash', 'bank_transfer', 'offset'],
    },
    refundReference: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseReturnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const count = await mongoose.model('PurchaseReturn').countDocuments();
    this.returnNumber = `RET-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
export default PurchaseReturn;