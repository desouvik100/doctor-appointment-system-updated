// Test script to check doctors in database and API
const axios = require('axios');

const BASE_URL = 'http://localhost:5005';

async function testDoctorsAPI() {
  console.log('🧪 Testing Doctors API\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // Test 1: Fetch all doctors
    console.log('📋 Test 1: Fetching all doctors from API');
    console.log('URL:', `${BASE_URL}/api/doctors`);
    
    const response = await axios.get(`${BASE_URL}/api/doctors`);
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Number of doctors found:', response.data.length);
    
    if (response.data.length === 0) {
      console.log('\n⚠️  WARNING: No doctors found in database!');
      console.log('   You may need to populate the database with doctors.');
      console.log('   Run: node backend/populate-mongodb.js');
    } else {
      console.log('\n📊 Doctors List:');
      console.log('─────────────────────────────────────');
      response.data.forEach((doctor, index) => {
        console.log(`\n${index + 1}. ${doctor.name}`);
        console.log(`   Specialization: ${doctor.specialization}`);
        console.log(`   Email: ${doctor.email}`);
        console.log(`   Phone: ${doctor.phone || 'N/A'}`);
        console.log(`   Clinic: ${doctor.clinicId?.name || 'No clinic assigned'}`);
        console.log(`   Active: ${doctor.isActive ? 'Yes' : 'No'}`);
      });
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Test completed successfully!');
    console.log('\nIf doctors are showing here but not in the frontend:');
    console.log('1. Check browser console for errors (F12)');
    console.log('2. Make sure frontend is using correct API URL');
    console.log('3. Check CORS settings in backend');
    console.log('4. Verify axios config in frontend/src/api/config.js');

  } catch (error) {
    console.error('\n❌ Error testing doctors API:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Backend server is not running!');
      console.error('   Start it with: cd backend && npm start');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.data);
    } else {
      console.error('   ', error.message);
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('❌ Test failed!');
  }
}

// Run the test
testDoctorsAPI();
