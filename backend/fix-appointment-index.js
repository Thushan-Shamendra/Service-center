/**
 * Fix MongoDB duplicate key error for appointments
 * This script removes the legacy appointmentId index and fixes any data inconsistencies
 */

import mongoose from 'mongoose';
import Appointment from './models/Appointment.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAppointmentIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    console.log('\nChecking current indexes on appointments collection...');
    const indexes = await mongoose.connection.db.collection('appointments').indexes();
    console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));

    // Drop the legacy appointmentId index if it exists
    const appointmentIdIndex = indexes.find(i => i.name === 'appointmentId_1');
    if (appointmentIdIndex) {
      console.log('\n⚠️  Found legacy appointmentId_1 index - dropping it...');
      await mongoose.connection.db.collection('appointments').dropIndex('appointmentId_1');
      console.log('✅ Dropped appointmentId_1 index');
    } else {
      console.log('\n✅ No legacy appointmentId_1 index found');
    }

    // Check for documents with null appointmentNumber
    console.log('\nChecking for documents with null appointmentNumber...');
    const nullAppointments = await Appointment.find({ appointmentNumber: null });
    console.log(`Found ${nullAppointments.length} documents with null appointmentNumber`);

    if (nullAppointments.length > 0) {
      console.log('Updating documents with null appointmentNumber...');
      for (const appointment of nullAppointments) {
        const count = await Appointment.countDocuments();
        appointment.appointmentNumber = `APT${String(count + 1).padStart(5, '0')}`;
        await appointment.save();
        console.log(`Updated appointment ${appointment._id} with number ${appointment.appointmentNumber}`);
      }
      console.log('✅ Updated all documents with null appointmentNumber');
    }

    // Drop and recreate the appointmentNumber index with sparse option
    const appointmentNumberIndex = indexes.find(i => i.name === 'appointmentNumber_1');
    if (appointmentNumberIndex) {
      console.log('\n⚠️  Found existing appointmentNumber_1 index - dropping to add sparse option...');
      await mongoose.connection.db.collection('appointments').dropIndex('appointmentNumber_1');
      console.log('✅ Dropped appointmentNumber_1 index');
    }

    // Recreate the correct index with sparse option
    console.log('\nCreating appointmentNumber index with sparse option...');
    await mongoose.connection.db.collection('appointments').createIndex(
      { appointmentNumber: 1 },
      { unique: true, sparse: true, name: 'appointmentNumber_1' }
    );
    console.log('✅ Created appointmentNumber_1 index with sparse option');

    console.log('\n✅ All fixes completed successfully!');
    console.log('\nFinal indexes:');
    const finalIndexes = await mongoose.connection.db.collection('appointments').indexes();
    console.log(finalIndexes.map(i => ({ name: i.name, key: i.key })));

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
};

fixAppointmentIndexes();
