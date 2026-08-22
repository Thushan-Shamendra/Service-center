import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for login test...');

    // Test the exact login logic from authController
    const email = 'admin@vsms.lk';
    const password = 'Admin@123';

    console.log(`Testing login with email: ${email}, password: ${password}`);

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }],
    }).select('+password');

    if (!user) {
      console.log('User not found!');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.isActive}`);

    if (!user.isActive) {
      console.log('User is not active!');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Testing password comparison...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match result: ${isMatch}`);

    if (!isMatch) {
      console.log('Password does not match!');
      
      // Try to hash the password and compare
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log(`New hash: ${hashedPassword}`);
      console.log(`Stored hash: ${user.password}`);
      
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Login test successful!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Login Test Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

testLogin();
