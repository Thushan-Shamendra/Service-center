import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    supplierId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
    category: { type: String, trim: true },
    bankDetails: {
      bankName: {
        type: String,
        enum: [
          'Bank of Ceylon',
          'Commercial Bank of Ceylon',
          "People's Bank",
          'Hatton National Bank',
          'Sampath Bank',
          'National Development Bank',
          'Nations Trust Bank',
          'Standard Chartered Bank',
          'HSBC Sri Lanka',
          'Union Bank of Colombo',
          'Pan Asia Bank',
          'Amana Bank',
          'Seylan Bank',
          'DFCC Bank',
          'Citizens Development Bank',
        ],
      },
      branch: {
        type: String,
        enum: [
          'Colombo Main',
          'Colombo 02',
          'Colombo 03',
          'Colombo 04',
          'Colombo 05',
          'Colombo 07',
          'Colombo 10',
          'Colombo 12',
          'Colombo 15',
          'Kandy Main',
          'Galle Main',
          'Jaffna Main',
          'Matara Main',
          'Negombo Main',
          'Kurunegala Main',
          'Anuradhapura Main',
          'Ratnapura Main',
          'Batticaloa Main',
          'Trincomalee Main',
          'Badulla Main',
        ],
      },
      accountNumber: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

supplierSchema.pre('save', async function (next) {
  if (!this.supplierId) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
