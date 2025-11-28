// Test password reset email functionality
const axios = require('axios');

const API_URL = 'http://localhost:5005/api/auth';

async function testPasswordResetEmail() {
  console.log('🧪 Testing Password Reset Email Functionality\n');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Test 1: Request password reset
    console.log('📧 Test 1: Requesting password reset OTP...');
    const resetResponse = await axios.post(`${API_URL}/forgot-password`, {
      email: 'desouvik0000@gmail.com'
    });

    console.log('✅ Response:', resetResponse.data);
    
    if (resetResponse.data.otp) {
      console.log('\n🔐 OTP Code:', resetResponse.data.otp);
      console.log('📧 Check your email: desouvik0000@gmail.com');
      console.log('\n⏱️  OTP is valid for 10 minutes');
      console.log('\n📝 To reset password, use the /reset-password endpoint with:');
      console.log('   - email: desouvik0000@gmail.com');
      console.log('   - otp: ' + resetResponse.data.otp);
      console.log('   - newPassword: your_new_password');
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ Password reset email test completed!');
    console.log('📧 Check your inbox at: desouvik0000@gmail.com');
    console.log('📁 Also check spam/junk folder if not in inbox');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testPasswordResetEmail();
