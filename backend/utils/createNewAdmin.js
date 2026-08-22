import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createNewAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for creating new admin...');

    // Delete existing admin
    const existingAdmin = await User.findOne({ role: 'administrator' });
    if (existingAdmin) {
      console.log('Deleting existing administrator...');
      await User.deleteOne({ role: 'administrator' });
    }

    // Create new admin user with fresh password
    const admin = await User.create({
      username: 'admin',
      email: 'admin@vsms.lk',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'administrator',
      mobile: '+94771234567',
      isActive: true,
    });

    console.log('New Administrator created successfully!');
    console.log('-----------------------------------');
    console.log(`  Email:    admin@vsms.lk`);
    console.log(`  Username: admin`);
    console.log(`  Password: Admin@123`);
    console.log('-----------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Create Admin Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createNewAdmin();
