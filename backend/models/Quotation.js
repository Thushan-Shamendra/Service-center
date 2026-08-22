import mongoose from 'mongoose';

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
        quantity: Number,
        unitPrice: Number,
        discount: { type: Number, default: 0 },
        total: Number,
      },
    ],
    laborCharge: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 1 },
    laborCost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
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
  },
  { timestamps: true }
);

quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QTN${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate totals from backend
  const partsTotal = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
  this.laborCost = this.laborCharge * this.estimatedHours;
  this.subtotal = partsTotal + this.laborCost;
  this.taxAmount = (this.subtotal * (this.taxRate || 0)) / 100;
  this.grandTotal = this.subtotal + this.taxAmount;

  next();
});

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
