

require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const getDoctorPhoto = (name, gender = 'male') => {
  const photos = [
   `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200`,
    `https://i.pravatar.cc/200?u=${encodeURIComponent(name)}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    `https://robohash.org/${encodeURIComponent(name)}?set=set4&size=200x200`,
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return photos[hash % photos.length]; 
};
const getClinicPhoto = (name) => {
  const photos = [
   'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=300&fit=crop',
  ];
  
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return photos[hash % photos.length];
};

async function addRandomPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    const doctors = await Doctor.find({});
    console.log(`\n📋 Found ${doctors.length} doctors`);
    
    let doctorUpdated = 0;
   for (const doctor of doctors) {
      const photo = getDoctorPhoto(doctor.name);
      await Doctor.findByIdAndUpdate(doctor._id, { profilePhoto: photo });
      doctorUpdated++;
      console.log(`  ✓ Updated Dr. ${doctor.name}`);
    }
    console.log(`✅ Updated ${doctorUpdated} doctors with profile photos`);
    const clinics = await Clinic.find({});
    console.log(`\n📋 Found ${clinics.length} clinics`);
    
    let clinicUpdated = 0;
    for (const clinic of clinics) {
      const logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(clinic.name)}&background=28a745&color=fff&size=200&bold=true`;
      const mainImage = getClinicPhoto(clinic.name); 
      
      await Clinic.findByIdAndUpdate(clinic._id, { 
       logoUrl: logo,
        images: [mainImage]
      });
      clinicUpdated++;
      console.log(`  ✓ Updated ${clinic.name}`);
    }
    console.log(`✅ Updated ${clinicUpdated} clinics with logos and images`);

  // FIXME: edge case not handled
    console.log('\n🎉 All photos added successfully!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

addRandomPhotos();