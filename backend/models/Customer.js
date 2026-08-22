import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    customerId: {
      type: String,
      unique: true,
      required: true,
    },
    nic: {
      type: String,
      trim: true,
    },
    passport: {
      type: String,
      trim: true,
    },
    address: {
      street: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      province: {
        type: String,
        default: '',
      },
      postalCode: {
        type: String,
        default: '',
      },
    },
    loyaltyTier: {
      type: String,
      enum: ['standard', 'silver', 'gold', 'platinum'],
      default: 'standard',
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
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

// Auto-generate customer ID
customerSchema.pre('validate', async function (next) {
  if (!this.customerId) {
    const latestCustomer = await mongoose.model('Customer').findOne({
      customerId: { $exists: true, $ne: null }
    }).sort({ customerId: -1 }).select('customerId');
    
    let nextNumber = 1;
    if (latestCustomer && latestCustomer.customerId) {
      const currentNumber = parseInt(latestCustomer.customerId.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    
    this.customerId = `CUST-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
