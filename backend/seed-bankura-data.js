// Seed script for Bankura, West Bengal data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Clinic = require('./models/Clinic');

// Bankura area coordinates and locations
const bankuraLocations = [
  { name: 'Bankura Town', lat: 23.2324, lng: 87.0746, pincode: '722101' },
  { name: 'Bishnupur', lat: 23.0747, lng: 87.3176, pincode: '722122' },
  { name: 'Sonamukhi', lat: 23.3000, lng: 87.4167, pincode: '722207' },
  { name: 'Kotulpur', lat: 23.0167, lng: 87.5333, pincode: '722141' },
  { name: 'Onda', lat: 23.1333, lng: 87.2333, pincode: '722144' },
  { name: 'Barjora', lat: 23.4333, lng: 87.2833, pincode: '722202' },
  { name: 'Mejia', lat: 23.5167, lng: 87.0833, pincode: '722143' },
  { name: 'Saltora', lat: 23.5500, lng: 86.9167, pincode: '722153' }
];

// Sample clinic data
const clinicsData = [
  {
    name: 'Bankura Sammilani Medical College Hospital',
    type: 'hospital',
    address: 'Kenduadihi, Bankura',
    landmark: 'Near Bankura Bus Stand',
    description: 'Government medical college and hospital providing comprehensive healthcare services',
    facilities: ['Emergency', 'ICU', 'Surgery', 'Pharmacy', 'Lab', 'X-Ray', 'CT Scan'],
    phone: '03242-251010'
  },
  {
    name: 'Bishnupur Sub-Divisional Hospital',
    type: 'hospital',
    address: 'Hospital Road, Bishnupur',
    landmark: 'Near Bishnupur Railway Station',
    description: 'Sub-divisional hospital serving Bishnupur and surrounding areas',
    facilities: ['Emergency', 'OPD', 'Pharmacy', 'Lab', 'X-Ray'],
    phone: '03244-252100'
  },
  {
    name: 'LifeCare Clinic',
    type: 'clinic',
    address: 'Machantala, Bankura Town',
    landmark: 'Near Bankura College',
    description: 'Multi-specialty clinic with experienced doctors',
    facilities: ['OPD', 'Pharmacy', 'Lab', 'ECG'],
    phone: '03242-255500'
  },
  {
    name: 'Arogya Health Center',
    type: 'clinic',
    address: 'Station Road, Bankura',
    landmark: 'Near Bankura Railway Station',
    description: 'Family healthcare center with affordable consultation',
    facilities: ['OPD', 'Pharmacy', 'Vaccination'],
    phone: '03242-256600'
  },
  {
    name: 'Shanti Nursing Home',
    type: 'hospital',
    address: 'Kenduadihi Main Road, Bankura',
    landmark: 'Near Kenduadihi More',
    description: 'Private nursing home with 24/7 emergency services',
    facilities: ['Emergency', 'ICU', 'Surgery', 'Pharmacy', 'Lab'],
    phone: '03242-257700'
  },
  {
    name: 'Bishnupur Health Clinic',
    type: 'clinic',
    address: 'Jor Bangla Road, Bishnupur',
    landmark: 'Near Jor Bangla Temple',
    description: 'Primary healthcare clinic serving local community',
    facilities: ['OPD', 'Pharmacy', 'Lab'],
    phone: '03244-253300'
  },
  {
    name: 'Sonamukhi Primary Health Center',
    type: 'clinic',
    address: 'Main Road, Sonamukhi',
    landmark: 'Near Sonamukhi Bus Stand',
    description: 'Government primary health center',
    facilities: ['OPD', 'Vaccination', 'Maternal Care'],
    phone: '03242-258800'
  },
  {
    name: 'Medica Superspecialty Clinic',
    type: 'clinic',
    address: 'GT Road, Bankura',
    landmark: 'Near Bankura Court',
    description: 'Modern diagnostic and consultation center',
    facilities: ['OPD', 'Lab', 'X-Ray', 'USG', 'ECG'],
    phone: '03242-259900'
  }
];

