// Simple registration test without OTP
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testRegistration() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         TESTING SIMPLE REGISTRATION (NO OTP)               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const testEmail = `test${Date.now()}@example.com`;
    
    console.log('📝 Registering new user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: Test User`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'Test123!',
      phone: '+1234567890',
      role: 'patient'
    });

    if (response.data.user) {
      console.log('\n✅ Registration successful!');
      console.log('\nUser Details:');
      console.log(`   ID: ${response.data.user.id}`);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Phone: ${response.data.user.phone}`);
      console.log(`   Profile Photo: ${response.data.user.profilePhoto || 'null (will use Gravatar/initials)'}`);
      console.log(`\n   Token: ${response.data.token.substring(0, 20)}...`);
      
      console.log('\n✅ No OTP required - registration works directly!');
      
      // Test login
      console.log('\n📝 Testing login with new account...');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testEmail,
        password: 'Test123!'
      });
      
      if (loginResponse.data.user) {
        console.log('✅ Login successful!');
        console.log(`   Welcome back, ${loginResponse.data.user.name}!`);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL TESTS PASSED!');
      console.log('='.repeat(60));
      console.log('\n💡 Registration now works without OTP verification!');
      console.log('   OTP is only used for password reset.\n');
      
    }
  } catch (error) {
    console.log('\n❌ Test failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n⚠ Make sure:');
    console.log('   1. Backend is running (cd backend && npm start)');
    console.log('   2. MongoDB is connected');
    console.log('   3. Port 5000 is available\n');
  }
}

testRegistration();
