import mongoose from 'mongoose';
import Counter from './Counter.js';

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    jobCard: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' },
    items: [
      {
        part: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
        name: String,
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: Number,
      },
    ],
    laborCharge: { type: Number, default: 0, min: 0 },
    estimatedHours: { type: Number, default: 1, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'converted'],
      default: 'draft',
    },
    validUntil: Date,
    notes: String,
    rejectionReason: String,
    approvedBy: String,
    approvedAt: Date,
  },
  { timestamps: true, optimisticConcurrency: true }
);

quotationSchema.pre('validate', function (next) {
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  for (const item of this.items) {
    const gross = item.quantity * item.unitPrice;
    if (item.discount > gross) this.invalidate('items', 'Item discount cannot exceed its price');
    item.total = round(gross - (item.discount || 0));
  }
  this.laborCost = round(this.laborCharge * this.estimatedHours);
  this.subtotal = round(this.items.reduce((sum, item) => sum + item.total, 0) + this.laborCost);
  if (this.discount > this.subtotal) this.invalidate('discount', 'Discount cannot exceed subtotal');
  this.taxAmount = round(((this.subtotal - this.discount) * this.taxRate) / 100);
  this.grandTotal = round(this.subtotal - this.discount + this.taxAmount);
  next();
});

quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    // Bootstrap above existing numbers, including databases created before counters.
    const latest = await mongoose.model('Quotation').findOne({ quotationNumber: /^QTN\d+$/ })
      .sort({ quotationNumber: -1 }).select('quotationNumber').lean();
    await Counter.updateOne({ _id: 'quotationNumber' },
      { $max: { seq: Number(latest?.quotationNumber.slice(3) || 0) } }, { upsert: true });
    const seq = await Counter.increment('quotationNumber');
    this.quotationNumber = `QTN${String(seq).padStart(5, '0')}`;
  }

  next();
});

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
