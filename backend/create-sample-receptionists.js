const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Clinic = require('./models/Clinic');

async function createSampleReceptionists() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing clinics
    const clinics = await Clinic.find();
    console.log(`Found ${clinics.length} clinics`);

    if (clinics.length === 0) {
      console.log('⚠️ No clinics found. Please run populate-db.js first');
      return;
    }

    // Clear existing receptionists
    await User.deleteMany({ role: 'receptionist' });
    console.log('🗑️ Cleared existing receptionists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('reception123', salt);

    // Create sample receptionists
    const receptionists = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@citymedical.com',
        passwordHash: hashedPassword,
        role: 'receptionist',
        clinicId: clinics[0]._id // Assign to first clinic
      },
      {
        name: 'Bob Smith',
        email: 'bob@downtownclinic.com',
        passwordHash: hashedPassword,
        role: 'receptionist',
        clinicId: clinics[1]._id // Assign to second clinic
      },
      {
        name: 'Carol Davis',
        email: 'carol@reception.com',
        passwordHash: hashedPassword,
        role: 'receptionist',
        clinicId: null // No clinic assigned
      }
    ]);

    console.log(`✅ Created ${receptionists.length} sample receptionists`);
    console.log('📧 Login credentials:');
    console.log('   alice@citymedical.com / reception123');
    console.log('   bob@downtownclinic.com / reception123');
    console.log('   carol@reception.com / reception123');

  } catch (error) {
    console.error('❌ Error creating receptionists:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createSampleReceptionists();