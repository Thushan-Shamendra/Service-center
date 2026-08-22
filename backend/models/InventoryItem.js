import mongoose from 'mongoose';
import Counter from './Counter.js';

const inventoryItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      unique: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Spare Part',
        'Lubricant',
        'Tire',
        'Battery',
        'Filter',
        'Accessory',
      ],
    },
    brand: {
      type: String,
      trim: true,
      enum: [
        'Toyota',
        'Honda',
        'Nissan',
        'Suzuki',
        'Mitsubishi',
        'Mazda',
        'Hyundai',
        'Kia',
        'BMW',
        'Mercedes-Benz',
        'Audi',
        'Volkswagen',
        'Ford',
        'Chevrolet',
        'Volvo',
        'Land Rover',
        'Jaguar',
        'Peugeot',
        'Renault',
        'Fiat',
        'Tata',
        'Mahindra',
        'Perodua',
        'Daihatsu',
        'Subaru',
        'Isuzu',
        'Hino',
        'UD Trucks',
        'Fuso',
        'Scania',
        'Volvo Trucks',
        'MAN',
        'Bosch',
        'Denso',
        'NGK',
        'Mobil',
        'Castrol',
        'Shell',
        'Valvoline',
        'Gates',
        'SKF',
        'Brembo',
        'ATE',
        'Valeo',
        'Mann-Filter',
        'K&N',
        '3M',
        'Other',
      ],
    },
    model: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: 'Piece',
      enum: ['Piece', 'Set', 'Liter', 'Milliliter', 'Kilogram', 'Gram', 'Box', 'Pack', 'Bottle', 'Can', 'Tube', 'Pair', 'Kit', 'Unit', 'Each'],
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    location: String,
    description: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
    movementHistory: [
      {
        type: { type: String, enum: ['in', 'out', 'adjustment'] },
        quantity: Number,
        reference: String,
        date: { type: Date, default: Date.now },
        remarks: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventoryItemSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderLevel;
});

inventoryItemSchema.pre('save', async function (next) {
  if (!this.itemCode) {
    try {
      // Use atomic counter to generate guaranteed unique item codes
      const seq = await Counter.increment('itemCode');
      this.itemCode = `ITM-${String(seq).padStart(5, '0')}`;
    } catch (error) {
      // Fallback if counter fails - use timestamp
      this.itemCode = `ITM-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
export default InventoryItem;
