import mongoose from 'mongoose';
import Counter from './models/Counter.js';
import dotenv from 'dotenv';

dotenv.config();

// Test atomic counter with concurrent operations
async function testAtomicCounter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Reset counter for testing
    await Counter.findByIdAndUpdate('test_counter', { seq: 0 }, { upsert: true });
    console.log('Counter reset to 0');

    // Simulate concurrent requests
    const concurrentRequests = 10;
    const promises = [];

    console.log(`Testing ${concurrentRequests} concurrent increment operations...`);

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        Counter.increment('test_counter')
          .then(seq => ({ request: i, seq }))
          .catch(err => ({ request: i, error: err.message }))
      );
    }

    const results = await Promise.all(promises);
    
    console.log('\nResults:');
    const sequences = [];
    results.forEach(result => {
      if (result.error) {
        console.log(`Request ${result.request}: ERROR - ${result.error}`);
      } else {
        console.log(`Request ${result.request}: Sequence ${result.seq}`);
        sequences.push(result.seq);
      }
    });

    // Check for duplicates
    const uniqueSequences = new Set(sequences);
    const hasDuplicates = sequences.length !== uniqueSequences.size;

    console.log('\nAnalysis:');
    console.log(`Total sequences generated: ${sequences.length}`);
    console.log(`Unique sequences: ${uniqueSequences.size}`);
    console.log(`Has duplicates: ${hasDuplicates ? 'YES ❌' : 'NO ✅'}`);

    if (hasDuplicates) {
      console.log('\n❌ TEST FAILED: Duplicate sequences detected!');
      const duplicates = sequences.filter((item, index) => sequences.indexOf(item) !== index);
      console.log('Duplicate values:', [...new Set(duplicates)]);
    } else {
      console.log('\n✅ TEST PASSED: All sequences are unique!');
    }

    // Cleanup
    await Counter.deleteOne({ _id: 'test_counter' });
    console.log('\nTest counter cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAtomicCounter();