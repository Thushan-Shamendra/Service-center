import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

dotenv.config();

const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB for employee index repair...');

    // Drop problematic index if needed or ensure employees have valid IDs
    try {
      await Employee.collection.dropIndex('employeeId_1');
      console.log('Dropped old employeeId_1 index');
    } catch (e) {
      console.log('Index employeeId_1 drop note:', e.message);
    }

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employee documents.`);

    let count = 1;
    for (const emp of employees) {
      if (!emp.employeeId) {
        emp.employeeId = `EMP${String(count).padStart(4, '0')}`;
        await emp.save();
        console.log(`Updated employee ${emp._id} with employeeId ${emp.employeeId}`);
      }
      count++;
    }

    // Now find all employee / manager role users without employee profiles
    const usersWithoutProfiles = await User.find({
      role: { $in: ['employee', 'manager'] },
    });

    for (const user of usersWithoutProfiles) {
      const existing = await Employee.findOne({ user: user._id });
      if (!existing) {
        const empCount = await Employee.countDocuments();
        const newEmp = await Employee.create({
          user: user._id,
          employeeId: `EMP${String(empCount + 1).padStart(4, '0')}`,
          designation: user.role === 'manager' ? 'Workshop Manager' : 'Technician',
          basicSalary: user.role === 'manager' ? 85000 : 65000,
        });
        console.log(`Created employee profile ${newEmp.employeeId} for user ${user.username} (${user._id})`);
      }
    }

    console.log('✨ All employee profiles repaired successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database:', err);
    process.exit(1);
  }
};

fixDatabase();
