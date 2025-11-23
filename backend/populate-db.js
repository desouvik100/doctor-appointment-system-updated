const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Clinic = require('./models/Clinic');
const Doctor = require('./models/Doctor');

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Clinic.deleteMany({});
    await Doctor.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create sample clinics
    const clinics = await Clinic.create([
      {
        name: 'City Medical Center',
        type: 'hospital',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        phone: '+1-555-0123',
        email: 'info@citymedical.com'
      },
      {
        name: 'Downtown Clinic',
        type: 'clinic',
        address: '456 Oak Avenue',
        city: 'New York',
        state: 'NY',
        pincode: '10002',
        phone: '+1-555-0456',
        email: 'contact@downtownclinic.com'
      }
    ]);

    console.log(`✅ Created ${clinics.length} clinics`);

    // Create sample doctors
    const doctors = await Doctor.create([
      {
        name: 'Dr. John Smith',
        specialization: 'Cardiologist',
        clinicId: clinics[0]._id,
        qualification: 'MD, FACC',
        experienceYears: 15,
        consultationFee: 200,
        slotDurationMinutes: 30
      },
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'Pediatrician',
        clinicId: clinics[0]._id,
        qualification: 'MD, FAAP',
        experienceYears: 10,
        consultationFee: 150,
        slotDurationMinutes: 20
      },
      {
        name: 'Dr. Michael Brown',
        specialization: 'General Physician',
        clinicId: clinics[1]._id,
        qualification: 'MBBS, MD',
        experienceYears: 8,
        consultationFee: 100,
        slotDurationMinutes: 15
      }
    ]);

    console.log(`✅ Created ${doctors.length} doctors`);
    console.log('🎉 Database populated successfully!');

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

populateDatabase();