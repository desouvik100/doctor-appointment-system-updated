// Test OTP Endpoint
const axios = require('axios');

async function testOTP() {
  console.log('🧪 Testing OTP Endpoint...\n');
  
  try {
    const response = await axios.post('http://localhost:5005/api/otp/send-otp', {
      email: 'test@example.com',
      type: 'registration'
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.otp) {
      console.log('\n🔐 OTP Code:', response.data.otp);
      console.log('✅ OTP is being returned correctly!');
    }
    
  } catch (error) {
    console.log('❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data);
  }
}

testOTP();
