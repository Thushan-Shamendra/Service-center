/**
 * Fix MongoDB duplicate key error for job cards
 * This script removes the legacy jobCardId index and fixes any data inconsistencies
 */

import mongoose from 'mongoose';
import JobCard from './models/JobCard.js';
import dotenv from 'dotenv';

dotenv.config();

const fixJobCardIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    console.log('\nChecking current indexes on jobcards collection...');
    const indexes = await mongoose.connection.db.collection('jobcards').indexes();
    console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));

    // Drop the legacy jobCardId index if it exists
    const jobCardIdIndex = indexes.find(i => i.name === 'jobCardId_1');
    if (jobCardIdIndex) {
      console.log('\n⚠️  Found legacy jobCardId_1 index - dropping it...');
      await mongoose.connection.db.collection('jobcards').dropIndex('jobCardId_1');
      console.log('✅ Dropped jobCardId_1 index');
    } else {
      console.log('\n✅ No legacy jobCardId_1 index found');
    }

    // Check for documents with null jobCardNumber
    console.log('\nChecking for documents with null jobCardNumber...');
    const nullJobCards = await JobCard.find({ jobCardNumber: null });
    console.log(`Found ${nullJobCards.length} documents with null jobCardNumber`);

    if (nullJobCards.length > 0) {
      console.log('Updating documents with null jobCardNumber...');
      for (const jobCard of nullJobCards) {
        const count = await JobCard.countDocuments();
        jobCard.jobCardNumber = `JOB-${String(count + 1).padStart(5, '0')}`;
        await jobCard.save();
        console.log(`Updated job card ${jobCard._id} with number ${jobCard.jobCardNumber}`);
      }
      console.log('✅ Updated all documents with null jobCardNumber');
    } else {
      console.log('✅ All job cards have a valid jobCardNumber');
    }

    // Drop and recreate the jobCardNumber index with sparse option to prevent future duplicate null issues
    const jobCardNumberIndex = indexes.find(i => i.name === 'jobCardNumber_1');
    if (jobCardNumberIndex) {
      console.log('\n⚠️  Found existing jobCardNumber_1 index - dropping to add sparse option...');
      await mongoose.connection.db.collection('jobcards').dropIndex('jobCardNumber_1');
      console.log('✅ Dropped jobCardNumber_1 index');
    } else {
      console.log('\n⚠️  No jobCardNumber_1 index found - creating it with sparse option...');
    }

    // Recreate the correct index with sparse option
    console.log('\nCreating jobCardNumber index with sparse option...');
    await mongoose.connection.db.collection('jobcards').createIndex(
      { jobCardNumber: 1 },
      { unique: true, sparse: true, name: 'jobCardNumber_1' }
    );
    console.log('✅ Created jobCardNumber_1 index with sparse option');

    console.log('\n✅ All fixes completed successfully!');
    console.log('\nFinal indexes:');
    const finalIndexes = await mongoose.connection.db.collection('jobcards').indexes();
    console.log(finalIndexes.map(i => ({ name: i.name, key: i.key })));

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
};

fixJobCardIndexes();