// Sample doctors data - Extended with more Bankura area doctors
const doctorsData = [
  { name: 'Dr. Subhash Mukherjee', specialization: 'General Physician', fee: 300, exp: 15, qual: 'MBBS, MD' },
  { name: 'Dr. Ananya Banerjee', specialization: 'Gynecologist', fee: 500, exp: 12, qual: 'MBBS, MS (OBG)' },
  { name: 'Dr. Rajesh Das', specialization: 'Cardiologist', fee: 600, exp: 18, qual: 'MBBS, DM (Cardiology)' },
  { name: 'Dr. Priya Ghosh', specialization: 'Pediatrician', fee: 400, exp: 10, qual: 'MBBS, MD (Pediatrics)' },
  { name: 'Dr. Amit Roy', specialization: 'Orthopedic', fee: 500, exp: 14, qual: 'MBBS, MS (Ortho)' },
  { name: 'Dr. Suman Chatterjee', specialization: 'Dermatologist', fee: 450, exp: 8, qual: 'MBBS, MD (Derma)' },
  { name: 'Dr. Debashis Mondal', specialization: 'ENT Specialist', fee: 400, exp: 11, qual: 'MBBS, MS (ENT)' },
  { name: 'Dr. Moumita Sen', specialization: 'Ophthalmologist', fee: 450, exp: 9, qual: 'MBBS, MS (Ophth)' },
  { name: 'Dr. Kaushik Sarkar', specialization: 'Neurologist', fee: 700, exp: 16, qual: 'MBBS, DM (Neuro)' },
  { name: 'Dr. Rupa Dey', specialization: 'Psychiatrist', fee: 500, exp: 7, qual: 'MBBS, MD (Psych)' },
  { name: 'Dr. Biswajit Pal', specialization: 'General Surgeon', fee: 550, exp: 13, qual: 'MBBS, MS (Surgery)' },
  { name: 'Dr. Tanushree Basu', specialization: 'Dentist', fee: 350, exp: 6, qual: 'BDS, MDS' },
  { name: 'Dr. Sourav Chakraborty', specialization: 'General Physician', fee: 250, exp: 5, qual: 'MBBS' },
  { name: 'Dr. Nilima Saha', specialization: 'Gynecologist', fee: 450, exp: 10, qual: 'MBBS, DGO' },
  { name: 'Dr. Partha Bhattacharya', specialization: 'Cardiologist', fee: 650, exp: 20, qual: 'MBBS, MD, DM' },
  // Additional doctors for Bankura region
  { name: 'Dr. Arindam Ghosh', specialization: 'Urologist', fee: 550, exp: 12, qual: 'MBBS, MS (Urology)' },
  { name: 'Dr. Swapna Mitra', specialization: 'Endocrinologist', fee: 600, exp: 14, qual: 'MBBS, DM (Endo)' },
  { name: 'Dr. Pranab Halder', specialization: 'Gastroenterologist', fee: 650, exp: 17, qual: 'MBBS, DM (Gastro)' },
  { name: 'Dr. Kakali Dutta', specialization: 'Rheumatologist', fee: 500, exp: 9, qual: 'MBBS, MD (Rheum)' },
  { name: 'Dr. Sanjay Mahato', specialization: 'General Physician', fee: 200, exp: 8, qual: 'MBBS' },
  { name: 'Dr. Mitali Sinha', specialization: 'Pediatrician', fee: 350, exp: 7, qual: 'MBBS, DCH' },
  { name: 'Dr. Tapas Kumbhakar', specialization: 'Pulmonologist', fee: 500, exp: 11, qual: 'MBBS, MD (Pulm)' },
  { name: 'Dr. Sharmila Goswami', specialization: 'Dermatologist', fee: 400, exp: 6, qual: 'MBBS, DVD' },
  { name: 'Dr. Asim Bagchi', specialization: 'Nephrologist', fee: 700, exp: 19, qual: 'MBBS, DM (Nephro)' },
  { name: 'Dr. Poulami Chakraborty', specialization: 'Gynecologist', fee: 400, exp: 5, qual: 'MBBS, DGO' },
  { name: 'Dr. Ranjan Tudu', specialization: 'Orthopedic', fee: 450, exp: 10, qual: 'MBBS, D.Ortho' },
  { name: 'Dr. Supriya Banerjee', specialization: 'Oncologist', fee: 800, exp: 15, qual: 'MBBS, MD, DM (Onco)' },
  { name: 'Dr. Bhaskar Mandal', specialization: 'General Surgeon', fee: 500, exp: 12, qual: 'MBBS, MS' },
  { name: 'Dr. Anindita Roy', specialization: 'Psychiatrist', fee: 450, exp: 8, qual: 'MBBS, MD (Psych)' },
  { name: 'Dr. Sabyasachi Patra', specialization: 'ENT Specialist', fee: 350, exp: 6, qual: 'MBBS, DLO' }
];

