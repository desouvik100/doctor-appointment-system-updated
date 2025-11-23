const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Clinic = require('./models/Clinic');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const populateDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Clinic.deleteMany({});
    
    console.log('Cleared existing data');

    // Create sample clinics
    const clinics = await Clinic.insertMany([
      {
        name: 'City General Hospital',
        type: 'hospital',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91-22-1234-5678',
        email: 'info@citygeneral.com'
      },
      {
        name: 'Health Plus Clinic',
        type: 'clinic',
        address: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone: '+91-11-9876-5432',
        email: 'contact@healthplus.com'
      },
      {
        name: 'Care Medical Center',
        type: 'clinic',
        address: '789 Garden Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+91-80-5555-6666',
        email: 'info@caremedical.com'
      }
    ]);

    console.log('Created sample clinics');

    // Create sample doctors
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@citygeneral.com',
        phone: '+91-98765-43210',
        specialization: 'Cardiology',
        clinicId: clinics[0]._id,
        consultationFee: 800,
        experience: 15,
        qualification: 'MBBS, MD (Cardiology)'
      },
      {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@citygeneral.com',
        phone: '+91-98765-43211',
        specialization: 'Dermatology',
        clinicId: clinics[0]._id,
        consultationFee: 600,
        experience: 10,
        qualification: 'MBBS, MD (Dermatology)'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@healthplus.com',
        phone: '+91-98765-43212',
        specialization: 'General Medicine',
        clinicId: clinics[1]._id,
        consultationFee: 500,
        experience: 8,
        qualification: 'MBBS, MD (Internal Medicine)'
      },
      {
        name: 'Dr. Sunita Reddy',
        email: 'sunita.reddy@healthplus.com',
        phone: '+91-98765-43213',
        specialization: 'Pediatrics',
        clinicId: clinics[1]._id,
        consultationFee: 550,
        experience: 12,
        qualification: 'MBBS, MD (Pediatrics)'
      },
      {
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@caremedical.com',
        phone: '+91-98765-43214',
        specialization: 'Orthopedics',
        clinicId: clinics[2]._id,
        consultationFee: 700,
        experience: 18,
        qualification: 'MBBS, MS (Orthopedics)'
      }
    ]);

    console.log('Created sample doctors');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const receptionistPassword = await bcrypt.hash('reception123', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@hospital.com',
        password: adminPassword,
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        password: hashedPassword,
        phone: '+91-98765-11111',
        role: 'patient'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        password: hashedPassword,
        phone: '+91-98765-22222',
        role: 'patient'
      },
      {
        name: 'Receptionist One',
        email: 'reception1@citygeneral.com',
        password: receptionistPassword,
        phone: '+91-98765-33333',
        role: 'receptionist',
        clinicId: clinics[0]._id,
        approvalStatus: 'approved'
      },
      {
        name: 'Receptionist Two',
        email: 'reception2@healthplus.com',
        password: receptionistPassword,
        phone: '+91-98765-44444',
        role: 'receptionist',
        clinicId: clinics[1]._id,
        approvalStatus: 'approved'
      }
    ]);

    console.log('Created sample users');

    console.log('\n=== SAMPLE LOGIN CREDENTIALS ===');
    console.log('Admin Login:');
    console.log('Email: admin@hospital.com');
    console.log('Password: admin123');
    console.log('\nPatient Login:');
    console.log('Email: john.doe@email.com');
    console.log('Password: password123');
    console.log('\nReceptionist Login:');
    console.log('Email: reception1@citygeneral.com');
    console.log('Password: reception123');
    console.log('\n=== DATABASE POPULATED SUCCESSFULLY ===');

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    mongoose.connection.close();
  }
};

const main = async () => {
  await connectDB();
  await populateDatabase();
};

main();