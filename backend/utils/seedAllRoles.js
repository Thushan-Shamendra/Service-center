import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';

dotenv.config();

const usersToSeed = [
  {
    username: 'admin',
    email: 'admin@vsms.lk',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'administrator',
    mobile: '+94771234567',
    isActive: true,
  },
  {
    username: 'manager',
    email: 'manager@vsms.lk',
    password: 'Manager@123',
    firstName: 'Service',
    lastName: 'Manager',
    role: 'manager',
    mobile: '+94772345678',
    isActive: true,
    designation: 'General Manager',
  },
  {
    username: 'employee',
    email: 'employee@vsms.lk',
    password: 'Employee@123',
    firstName: 'Senior',
    lastName: 'Technician',
    role: 'employee',
    mobile: '+94773456789',
    isActive: true,
    designation: 'Senior Auto Technician',
  },
  {
    username: 'customer',
    email: 'customer@vsms.lk',
    password: 'Customer@123',
    firstName: 'Kasun',
    lastName: 'Perera',
    role: 'customer',
    mobile: '+94774567890',
    isActive: true,
  },
];

const seedAllRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const userData of usersToSeed) {
      let existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });

      if (!existingUser) {
        const user = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          mobile: userData.mobile,
          isActive: true,
        });

        // Create related Employee profile if manager or employee
        if (userData.role === 'manager' || userData.role === 'employee') {
          await Employee.create({
            user: user._id,
            designation: userData.designation || 'Technician',
            dateOfBirth: new Date('1992-05-15'),
            gender: 'male',
            employmentDate: new Date(),
            basicSalary: userData.role === 'manager' ? 120000 : 75000,
            status: 'active',
          });
        }

        // Create related Customer profile if customer
        if (userData.role === 'customer') {
          await Customer.create({
            user: user._id,
            nic: '199512345678',
            loyaltyTier: 'gold',
            status: 'active',
          });
        }

        console.log(`✓ Created: [${userData.role.toUpperCase()}] ${userData.email}`);
      } else {
        console.log(`- Already exists: [${existingUser.role.toUpperCase()}] ${existingUser.email}`);
      }
    }

    console.log('\n=============================================');
    console.log('✅ ALL ROLE ACCOUNTS SEEDED SUCCESSFULLY!');
    console.log('=============================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAllRoles();
