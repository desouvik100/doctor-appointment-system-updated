// Test OTP Email Sending
const { sendOTP } = require('./services/emailService');

async function testOTPEmail() {
  console.log('🧪 Testing OTP Email Service...\n');
  
  // Check environment variables
  console.log('📧 Email Configuration:');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Missing');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ Missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
  console.log('');

  // Test email address - CHANGE THIS TO YOUR EMAIL
  const testEmail = 'desouvik0000@gmail.com';
  
  console.log(`📨 Sending test OTP to: ${testEmail}\n`);
  
  try {
    const result = await sendOTP(testEmail, 'test');
    console.log('✅ SUCCESS!');
    console.log('Result:', result);
    console.log('\n📬 Check your email inbox (and spam folder) for the OTP!');
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testOTPEmail();
