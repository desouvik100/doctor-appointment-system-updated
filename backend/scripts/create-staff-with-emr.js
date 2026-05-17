/**
 * Creates a demo hospital, staff account, and active EMR subscription
 * Staff: desouvik0001@gmail.com / HealthSync@2026
 * Run: node backend/scripts/create-staff-with-emr.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const bcrypt = require('bcryptjs');
  const Clinic = require('../models/Clinic');
  const User = require('../models/User');
  const EMRSubscription = require('../models/EMRSubscription');
  const ClinicStaff = require('../models/ClinicStaff');

  // ─── 1. Create or find the demo hospital ───────────────────────────────────
  let clinic = await Clinic.findOne({ name: 'Sunrise Multispeciality Hospital' });
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'Sunrise Multispeciality Hospital',
      type: 'hospital',
      address: '12, Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      pincode: '700016',
      phone: '+91-33-22001234',
      email: 'info@sunrisehospital.in',
      description: 'A leading multispeciality hospital in Kolkata offering world-class healthcare.',
      facilities: ['Parking', 'Pharmacy', 'ICU', 'Emergency', 'Lab', 'Radiology'],
      specializations: ['Cardiology', 'Neurology', 'Orthopedics', 'Gynecology', 'Pediatrics'],
      isActive: true,
      isVerified: true,
      approvalStatus: 'approved',
      operatingHours: {
        monday:    { open: '08:00', close: '20:00', isClosed: false },
        tuesday:   { open: '08:00', close: '20:00', isClosed: false },
        wednesday: { open: '08:00', close: '20:00', isClosed: false },
        thursday:  { open: '08:00', close: '20:00', isClosed: false },
        friday:    { open: '08:00', close: '20:00', isClosed: false },
        saturday:  { open: '09:00', close: '17:00', isClosed: false },
        sunday:    { open: '10:00', close: '14:00', isClosed: false },
      },
    });
    console.log('🏥 Hospital created:', clinic.name, '| ID:', clinic._id);
  } else {
    console.log('🏥 Hospital already exists:', clinic.name, '| ID:', clinic._id);
  }

  // ─── 2. Create or update the staff user ────────────────────────────────────
  const EMAIL = 'desouvik0001@gmail.com';
  const PASSWORD = 'HealthSync@2026';
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  let staffUser = await User.findOne({ email: EMAIL });
  if (!staffUser) {
    staffUser = await User.create({
      name: 'Souvik Das',
      email: EMAIL,
      password: hashedPassword,
      phone: '+91-9876543210',
      role: 'receptionist',
      clinicId: clinic._id,
      clinicName: clinic.name,
      approvalStatus: 'approved',
      isActive: true,
      department: 'Front Desk',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });
    console.log('👤 Staff user created:', staffUser.email, '| ID:', staffUser._id);
  } else {
    // Update existing user to link to clinic and approve
    staffUser.clinicId = clinic._id;
    staffUser.clinicName = clinic.name;
    staffUser.role = 'receptionist';
    staffUser.approvalStatus = 'approved';
    staffUser.isActive = true;
    staffUser.password = hashedPassword;
    await staffUser.save();
    console.log('👤 Staff user updated:', staffUser.email, '| ID:', staffUser._id);
  }

  // ─── 3. Create active EMR subscription (advanced, 1 year) ──────────────────
  let emrSub = await EMRSubscription.findOne({ clinicId: clinic._id, status: 'active' });
  if (!emrSub) {
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now

    emrSub = await EMRSubscription.create({
      clinicId: clinic._id,
      plan: 'advanced',
      duration: '1_year',
      startDate,
      expiryDate,
      status: 'active',
      autoRenew: false,
      limits: { maxDoctors: 20, maxStaff: 50 },
      paymentDetails: {
        amount: 0,
        currency: 'INR',
        paidAt: new Date(),
        invoiceNumber: 'DEMO-EMR-001',
      },
      createdBy: staffUser._id,
      notes: 'Demo subscription created for testing',
    });
    console.log('📋 EMR subscription created | Plan: advanced | Expires:', expiryDate.toDateString());
  } else {
    console.log('📋 EMR subscription already active | Plan:', emrSub.plan, '| Expires:', emrSub.expiryDate.toDateString());
  }

  // ─── 4. Create ClinicStaff record (links user to clinic for EMR access) ────
  let clinicStaff = await ClinicStaff.findOne({ clinicId: clinic._id, email: EMAIL });
  if (!clinicStaff) {
    clinicStaff = await ClinicStaff.create({
      clinicId: clinic._id,
      userId: staffUser._id,
      name: staffUser.name,
      email: EMAIL,
      phone: staffUser.phone,
      role: 'receptionist',
      department: 'Front Desk',
      isActive: true,
      invitationStatus: 'accepted',
      joinedAt: new Date(),
    });
    console.log('🔗 ClinicStaff record created | Role: receptionist');
  } else {
    clinicStaff.userId = staffUser._id;
    clinicStaff.isActive = true;
    clinicStaff.invitationStatus = 'accepted';
    clinicStaff.joinedAt = clinicStaff.joinedAt || new Date();
    await clinicStaff.save();
    console.log('🔗 ClinicStaff record updated');
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SETUP COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Hospital  :', clinic.name);
  console.log('City      :', clinic.city);
  console.log('Clinic ID :', clinic._id.toString());
  console.log('─────────────────────────────────────────');
  console.log('Email     :', EMAIL);
  console.log('Password  :', PASSWORD);
  console.log('Role      : receptionist');
  console.log('EMR Plan  : advanced (1 year)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
