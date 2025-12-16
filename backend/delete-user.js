// Quick script to delete a user by email
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL_TO_DELETE = 'desouvik0003@gmail.com';

async function deleteUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and delete from users collection
    const result = await mongoose.connection.db.collection('users').deleteOne({ 
      email: EMAIL_TO_DELETE.toLowerCase() 
    });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Deleted user: ${EMAIL_TO_DELETE}`);
    } else {
      console.log(`⚠️ No user found with email: ${EMAIL_TO_DELETE}`);
      
      // Try to find in other collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\n📋 Available collections:');
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments({ 
          email: EMAIL_TO_DELETE.toLowerCase() 
        });
        if (count > 0) {
          console.log(`   Found in: ${col.name} (${count} documents)`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteUser();
