import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    serviceCode: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: false,
    },
    description: {
      type: String,
      trim: true,
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    laborCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    baseServicePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
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

// Virtual for total price (base + labor + tax)
serviceSchema.virtual('totalPrice').get(function () {
  const subtotal = this.baseServicePrice + this.laborCharge;
  const tax = (subtotal * this.taxRate) / 100;
  return subtotal + tax;
});

serviceSchema.pre('save', async function (next) {
  if (!this.serviceCode) {
    const latestService = await mongoose.model('Service').findOne({
      serviceCode: { $exists: true, $ne: null }
    }).sort({ serviceCode: -1 }).select('serviceCode');
    
    let nextNumber = 1;
    if (latestService && latestService.serviceCode) {
      const currentNumber = parseInt(latestService.serviceCode.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    
    this.serviceCode = `SVC-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
