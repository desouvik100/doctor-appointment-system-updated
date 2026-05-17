/**
 * Seed script: Creates a test doctor account with full dashboard data
 * Email: desouvik2018@gmail.com | Password: souvik@1234A
 *
 * Run: node backend/seed-doctor-test.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

const Doctor = require('./models/Doctor');
const Clinic = require('./models/Clinic');
const User = require('./models/User');
const Appointment = require('./models/Appointment');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── 1. Clinic ──────────────────────────────────────────────────────────────
  let clinic = await Clinic.findOne({ email: 'healthsync.clinic@gmail.com' });
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'HealthSync Medical Centre',
      type: 'clinic',
      address: '12 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
      phone: '9800000001',
      email: 'healthsync.clinic@gmail.com',
      isActive: true,
      isVerified: true,
      approvalStatus: 'approved',
      location: { type: 'Point', coordinates: [88.3639, 22.5726] },
      operatingHours: {
        monday:    { open: '09:00', close: '20:00', isClosed: false },
        tuesday:   { open: '09:00', close: '20:00', isClosed: false },
        wednesday: { open: '09:00', close: '20:00', isClosed: false },
        thursday:  { open: '09:00', close: '20:00', isClosed: false },
        friday:    { open: '09:00', close: '20:00', isClosed: false },
        saturday:  { open: '09:00', close: '17:00', isClosed: false },
        sunday:    { open: '10:00', close: '14:00', isClosed: true  }
      },
      facilities: ['Parking', 'Pharmacy', 'Lab', 'Wheelchair Access'],
      specializations: ['Cardiology', 'General Medicine', 'Pediatrics']
    });
    console.log('✅ Clinic created:', clinic.name);
  } else {
    console.log('ℹ️  Clinic already exists:', clinic.name);
  }

  // ── 2. Doctor ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('souvik@1234A', 10);

  let doctor = await Doctor.findOne({ email: 'desouvik2018@gmail.com' });
  if (doctor) {
    // Update password in case it changed
    doctor.password = hashedPassword;
    await doctor.save();
    console.log('ℹ️  Doctor already exists, password updated');
  } else {
    doctor = await Doctor.create({
      name: 'Dr. Souvik De',
      email: 'desouvik2018@gmail.com',
      password: hashedPassword,
      phone: '9800000002',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
      experience: 8,
      consultationFee: 600,
      consultationDuration: 20,
      clinicId: clinic._id,
      isActive: true,
      isVerified: true,
      approvalStatus: 'approved',
      rating: 4.7,
      reviewCount: 124,
      bio: 'Senior Cardiologist with 8 years of experience in interventional cardiology and heart failure management.',
      languages: ['English', 'Bengali', 'Hindi'],
      registrationNumber: 'WB-MED-2016-04821',
      availability: 'Available',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      consultationSettings: {
        virtualConsultationEnabled: true,
        inClinicConsultationEnabled: true,
        virtualSlotDuration: 20,
        inClinicSlotDuration: 30,
        maxVirtualSlots: 15,
        maxInClinicSlots: 20,
        advanceBookingDays: 30,
        cancellationHours: 24
      },
      weeklySchedule: {
        monday:    { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 }, { startTime: '17:00', endTime: '20:00', type: 'both', maxPatients: 8 }] },
        tuesday:   { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 }] },
        wednesday: { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 }, { startTime: '17:00', endTime: '20:00', type: 'both', maxPatients: 8 }] },
        thursday:  { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 }] },
        friday:    { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 }, { startTime: '17:00', endTime: '20:00', type: 'both', maxPatients: 8 }] },
        saturday:  { isAvailable: true,  slots: [{ startTime: '09:00', endTime: '14:00', type: 'in-clinic', maxPatients: 12 }] },
        sunday:    { isAvailable: false, slots: [] }
      }
    });
    console.log('✅ Doctor created:', doctor.name);
  }

  // ── 3. Sample Patients ─────────────────────────────────────────────────────
  const patientData = [
    { name: 'Rahul Sharma',   email: 'rahul.sharma.test@healthsync.in',   phone: '9800001001', age: 45, gender: 'male',   bloodGroup: 'B+' },
    { name: 'Priya Banerjee', email: 'priya.banerjee.test@healthsync.in', phone: '9800001002', age: 32, gender: 'female', bloodGroup: 'A+' },
    { name: 'Amit Das',       email: 'amit.das.test@healthsync.in',       phone: '9800001003', age: 58, gender: 'male',   bloodGroup: 'O+' },
    { name: 'Sunita Roy',     email: 'sunita.roy.test@healthsync.in',     phone: '9800001004', age: 27, gender: 'female', bloodGroup: 'AB+' },
    { name: 'Mohan Ghosh',    email: 'mohan.ghosh.test@healthsync.in',    phone: '9800001005', age: 63, gender: 'male',   bloodGroup: 'O-' }
  ];

  const patientPwd = await bcrypt.hash('Patient@123', 10);
  const patients = [];
  for (const p of patientData) {
    let user = await User.findOne({ email: p.email });
    if (!user) {
      user = await User.create({ ...p, password: patientPwd, role: 'patient', isActive: true });
    }
    patients.push(user);
  }
  console.log(`✅ ${patients.length} patients ready`);

  // ── 4. Appointments ────────────────────────────────────────────────────────
  // Clear old test appointments for this doctor to avoid duplicates
  await Appointment.deleteMany({ doctorId: doctor._id });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const apptDefs = [
    // Today - various statuses (for live queue view)
    { daysOffset: 0, time: '09:00', patient: 0, status: 'completed',   type: 'in_person', reason: 'Chest pain follow-up',        payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '09:30', patient: 1, status: 'completed',   type: 'in_person', reason: 'Hypertension check',           payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '10:00', patient: 2, status: 'in_progress', type: 'in_person', reason: 'ECG review',                   payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '10:30', patient: 3, status: 'confirmed',   type: 'in_person', reason: 'Palpitations',                 payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '11:00', patient: 4, status: 'confirmed',   type: 'in_person', reason: 'Routine cardiac check',        payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '11:30', patient: 0, status: 'confirmed',   type: 'online',    reason: 'Post-surgery follow-up',       payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '17:00', patient: 1, status: 'confirmed',   type: 'in_person', reason: 'Blood pressure monitoring',    payStatus: 'completed', amount: 600 },
    { daysOffset: 0, time: '17:30', patient: 2, status: 'pending',     type: 'in_person', reason: 'Shortness of breath',          payStatus: 'pending',   amount: 600 },

    // Tomorrow
    { daysOffset: 1, time: '09:00', patient: 3, status: 'confirmed', type: 'in_person', reason: 'Stress test review',           payStatus: 'completed', amount: 600 },
    { daysOffset: 1, time: '09:30', patient: 4, status: 'confirmed', type: 'online',    reason: 'Medication adjustment',        payStatus: 'completed', amount: 600 },
    { daysOffset: 1, time: '10:00', patient: 0, status: 'confirmed', type: 'in_person', reason: 'Angiography follow-up',        payStatus: 'completed', amount: 600 },

    // Day after tomorrow
    { daysOffset: 2, time: '09:00', patient: 1, status: 'confirmed', type: 'in_person', reason: 'Cholesterol review',           payStatus: 'completed', amount: 600 },
    { daysOffset: 2, time: '10:00', patient: 2, status: 'confirmed', type: 'online',    reason: 'Diabetes + cardiac risk',      payStatus: 'completed', amount: 600 },

    // Past appointments (last 7 days - for earnings/history)
    { daysOffset: -1, time: '09:00', patient: 0, status: 'completed', type: 'in_person', reason: 'Chest tightness',             payStatus: 'completed', amount: 600 },
    { daysOffset: -1, time: '09:30', patient: 1, status: 'completed', type: 'in_person', reason: 'Hypertension follow-up',      payStatus: 'completed', amount: 600 },
    { daysOffset: -1, time: '10:00', patient: 2, status: 'completed', type: 'online',    reason: 'Post-discharge review',       payStatus: 'completed', amount: 600 },
    { daysOffset: -1, time: '10:30', patient: 3, status: 'cancelled', type: 'in_person', reason: 'Routine check',               payStatus: 'failed',    amount: 600 },
    { daysOffset: -2, time: '09:00', patient: 4, status: 'completed', type: 'in_person', reason: 'Arrhythmia evaluation',       payStatus: 'completed', amount: 600 },
    { daysOffset: -2, time: '09:30', patient: 0, status: 'completed', type: 'in_person', reason: 'Stent follow-up',             payStatus: 'completed', amount: 600 },
    { daysOffset: -2, time: '10:00', patient: 1, status: 'completed', type: 'online',    reason: 'Medication review',           payStatus: 'completed', amount: 600 },
    { daysOffset: -3, time: '09:00', patient: 2, status: 'completed', type: 'in_person', reason: 'Heart failure management',    payStatus: 'completed', amount: 600 },
    { daysOffset: -3, time: '09:30', patient: 3, status: 'completed', type: 'in_person', reason: 'Pacemaker check',             payStatus: 'completed', amount: 600 },
    { daysOffset: -4, time: '09:00', patient: 4, status: 'completed', type: 'in_person', reason: 'Lipid profile review',        payStatus: 'completed', amount: 600 },
    { daysOffset: -5, time: '09:00', patient: 0, status: 'completed', type: 'in_person', reason: 'Cardiac rehab follow-up',     payStatus: 'completed', amount: 600 },
    { daysOffset: -5, time: '09:30', patient: 1, status: 'completed', type: 'online',    reason: 'BP management',               payStatus: 'completed', amount: 600 },
    { daysOffset: -6, time: '09:00', patient: 2, status: 'completed', type: 'in_person', reason: 'Echocardiogram review',       payStatus: 'completed', amount: 600 },
    { daysOffset: -7, time: '09:00', patient: 3, status: 'completed', type: 'in_person', reason: 'Annual cardiac check',        payStatus: 'completed', amount: 600 },
    { daysOffset: -7, time: '09:30', patient: 4, status: 'completed', type: 'in_person', reason: 'Chest X-ray review',          payStatus: 'completed', amount: 600 },
  ];

  const appointments = [];
  for (let i = 0; i < apptDefs.length; i++) {
    const def = apptDefs[i];
    const apptDate = new Date(today);
    apptDate.setDate(apptDate.getDate() + def.daysOffset);

    const appt = await Appointment.create({
      userId: patients[def.patient]._id,
      doctorId: doctor._id,
      clinicId: clinic._id,
      date: apptDate,
      time: def.time,
      reason: def.reason,
      status: def.status,
      consultationType: def.type,
      tokenNumber: i + 1,
      queueNumber: i + 1,
      queueStatus: def.status === 'completed' ? 'completed' : def.status === 'in_progress' ? 'in_queue' : 'waiting',
      bookingSource: 'online',
      paymentStatus: def.payStatus,
      payment: {
        consultationFee: def.amount,
        gst: Math.round(def.amount * 0.18),
        platformFee: 20,
        totalAmount: def.amount + Math.round(def.amount * 0.18) + 20,
        paymentStatus: def.payStatus,
        paymentMethod: 'upi',
        paidAt: def.payStatus === 'completed' ? apptDate : null
      },
      paymentDetails: def.payStatus === 'completed' ? {
        amount: def.amount,
        currency: 'INR',
        method: 'upi',
        status: 'captured',
        paidAt: apptDate
      } : null
    });
    appointments.push(appt);
  }
  console.log(`✅ ${appointments.length} appointments created`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST DOCTOR ACCOUNT READY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email    : desouvik2018@gmail.com');
  console.log('  Password : souvik@1234A');
  console.log('  Role     : Doctor (Cardiologist)');
  console.log('  Clinic   : HealthSync Medical Centre, Kolkata');
  console.log('  Today    : 8 appointments (2 done, 1 in-progress, 4 confirmed, 1 pending)');
  console.log('  Tomorrow : 3 appointments');
  console.log('  Past 7d  : 18 appointments (mostly completed)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
