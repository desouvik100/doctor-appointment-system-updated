// Test MongoDB Atlas Connection
// Run: node test-connection.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Connection Error:');
  console.error('Error message:', error.message);
  
  if (error.message.includes('authentication')) {
    console.error('\n💡 Tip: Check your username and password');
  } else if (error.message.includes('IP')) {
    console.error('\n💡 Tip: Check MongoDB Atlas Network Access settings');
  } else if (error.message.includes('timeout')) {
    console.error('\n💡 Tip: Check network access and connection string');
  }
  
  process.exit(1);
});

