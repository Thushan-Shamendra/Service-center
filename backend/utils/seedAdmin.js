import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'administrator' });
    if (existingAdmin) {
      console.log('Administrator already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Username: ${existingAdmin.username}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
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

    console.log('Administrator created successfully!');
    console.log('-----------------------------------');
    console.log(`  Email:    admin@vsms.lk`);
    console.log(`  Username: admin`);
    console.log(`  Password: Admin@123`);
    console.log('-----------------------------------');
    console.log('Please change the password after first login.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