// Sample users/patients data - Extended with more Bankura area residents
const usersData = [
  { name: 'Ramesh Kumar Mahato', email: 'ramesh.mahato@gmail.com', phone: '9876543210' },
  { name: 'Sunita Devi', email: 'sunita.devi@gmail.com', phone: '9876543211' },
  { name: 'Bikash Tudu', email: 'bikash.tudu@gmail.com', phone: '9876543212' },
  { name: 'Mamata Ghosh', email: 'mamata.ghosh@gmail.com', phone: '9876543213' },
  { name: 'Sunil Hansda', email: 'sunil.hansda@gmail.com', phone: '9876543214' },
  { name: 'Parbati Murmu', email: 'parbati.murmu@gmail.com', phone: '9876543215' },
  { name: 'Ashok Bauri', email: 'ashok.bauri@gmail.com', phone: '9876543216' },
  { name: 'Lakshmi Soren', email: 'lakshmi.soren@gmail.com', phone: '9876543217' },
  { name: 'Dipak Mandal', email: 'dipak.mandal@gmail.com', phone: '9876543218' },
  { name: 'Rina Khatun', email: 'rina.khatun@gmail.com', phone: '9876543219' },
  { name: 'Tapan Bagdi', email: 'tapan.bagdi@gmail.com', phone: '9876543220' },
  { name: 'Anjali Roy', email: 'anjali.roy@gmail.com', phone: '9876543221' },
  { name: 'Manoj Kisku', email: 'manoj.kisku@gmail.com', phone: '9876543222' },
  { name: 'Shefali Das', email: 'shefali.das@gmail.com', phone: '9876543223' },
  { name: 'Ratan Mandi', email: 'ratan.mandi@gmail.com', phone: '9876543224' },
  // Additional patients from Bankura region
  { name: 'Gopal Chandra Saha', email: 'gopal.saha@gmail.com', phone: '9876543225' },
  { name: 'Kabita Mondal', email: 'kabita.mondal@gmail.com', phone: '9876543226' },
  { name: 'Nirmal Hembram', email: 'nirmal.hembram@gmail.com', phone: '9876543227' },
  { name: 'Saraswati Lohar', email: 'saraswati.lohar@gmail.com', phone: '9876543228' },
  { name: 'Bipin Bihari Ghosh', email: 'bipin.ghosh@gmail.com', phone: '9876543229' },
  { name: 'Champa Rani Dey', email: 'champa.dey@gmail.com', phone: '9876543230' },
  { name: 'Kartik Chandra Pal', email: 'kartik.pal@gmail.com', phone: '9876543231' },
  { name: 'Malati Bera', email: 'malati.bera@gmail.com', phone: '9876543232' },
  { name: 'Sukumar Mura', email: 'sukumar.mura@gmail.com', phone: '9876543233' },
  { name: 'Basanti Kumbhakar', email: 'basanti.kumbhakar@gmail.com', phone: '9876543234' },
  { name: 'Haripada Dolui', email: 'haripada.dolui@gmail.com', phone: '9876543235' },
  { name: 'Sandhya Rani Mahato', email: 'sandhya.mahato@gmail.com', phone: '9876543236' },
  { name: 'Jadab Chandra Hansda', email: 'jadab.hansda@gmail.com', phone: '9876543237' },
  { name: 'Purnima Soren', email: 'purnima.soren@gmail.com', phone: '9876543238' },
  { name: 'Debendra Nath Roy', email: 'debendra.roy@gmail.com', phone: '9876543239' },
  { name: 'Alpana Chatterjee', email: 'alpana.chatterjee@gmail.com', phone: '9876543240' },
  { name: 'Mrinal Kanti Bagdi', email: 'mrinal.bagdi@gmail.com', phone: '9876543241' },
  { name: 'Jharna Murmu', email: 'jharna.murmu@gmail.com', phone: '9876543242' },
  { name: 'Subrata Bauri', email: 'subrata.bauri@gmail.com', phone: '9876543243' },
  { name: 'Rekha Rani Tudu', email: 'rekha.tudu@gmail.com', phone: '9876543244' }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment');
    console.log('✅ Connected to MongoDB');

    // Create clinics
    console.log('\n📍 Creating clinics in Bankura area...');
    const createdClinics = [];
    
    for (let i = 0; i < clinicsData.length; i++) {
      const clinicData = clinicsData[i];
      const location = bankuraLocations[i % bankuraLocations.length];
      
      // Check if clinic exists
      const existing = await Clinic.findOne({ name: clinicData.name });
      if (existing) {
        console.log(`   ⏭️  Clinic "${clinicData.name}" already exists`);
        createdClinics.push(existing);
        continue;
      }

      const clinic = new Clinic({
        ...clinicData,
        city: location.name,
        state: 'West Bengal',
        country: 'India',
        pincode: location.pincode,
        latitude: location.lat + (Math.random() * 0.02 - 0.01),
        longitude: location.lng + (Math.random() * 0.02 - 0.01),
        email: `contact@${clinicData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        isActive: true
      });

      // Set coordinates
      if (clinic.setCoordinates) {
        clinic.setCoordinates(clinic.latitude, clinic.longitude);
      }

      await clinic.save();
      createdClinics.push(clinic);
      console.log(`   ✅ Created: ${clinic.name} (${location.name})`);
    }

    // Create doctors
    console.log('\n👨‍⚕️ Creating doctors...');
    const createdDoctors = [];

    for (let i = 0; i < doctorsData.length; i++) {
      const doctorData = doctorsData[i];
      const clinic = createdClinics[i % createdClinics.length];
      const email = `${doctorData.name.toLowerCase().replace(/dr\.\s*/i, '').replace(/\s+/g, '.')}@healthsync.com`;

      // Check if doctor exists
      const existing = await Doctor.findOne({ email });
      if (existing) {
        console.log(`   ⏭️  Doctor "${doctorData.name}" already exists`);
        createdDoctors.push(existing);
        continue;
      }

      const doctor = new Doctor({
        name: doctorData.name,
        email: email,
        phone: `98765${(43200 + i).toString()}`,
        specialization: doctorData.specialization,
        clinicId: clinic._id,
        consultationFee: doctorData.fee,
        experience: doctorData.exp,
        qualification: doctorData.qual,
        availability: 'Available',
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 50) + 5,
        languages: ['Bengali', 'Hindi', 'English'],
        bio: `Experienced ${doctorData.specialization} with ${doctorData.exp} years of practice in Bankura region.`,
        isActive: true
      });

      await doctor.save();
      createdDoctors.push(doctor);
      console.log(`   ✅ Created: ${doctor.name} (${doctor.specialization}) at ${clinic.name}`);
    }

    // Create patients/users
    console.log('\n👥 Creating patients...');
    const hashedPassword = await bcrypt.hash('Patient@123', 10);

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const location = bankuraLocations[i % bankuraLocations.length];

      // Check if user exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`   ⏭️  User "${userData.name}" already exists`);
        continue;
      }

      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: 'patient',
        isActive: true,
        locationCaptured: true,
        loginLocation: {
          latitude: location.lat + (Math.random() * 0.05 - 0.025),
          longitude: location.lng + (Math.random() * 0.05 - 0.025),
          city: location.name,
          state: 'West Bengal',
          country: 'India',
          pincode: location.pincode,
          lastUpdated: new Date()
        }
      });

      await user.save();
      console.log(`   ✅ Created: ${user.name} (${location.name})`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`   📊 Summary:`);
    console.log(`      - Clinics: ${createdClinics.length}`);
    console.log(`      - Doctors: ${createdDoctors.length}`);
    console.log(`      - Patients: ${usersData.length}`);
    console.log(`\n   🔑 Default patient password: Patient@123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
