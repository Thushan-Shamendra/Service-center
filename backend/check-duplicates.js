import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkAndFixDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('appointments');
    
    // Find duplicate appointment numbers
    const duplicates = await collection.aggregate([
      { $group: { _id: '$appointmentNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log('Duplicate appointment numbers found:', duplicates);
    
    if (duplicates.length > 0) {
      console.log('Fixing duplicates...');
      for (const dup of duplicates) {
        const docs = await collection.find({ appointmentNumber: dup._id }).toArray();
        console.log(`Found ${docs.length} duplicates for ${dup._id}`);
        
        // Keep the first one, rename the rest
        for (let i = 1; i < docs.length; i++) {
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          const newNumber = `APT-${timestamp}${random}`;
          await collection.updateOne(
            { _id: docs[i]._id },
            { $set: { appointmentNumber: newNumber } }
          );
          console.log(`Renamed duplicate to ${newNumber}`);
        }
      }
      console.log('✅ Fixed all duplicates');
    } else {
      console.log('✅ No duplicates found');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAndFixDuplicates();