import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for password reset...');

    // Find admin user
    const admin = await User.findOne({ role: 'administrator' });
    if (!admin) {
      console.log('No administrator found. Please run seed script first.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Reset password to known value
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(12);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    console.log('Administrator password reset successfully!');
    console.log('-----------------------------------');
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Password: ${newPassword}`);
    console.log('-----------------------------------');
    console.log('Please use these credentials to login.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Password Reset Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

resetAdminPassword();
