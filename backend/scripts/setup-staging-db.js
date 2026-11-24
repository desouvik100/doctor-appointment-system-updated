const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config();
const STAGING_DB_URI = process.env.MONGODB_URI;

async function setupStagingDatabase() {
  try {
    console.log('🔧 Setting up staging database for performance testing...');
    console.log(`📍 Database: ${STAGING_DB_URI}`);

    await mongoose.connect(STAGING_DB_URI);
    console.log('✅ Connected to staging database');
    
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const Clinic = require('../models/Clinic');

    console.log('🗑️  Clearing existing staging data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Clinic.deleteMany({});
    console.log('✅ Staging data cleared');

    console.log('🏥 Creating basic test infrastructure...');

    const testClinic = new Clinic({
      name: 'HealthSync Performance Test Clinic',
      address: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      phone: '9999999999',
      email: 'clinic@healthsync.test',
      isActive: true,
      approvalStatus: 'approved'
    });
    await testClinic.save();
    console.log('✅ Test clinic created');

    const salt = await bcrypt.genSalt(10);
    const doctorHash = await bcrypt.hash('TestDoctor@123', salt);
    
    const testDoctor = new User({
      name: 'Dr. Performance Test',
      email: 'testdoctor@healthsync.test',
      password: doctorHash,
      phone: '8888888888',
      role: 'staff',
      department: 'General Medicine',
      isActive: true,
      approvalStatus: 'approved'
    });
    await testDoctor.save();
    console.log('✅ Test doctor created');

    const doctorProfile = new Doctor({
      userId: testDoctor._id,
      name: 'Dr. Performance Test',
      email: 'testdoctor@healthsync.test',
      phone: '8888888888',
      specialization: 'General Medicine',
      clinicId: testClinic._id,
      consultationFee: 500,
      experience: 5,
      qualification: 'MBBS',
      availability: 'Available',
      weeklySchedule: {
        monday: {
          isAvailable: true,
          slots: [{
            startTime: '09:00',
            endTime: '13:00',
            type: 'both',
            maxPatients: 10
          }]
        },
        tuesday: {
          isAvailable: true,
          slots: [{
            startTime: '09:00',
            endTime: '13:00',
            type: 'both',
            maxPatients: 10
          }]
        },
        wednesday: {
          isAvailable: true,
          slots: [{
            startTime: '09:00',
            endTime: '13:00',
            type: 'both',
            maxPatients: 10
          }]
        },
        thursday: {
          isAvailable: true,
          slots: [{
            startTime: '09:00',
            endTime: '13:00',
            type: 'both',
            maxPatients: 10
          }]
        },
        friday: {
          isAvailable: true,
          slots: [{
            startTime: '09:00',
            endTime: '13:00',
            type: 'both',
            maxPatients: 10
          }]
        }
      },
      isActive: true,
      approvalStatus: 'approved'
    });
    await doctorProfile.save();
    console.log('✅ Doctor profile created');

    const adminHash = await bcrypt.hash('AdminTest@123', salt);
    const adminUser = new User({
      name: 'Performance Test Admin',
      email: 'admin@healthsync.test',
      password: adminHash,
      phone: '7777777777',
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved'
    });
    await adminUser.save();
    console.log('✅ Admin user created');
    
    console.log('');
    console.log('🎉 Staging database setup completed!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('  Admin:  admin@healthsync.test / AdminTest@123');
    console.log('  Doctor: testdoctor@healthsync.test / TestDoctor@123');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Run: npm run seed:performance-users');
    console.log('2. Start backend: .\\start-staging.ps1');
    console.log('3. Run performance tests from /performance directory');
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Staging database setup failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  setupStagingDatabase();
}

module.exports = { setupStagingDatabase };