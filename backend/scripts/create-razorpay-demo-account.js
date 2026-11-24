const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');

const createRazorpayDemoAccounts = async () => {
  try {
    console.log('🔧 Creating Razorpay Demo Accounts...\n');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }
    
   await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const password = 'Razorpay@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const patientResult = await User.findOneAndUpdate(
      { email: 'demo@razorpay.com' },
     {
        name: 'Razorpay Demo User',
        email: 'demo@razorpay.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'patient',
        approvalStatus: 'approved',
        isActive: true,
       medicalHistory: {
          bloodGroup: 'O+',
          allergies: ['None'],
          chronicConditions: [],
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '9876543211',
            relationship: 'Family'
          }
        }
      },
     { upsert: true, new: true }
    );
    console.log('✅ Demo Patient Account Created');
    console.log('   📧 Email: demo@razorpay.com');
    console.log('   🔑 Password:', password);
    console.log('   👤 ID:', patientResult._id);
    const adminResult = await User.findOneAndUpdate(
      { email: 'admin-demo@razorpay.com' },
      {
       name: 'Razorpay Admin Demo',
        email: 'admin-demo@razorpay.com',
        password: hashedPassword,
        phone: '9876543212',
        role: 'admin',
        approvalStatus: 'approved',
        isActive: true
     },
      { upsert: true, new: true }
    );
    console.log('\n✅ Demo Admin Account Created');
    console.log('   📧 Email: admin-demo@razorpay.com');
    console.log('   🔑 Password:', password);
    console.log('   👤 ID:', adminResult._id);
    let clinic = await Clinic.findOne({});
    if (!clinic) {
     clinic = await Clinic.create({
        name: 'HealthSync Demo Clinic',
        address: 'Demo Address, Kolkata',
       phone: '9876543213',
        email: 'clinic@healthsync.com'
      });
    }
    const doctorResult = await Doctor.findOneAndUpdate(
      { email: 'doctor-demo@razorpay.com' },
      {
        name: 'Dr. Razorpay Demo',
        email: 'doctor-demo@razorpay.com',
        password: hashedPassword,
       phone: '9876543214',
        specialization: 'General Physician',
        clinicId: clinic._id,
        consultationFee: 500,
        experience: 10,
        qualification: 'MBBS, MD',
        isActive: true,
        isVerified: true,
        approvalStatus: 'approved',
       rating: 4.5,
        reviewCount: 25,
        languages: ['English', 'Hindi', 'Bengali'],
       bio: 'Experienced general physician with 10+ years of practice.'
      },
      { upsert: true, new: true }
    );
    console.log('\n✅ Demo Doctor Account Created');
    console.log('   📧 Email: doctor-demo@razorpay.com');
    console.log('   🔑 Password:', password);
    console.log('   👤 ID:', doctorResult._id);
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 RAZORPAY DEMO CREDENTIALS SUMMARY');
    console.log('='.repeat(50));
    console.log('\n🔹 PATIENT LOGIN:');
    console.log('   Email: demo@razorpay.com');
    console.log('   Password: Razorpay@123');
    console.log('\n🔹 ADMIN LOGIN:');
    console.log('   Email: admin-demo@razorpay.com');
    console.log('   Password: Razorpay@123');
    console.log('\n🔹 DOCTOR LOGIN:');
    console.log('   Email: doctor-demo@razorpay.com');
    console.log('   Password: Razorpay@123');
    console.log('\n' + '='.repeat(50));
    
    await mongoose.disconnect();
    console.log('\n✅ Done! Accounts ready for Razorpay review.');
    
  } catch (e) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createRazorpayDemoAccounts();
