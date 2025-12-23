/**
 * Seed EMR Test Data
 * Run: node seed-emr-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EMRSubscription = require('./models/EMRSubscription');
const EMRVisit = require('./models/EMRVisit');
const ClinicStaff = require('./models/ClinicStaff');
const EMRAuditLog = require('./models/EMRAuditLog');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Clinic = require('./models/Clinic');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthsync';

async function seedEMRData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test clinic
    let clinic = await Clinic.findOne({ name: /test|demo/i });
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'Demo Clinic',
        email: 'demo@clinic.com',
        phone: '9876543210',
        address: '123 Health Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        specializations: ['General Medicine', 'Pediatrics', 'Cardiology'],
        isActive: true,
        approvalStatus: 'approved'
      });
      console.log('✅ Created demo clinic');
    }

    // Find or create test users (patients)
    const testPatients = [];
    for (let i = 1; i <= 5; i++) {
      let patient = await User.findOne({ email: `patient${i}@test.com` });
      if (!patient) {
        patient = await User.create({
          name: `Test Patient ${i}`,
          email: `patient${i}@test.com`,
          phone: `98765432${10 + i}`,
          password: 'test123',
          role: 'patient',
          medicalHistory: {
            bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i - 1],
            allergies: i % 2 === 0 ? ['Penicillin'] : [],
            chronicConditions: i === 3 ? ['Diabetes'] : []
          }
        });
      }
      testPatients.push(patient);
    }
    console.log(`✅ ${testPatients.length} test patients ready`);

    // Find or create test doctor (using Doctor model)
    let doctor = await Doctor.findOne({ email: 'doctor@test.com' });
    if (!doctor) {
      doctor = await Doctor.create({
        name: 'Dr. Test Doctor',
        email: 'doctor@test.com',
        phone: '9876543200',
        password: 'test123',
        specialization: 'General Medicine',
        qualification: 'MBBS, MD',
        experience: 10,
        consultationFee: 500,
        clinicId: clinic._id,
        availability: 'Available',
        isVerified: true
      });
    }
    console.log('✅ Test doctor ready');

    // Create receptionist for the clinic
    let receptionist = await User.findOne({ email: 'receptionist@test.com' });
    if (!receptionist) {
      receptionist = await User.create({
        name: 'Test Receptionist',
        email: 'receptionist@test.com',
        phone: '9876543201',
        password: 'test123',
        role: 'receptionist',
        clinicId: clinic._id,
        clinicName: clinic.name
      });
    }
    console.log('✅ Test receptionist ready');

    // Create EMR Subscription (Advanced plan)
    const existingSub = await EMRSubscription.findOne({ clinicId: clinic._id });
    if (!existingSub) {
      await EMRSubscription.create({
        clinicId: clinic._id,
        plan: 'advanced',
        duration: '1_year',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        payment: {
          amount: 39999,
          currency: 'INR',
          method: 'razorpay',
          transactionId: 'test_txn_' + Date.now(),
          paidAt: new Date()
        },
        autoRenew: true
      });
      console.log('✅ Created Advanced EMR subscription');
    }

    // Create EMR Visits
    const visitTypes = ['walk_in', 'appointment', 'follow_up', 'emergency'];
    const diagnoses = [
      { code: 'J06.9', description: 'Upper respiratory infection' },
      { code: 'K30', description: 'Dyspepsia' },
      { code: 'M54.5', description: 'Low back pain' },
      { code: 'I10', description: 'Essential hypertension' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus' }
    ];

    for (let i = 0; i < 10; i++) {
      const patient = testPatients[i % testPatients.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const visitDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const existingVisit = await EMRVisit.findOne({
        patientId: patient._id,
        clinicId: clinic._id,
        visitDate: { $gte: new Date(visitDate.setHours(0,0,0,0)), $lt: new Date(visitDate.setHours(23,59,59,999)) }
      });

      if (!existingVisit) {
        await EMRVisit.create({
          patientId: patient._id,
          clinicId: clinic._id,
          doctorId: doctor._id,
          visitDate: visitDate,
          visitType: visitTypes[i % visitTypes.length],
          status: i < 8 ? 'completed' : 'in-progress',
          vitals: {
            bloodPressure: { systolic: 110 + Math.floor(Math.random() * 30), diastolic: 70 + Math.floor(Math.random() * 20) },
            pulse: 70 + Math.floor(Math.random() * 20),
            temperature: 98 + Math.random() * 2,
            weight: 60 + Math.floor(Math.random() * 30),
            height: 160 + Math.floor(Math.random() * 20),
            oxygenSaturation: 95 + Math.floor(Math.random() * 5)
          },
          chiefComplaint: ['Fever and cold', 'Stomach pain', 'Back pain', 'Headache', 'Routine checkup'][i % 5],
          diagnosis: [diagnoses[i % diagnoses.length]],
          prescription: {
            medicines: [
              { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' },
              { name: 'Vitamin C', dosage: '1 tablet', frequency: 'Once daily', duration: '10 days' }
            ],
            instructions: 'Take medicines after food. Drink plenty of water.'
          },
          notes: `Patient visited for ${['fever', 'stomach issues', 'back pain', 'headache', 'routine checkup'][i % 5]}. Condition is stable.`,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: doctor._id
        });
      }
    }
    console.log('✅ Created 10 EMR visits');

    // Create Clinic Staff entries (link existing receptionist)
    const existingStaff = await ClinicStaff.findOne({ clinicId: clinic._id, userId: receptionist._id });
    if (!existingStaff) {
      await ClinicStaff.create({
        clinicId: clinic._id,
        userId: receptionist._id,
        role: 'receptionist',
        permissions: ['view_patients', 'create_visits', 'view_reports', 'manage_appointments'],
        status: 'active',
        invitedBy: doctor._id
      });
    }
    console.log('✅ Clinic staff entry created');

    // Create Audit Logs
    const actions = ['create', 'update', 'view', 'export'];
    const entities = ['visit', 'patient', 'prescription', 'report'];
    for (let i = 0; i < 20; i++) {
      const hoursAgo = Math.floor(Math.random() * 72);
      await EMRAuditLog.create({
        clinicId: clinic._id,
        userId: i % 2 === 0 ? doctor._id : testPatients[0]._id,
        action: actions[i % actions.length],
        entity: entities[i % entities.length],
        entityId: new mongoose.Types.ObjectId(),
        details: { description: `${actions[i % actions.length]} ${entities[i % entities.length]} record` },
        ipAddress: '192.168.1.' + (100 + i),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      });
    }
    console.log('✅ Created 20 audit log entries');

    console.log('\n🎉 EMR test data seeded successfully!\n');
    console.log('Test Accounts:');
    console.log('  Receptionist: receptionist@test.com / test123');
    console.log('  Doctor: doctor@test.com / test123');
    console.log('  Patients: patient1@test.com to patient5@test.com / test123');
    console.log('\nClinic: Demo Clinic (Kolkata)');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding EMR data:', error);
    process.exit(1);
  }
}

seedEMRData();
