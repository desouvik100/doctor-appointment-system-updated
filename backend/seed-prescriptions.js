/**
 * Seed Prescription Test Data
 * Run: node seed-prescriptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Prescription = require('./models/Prescription');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Clinic = require('./models/Clinic');
const Appointment = require('./models/Appointment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment';

async function seedPrescriptions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific clinic for the logged-in staff user
    const targetClinicId = '692aa765d6c782b9209b5eae'; // City Care clinic (desouvik0007@gmail.com's clinic)
    const clinic = await Clinic.findById(targetClinicId);
    if (!clinic) {
      console.log('❌ Target clinic not found. Trying first clinic...');
      const firstClinic = await Clinic.findOne();
      if (!firstClinic) {
        console.log('❌ No clinic found.');
        process.exit(1);
      }
    }
    console.log(`📍 Using clinic: ${clinic?.name || 'Unknown'} (${targetClinicId})`);

    // Find existing doctor for this clinic
    let doctor = await Doctor.findOne({ clinicId: targetClinicId });
    if (!doctor) {
      // Find any doctor
      doctor = await Doctor.findOne();
    }
    if (!doctor) {
      console.log('❌ No doctor found.');
      process.exit(1);
    }
    console.log(`👨‍⚕️ Using doctor: Dr. ${doctor.name}`);

    // Find existing patients (users with role 'patient')
    let patients = await User.find({ role: 'patient' }).limit(5);
    
    if (patients.length === 0) {
      console.log('⚠️ No patients found. Creating test patients...');
      const testPatients = [
        { name: 'Rahul Sharma', email: 'rahul.sharma@test.com', phone: '9876543210', role: 'patient', password: 'test123' },
        { name: 'Priya Patel', email: 'priya.patel@test.com', phone: '9876543211', role: 'patient', password: 'test123' },
        { name: 'Amit Kumar', email: 'amit.kumar@test.com', phone: '9876543212', role: 'patient', password: 'test123' },
      ];
      patients = await User.insertMany(testPatients);
      console.log(`✅ Created ${patients.length} test patients`);
    }

    // Find or create appointments for prescriptions
    let appointments = await Appointment.find({ 
      doctorId: doctor._id,
      status: 'completed'
    }).limit(5);

    if (appointments.length < patients.length) {
      console.log('⚠️ Creating test appointments...');
      const newAppointments = [];
      for (const patient of patients) {
        const existingApt = appointments.find(a => a.userId?.toString() === patient._id.toString());
        if (!existingApt) {
          newAppointments.push({
            userId: patient._id,
            doctorId: doctor._id,
            clinicId: targetClinicId,
            date: new Date(),
            time: '10:00',
            status: 'completed',
            consultationType: 'in_person',
            symptoms: 'General checkup'
          });
        }
      }
      if (newAppointments.length > 0) {
        const created = await Appointment.insertMany(newAppointments);
        appointments = [...appointments, ...created];
        console.log(`✅ Created ${created.length} test appointments`);
      }
    }

    // Sample prescriptions data
    const prescriptionsData = [
      {
        diagnosis: 'Viral Fever with Upper Respiratory Tract Infection',
        symptoms: ['Fever', 'Cough', 'Cold', 'Body ache'],
        medicines: [
          { name: 'Paracetamol 650mg', dosage: '650mg', frequency: 'TDS', duration: '5 days', timing: 'after_food', instructions: 'Take with warm water' },
          { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'OD', duration: '5 days', timing: 'bedtime', instructions: 'Take at night' },
          { name: 'Amoxicillin 500mg', dosage: '500mg', frequency: 'BD', duration: '5 days', timing: 'after_food', instructions: 'Complete the course' },
        ],
        advice: 'Take rest, drink plenty of fluids. Avoid cold drinks and ice cream.',
        dietaryInstructions: 'Light diet, warm soups, avoid oily food',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        followUpInstructions: 'Come for follow-up if fever persists',
        vitals: { bloodPressure: '120/80', pulse: '78', temperature: '101°F', weight: '65kg' }
      },
      {
        diagnosis: 'Acute Gastritis',
        symptoms: ['Stomach pain', 'Acidity', 'Nausea'],
        medicines: [
          { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: 'OD', duration: '14 days', timing: 'before_food', instructions: 'Take 30 mins before breakfast' },
          { name: 'Domperidone 10mg', dosage: '10mg', frequency: 'TDS', duration: '7 days', timing: 'before_food', instructions: 'Take before meals' },
          { name: 'Antacid Gel', dosage: '10ml', frequency: 'TDS', duration: '7 days', timing: 'after_food', instructions: 'Take after meals' },
        ],
        advice: 'Avoid spicy and oily food. Eat small frequent meals. No smoking or alcohol.',
        dietaryInstructions: 'Bland diet, avoid citrus fruits, no tea/coffee on empty stomach',
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        followUpInstructions: 'Review after 2 weeks',
        vitals: { bloodPressure: '118/76', pulse: '72', temperature: '98.6°F', weight: '70kg' }
      },
      {
        diagnosis: 'Hypertension - Stage 1',
        symptoms: ['Headache', 'Dizziness'],
        medicines: [
          { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'OD', duration: '30 days', timing: 'after_food', instructions: 'Take in the morning' },
          { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'OD', duration: '30 days', timing: 'after_food', instructions: 'Take after lunch' },
        ],
        advice: 'Regular BP monitoring. Reduce salt intake. Daily 30 mins walk.',
        dietaryInstructions: 'Low salt diet, DASH diet recommended, avoid processed foods',
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        followUpInstructions: 'Monthly BP check required',
        vitals: { bloodPressure: '145/92', pulse: '82', temperature: '98.4°F', weight: '78kg' },
        labTests: [{ name: 'Lipid Profile', instructions: 'Fasting required', urgent: false }]
      },
      {
        diagnosis: 'Type 2 Diabetes Mellitus',
        symptoms: ['Increased thirst', 'Frequent urination', 'Fatigue'],
        medicines: [
          { name: 'Metformin 500mg', dosage: '500mg', frequency: 'BD', duration: '30 days', timing: 'after_food', instructions: 'Take after breakfast and dinner' },
          { name: 'Glimepiride 1mg', dosage: '1mg', frequency: 'OD', duration: '30 days', timing: 'before_food', instructions: 'Take before breakfast' },
        ],
        advice: 'Regular blood sugar monitoring. Exercise daily. Foot care important.',
        dietaryInstructions: 'Low carb diet, avoid sweets and sugary drinks, eat fiber-rich foods',
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        followUpInstructions: 'HbA1c test after 3 months',
        vitals: { bloodPressure: '130/85', pulse: '76', temperature: '98.6°F', weight: '82kg', bloodSugar: '186 mg/dL' },
        labTests: [
          { name: 'HbA1c', instructions: 'No fasting required', urgent: false },
          { name: 'Kidney Function Test', instructions: 'Fasting required', urgent: false }
        ]
      },
      {
        diagnosis: 'Allergic Rhinitis',
        symptoms: ['Sneezing', 'Runny nose', 'Itchy eyes'],
        medicines: [
          { name: 'Levocetirizine 5mg', dosage: '5mg', frequency: 'OD', duration: '14 days', timing: 'bedtime', instructions: 'Take at night' },
          { name: 'Fluticasone Nasal Spray', dosage: '2 sprays', frequency: 'BD', duration: '14 days', timing: 'as_needed', instructions: 'Use in each nostril' },
        ],
        advice: 'Avoid dust and allergens. Use air purifier if possible. Keep windows closed during high pollen days.',
        dietaryInstructions: 'Avoid cold drinks, include honey and ginger in diet',
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        followUpInstructions: 'Review if symptoms persist',
        vitals: { bloodPressure: '115/75', pulse: '70', temperature: '98.4°F', weight: '58kg' }
      }
    ];

    // Delete existing test prescriptions
    await Prescription.deleteMany({ clinicId: targetClinicId });
    console.log('🗑️ Cleared existing prescriptions');

    // Create prescriptions
    const createdPrescriptions = [];
    for (let i = 0; i < Math.min(patients.length, prescriptionsData.length); i++) {
      const patient = patients[i];
      const appointment = appointments.find(a => a.userId?.toString() === patient._id.toString()) || appointments[i];
      const rxData = prescriptionsData[i];

      // Generate prescription number manually
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const prescriptionNumber = `RX${year}${month}${day}${random}`;

      const prescription = new Prescription({
        appointmentId: appointment._id,
        patientId: patient._id,
        doctorId: doctor._id,
        clinicId: targetClinicId,
        prescriptionNumber,
        ...rxData,
        status: 'finalized'
      });

      await prescription.save();
      createdPrescriptions.push(prescription);
      console.log(`💊 Created prescription for ${patient.name}: ${rxData.diagnosis}`);
    }

    console.log('\n✅ Successfully seeded prescription data!');
    console.log(`📋 Total prescriptions created: ${createdPrescriptions.length}`);
    console.log('\nPrescription Numbers:');
    createdPrescriptions.forEach(rx => {
      console.log(`  - ${rx.prescriptionNumber}`);
    });

  } catch (error) {
    console.error('❌ Error seeding prescriptions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedPrescriptions();
