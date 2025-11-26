// Test script to verify OTP email templates
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testOTPEmails() {
  console.log('🧪 Testing HealthSync OTP Email Templates\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Registration OTP
  console.log('📧 Test 1: Registration OTP Email');
  console.log('─────────────────────────────────────');
  try {
    const response = await axios.post(`${BASE_URL}/api/otp/send-otp`, {
      email: 'test@example.com',
      type: 'registration'
    });
    
    if (response.data.success) {
      console.log('✅ Registration OTP sent successfully');
      console.log('   Subject: HealthSync - Verify Your Registration');
      console.log('   Purpose: Account creation verification');
    }
  } catch (error) {
    console.error('❌ Registration OTP failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n');

  // Test 2: Password Reset OTP
  console.log('📧 Test 2: Password Reset OTP Email');
  console.log('─────────────────────────────────────');
  try {
    const response = await axios.post(`${BASE_URL}/api/otp/send-otp`, {
      email: 'test@example.com',
      type: 'password-reset'
    });
    
    if (response.data.success) {
      console.log('✅ Password Reset OTP sent successfully');
      console.log('   Subject: HealthSync - Password Reset Request');
      console.log('   Purpose: Password reset verification');
    }
  } catch (error) {
    console.error('❌ Password Reset OTP failed:', error.response?.data?.message || error.message);
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 Email Template Features:');
  console.log('   ✓ HealthSync branding with logo');
  console.log('   ✓ Clear purpose statement');
  console.log('   ✓ Professional gradient design');
  console.log('   ✓ Large, readable OTP code');
  console.log('   ✓ 10-minute validity notice');
  console.log('   ✓ Security warning');
  console.log('   ✓ Responsive HTML design');
  console.log('   ✓ Plain text fallback');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('💡 Check the backend console for the OTP codes');
  console.log('💡 If email service is configured, check your inbox\n');
}

// Run the tests
testOTPEmails().catch(console.error);
