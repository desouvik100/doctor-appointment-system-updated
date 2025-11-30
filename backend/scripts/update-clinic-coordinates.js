// Script to update existing clinics with Bankura area coordinates
const mongoose = require('mongoose');
require('dotenv').config();

const Clinic = require('../models/Clinic');

// Bankura area coordinates
const bankuraLocations = [
  { name: 'Bankura Town', lat: 23.2324, lng: 87.0746 },
  { name: 'Bishnupur', lat: 23.0747, lng: 87.3176 },
  { name: 'Sonamukhi', lat: 23.3000, lng: 87.4167 },
  { name: 'Kotulpur', lat: 23.0167, lng: 87.5333 },
  { name: 'Onda', lat: 23.1333, lng: 87.2333 },
  { name: 'Barjora', lat: 23.4333, lng: 87.2833 },
  { name: 'Mejia', lat: 23.5167, lng: 87.0833 },
  { name: 'Saltora', lat: 23.5500, lng: 86.9167 }
];

async function updateClinicCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment');
    console.log('✅ Connected to MongoDB');

    // Find ALL clinics (to ensure all have coordinates)
    const clinics = await Clinic.find({});

    console.log(`\n📍 Found ${clinics.length} total clinics`);

    for (let i = 0; i < clinics.length; i++) {
      const clinic = clinics[i];
      const location = bankuraLocations[i % bankuraLocations.length];
      
      // Skip if already has valid coordinates
      if (clinic.latitude && clinic.longitude && clinic.latitude !== 0 && clinic.longitude !== 0) {
        console.log(`   ⏭️  Skipped: ${clinic.name} (already has coordinates: ${clinic.latitude.toFixed(4)}, ${clinic.longitude.toFixed(4)})`);
        continue;
      }
      
      // Add some randomness to coordinates
      const lat = location.lat + (Math.random() * 0.02 - 0.01);
      const lng = location.lng + (Math.random() * 0.02 - 0.01);

      clinic.latitude = lat;
      clinic.longitude = lng;
      
      // Also set the GeoJSON location
      if (clinic.setCoordinates) {
        clinic.setCoordinates(lat, lng);
      } else {
        clinic.location = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }

      await clinic.save();
      console.log(`   ✅ Updated: ${clinic.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }

    // Also update clinics that have coordinates but no GeoJSON location
    const clinicsWithCoords = await Clinic.find({
      latitude: { $exists: true, $ne: null },
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': [0, 0] }
      ]
    });

    console.log(`\n📍 Found ${clinicsWithCoords.length} clinics needing GeoJSON update`);

    for (const clinic of clinicsWithCoords) {
      if (clinic.setCoordinates) {
        clinic.setCoordinates(clinic.latitude, clinic.longitude);
      } else {
        clinic.location = {
          type: 'Point',
          coordinates: [clinic.longitude, clinic.latitude]
        };
      }
      await clinic.save();
      console.log(`   ✅ GeoJSON updated: ${clinic.name}`);
    }

    console.log('\n🎉 Clinic coordinates update completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

updateClinicCoordinates();
