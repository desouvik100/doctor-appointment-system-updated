// Test MongoDB Atlas Connection
const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://desouvik100:Souvik1234@cluster0.qv72ila.mongodb.net/doctor_appointment?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing MongoDB Connection...');
console.log('URI:', mongoUri);
console.log('');

mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB Connection Failed!');
  console.error('Error:', err.message);
  console.error('');
  console.error('Possible causes:');
  console.error('1. MongoDB Atlas cluster is paused/stopped');
  console.error('2. IP not whitelisted');
  console.error('3. Network connectivity issue');
  console.error('4. Invalid credentials');
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('❌ Connection timeout after 15 seconds');
  process.exit(1);
}, 15000);
