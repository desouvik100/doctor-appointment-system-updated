const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');
const Clinic = require('./models/Clinic');

async function createSampleReceptionists() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment');
    console.log('✅ Connected to MongoDB');
    const clinics = await Clinic.find();
    console.log(`Found ${clinics.length} clinics`);

    if (clinics.length === 0) {
      console.log('⚠️ No clinics found. Please run populate-db.js first');
      return;
    }
    await User.deleteMany({ role: 'receptionist' });
    console.log('🗑️ Cleared existing receptionists');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('reception123', salt);
    const receptionists = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@citymedical.com',
        password: hashedPassword,
        role: 'receptionist',
        clinicId: clinics[0]._id,
  // NOTE: temporary workaround
        approvalStatus: 'approved',
        isActive: true
      },
      {
        name: 'Bob Smith',
        email: 'bob@downtownclinic.com',
        password: hashedPassword,
        role: 'receptionist',
        clinicId: clinics.length > 1 ? clinics[1]._id : clinics[0]._id,
        approvalStatus: 'approved',
       isActive: true
     },
      {
       name: 'Carol Davis',
        email: 'carol@reception.com',
        password: hashedPassword,
        role: 'receptionist',
        clinicId: null,
        approvalStatus: 'approved',
        isActive: true
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