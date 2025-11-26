const axios = require('axios');

const API_URL = 'http://localhost:5002';

// Test all update endpoints
async function testAllUpdates() {
  console.log('🧪 Testing All Update Endpoints\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: User Update
    console.log('\n1️⃣ Testing User Update...');
    try {
      const usersResponse = await axios.get(`${API_URL}/api/users`);
      if (usersResponse.data.length > 0) {
        const testUser = usersResponse.data[0];
        console.log(`   Found user: ${testUser.name} (${testUser._id})`);
        
        const updateData = {
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone || '1234567890',
          role: testUser.role
        };
        
        const updateResponse = await axios.put(
          `${API_URL}/api/users/${testUser._id}`,
          updateData
        );
        console.log('   ✅ User update successful!');
        console.log(`   Updated: ${updateResponse.data.name}`);
      } else {
        console.log('   ⚠️  No users found to test');
      }
    } catch (error) {
      console.log('   ❌ User update failed:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Doctor Update
    console.log('\n2️⃣ Testing Doctor Update...');
    try {
      const doctorsResponse = await axios.get(`${API_URL}/api/doctors`);
      if (doctorsResponse.data.length > 0) {
        const testDoctor = doctorsResponse.data[0];
        console.log(`   Found doctor: ${testDoctor.name} (${testDoctor._id})`);
        
        const updateData = {
          name: testDoctor.name,
          email: testDoctor.email,
          phone: testDoctor.phone || '1234567890',
          specialization: testDoctor.specialization,
          clinicId: testDoctor.clinicId?._id || testDoctor.clinicId,
          consultationFee: testDoctor.consultationFee || 500,
          experience: testDoctor.experience || 5,
          qualification: testDoctor.qualification || 'MBBS',
          availability: testDoctor.availability || 'Available'
        };
        
        const updateResponse = await axios.put(
          `${API_URL}/api/doctors/${testDoctor._id}`,
          updateData
        );
        console.log('   ✅ Doctor update successful!');
        console.log(`   Updated: ${updateResponse.data.name}`);
      } else {
        console.log('   ⚠️  No doctors found to test');
      }
    } catch (error) {
      console.log('   ❌ Doctor update failed:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Clinic Update
    console.log('\n3️⃣ Testing Clinic Update...');
    try {
      const clinicsResponse = await axios.get(`${API_URL}/api/clinics`);
      if (clinicsResponse.data.length > 0) {
        const testClinic = clinicsResponse.data[0];
        console.log(`   Found clinic: ${testClinic.name} (${testClinic._id})`);
        
        const updateData = {
          name: testClinic.name,
          address: testClinic.address,
          city: testClinic.city,
          phone: testClinic.phone,
          email: testClinic.email || 'test@clinic.com'
        };
        
        const updateResponse = await axios.put(
          `${API_URL}/api/clinics/${testClinic._id}`,
          updateData
        );
        console.log('   ✅ Clinic update successful!');
        console.log(`   Updated: ${updateResponse.data.name}`);
      } else {
        console.log('   ⚠️  No clinics found to test');
      }
    } catch (error) {
      console.log('   ❌ Clinic update failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running!');
      console.log('   Start it with: cd backend && npm start');
    }
  }
}

// Run tests
testAllUpdates();
