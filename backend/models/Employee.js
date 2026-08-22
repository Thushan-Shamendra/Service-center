import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    managerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    nic: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      default: () => new Date('1990-01-01'),
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
      default: 'male',
    },
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Technician',
    },
    employmentDate: {
      type: Date,
      required: [true, 'Employment date is required'],
      default: Date.now,
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0,
      default: 0,
    },
    bankName: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    skills: [String],
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate employee ID or manager ID before validation
employeeSchema.pre('validate', async function () {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    const timestamp = Date.now().toString().slice(-4);
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}-${timestamp}`;
  }
  if (!this.managerId && this.user) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    if (user && user.role === 'manager') {
      const mgrCount = await mongoose.model('Employee').countDocuments({ managerId: { $exists: true } });
      this.managerId = `MGR${String(mgrCount + 1).padStart(4, '0')}`;
    }
  }
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
