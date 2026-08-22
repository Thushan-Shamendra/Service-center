import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/vsms').then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('attendances');
  
  // Drop the problematic index
  try {
    await collection.dropIndex('attendanceId_1');
    console.log('Dropped attendanceId_1 index');
  } catch (err) {
    console.log('Index did not exist or error dropping:', err.message);
  }
  
  // Update existing records to have attendanceId
  const count = await collection.countDocuments({ attendanceId: null });
  console.log('Found', count, 'records with null attendanceId');
  
  const cursor = collection.find({ attendanceId: null });
  let i = 1;
  for await (const doc of cursor) {
    await collection.updateOne(
      { _id: doc._id },
      { $set: { attendanceId: `ATT${String(i).padStart(4, '0')}` } }
    );
    i++;
  }
  console.log('Updated', i-1, 'records with attendanceId');
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});