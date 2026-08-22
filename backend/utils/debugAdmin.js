import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const debugAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for debugging...');

    // Find admin user
    const admin = await User.findOne({ role: 'administrator' }).select('+password');
    if (!admin) {
      console.log('No administrator found.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Administrator found:');
    console.log('-----------------------------------');
    console.log(`  ID:       ${admin._id}`);
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role:     ${admin.role}`);
    console.log(`  Active:   ${admin.isActive}`);
    console.log(`  Password Hash: ${admin.password}`);
    console.log('-----------------------------------');

    // Test password comparison
    const testPassword = 'Admin@123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    console.log(`Password comparison for "${testPassword}": ${isMatch}`);

    // Test with username
    const userByUsername = await User.findOne({ username: 'admin' }).select('+password');
    console.log(`User found by username: ${userByUsername ? 'Yes' : 'No'}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Debug Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

debugAdmin();
