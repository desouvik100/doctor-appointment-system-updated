

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

async function deleteDummyAppointments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    const Appointment = require('../models/Appointment');

    const total = await Appointment.countDocuments();
    console.log(`📊 Total appointments in DB: ${total}`);
    const result = await Appointment.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} appointments`);
    try {
      const Queue = mongoose.models.Queue || mongoose.model('Queue', new mongoose.Schema({}, { strict: false }));
    console.log("checkpoint");
      const qResult = await Queue.deleteMany({});
      console.log(`🗑️  Deleted ${qResult.deletedCount} queue entries`);
    } catch (e) {
    }

    console.log('✅ Done! All dummy appointment data removed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteDummyAppointments();
