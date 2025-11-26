// Test registration with OTP verification
const axios = require('axios');
const readline = require('readline');

const BASE_URL = 'http://localhost:5000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testRegistrationWithOTP() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      TESTING REGISTRATION WITH OTP VERIFICATION            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testEmail = `test${Date.now()}@example.com`;
  let otpCode = '';

  try {
    // Step 1: Send OTP
    console.log('📧 Step 1: Sending OTP...');
    console.log(`   Email: ${testEmail}`);
    
    const otpResponse = await axios.post(`${BASE_URL}/api/otp/send-otp`, {
      email: testEmail,
      type: 'registration'
    });

    if (otpResponse.data.success) {
      console.log('✅ OTP sent successfully!');
      console.log('\n' + '='.repeat(60));
      console.log('🔐 CHECK BACKEND CONSOLE FOR OTP CODE');
      console.log('='.repeat(60));
      console.log('Look for a message like:');
      console.log('═══════════════════════════════════════');
      console.log('🔐 OTP GENERATED FOR TESTING');
      console.log('Email: ' + testEmail);
      console.log('Type: registration');
      console.log('OTP CODE: 123456  <-- THIS IS YOUR OTP');
      console.log('═══════════════════════════════════════\n');
      
      // Get OTP from user
      otpCode = await question('Enter the OTP code from backend console: ');
      
      if (!otpCode || otpCode.length !== 6) {
        console.log('❌ Invalid OTP format. Must be 6 digits.');
        rl.close();
        return;
      }

      // Step 2: Verify OTP
      console.log('\n🔍 Step 2: Verifying OTP...');
      const verifyResponse = await axios.post(`${BASE_URL}/api/otp/verify-otp`, {
        email: testEmail,
        otp: otpCode,
        type: 'registration'
      });

      if (verifyResponse.data.success && verifyResponse.data.verified) {
        console.log('✅ OTP verified successfully!');

        // Step 3: Complete Registration
        console.log('\n📝 Step 3: Completing registration...');
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
          name: 'Test User',
          email: testEmail,
          password: 'Test123!',
          phone: '+1234567890',
          role: 'patient',
          emailVerified: true
        });

        if (registerResponse.data.user) {
          console.log('✅ Registration completed successfully!');
          console.log('\n📋 User Details:');
          console.log(`   ID: ${registerResponse.data.user.id}`);
          console.log(`   Name: ${registerResponse.data.user.name}`);
          console.log(`   Email: ${registerResponse.data.user.email}`);
          console.log(`   Role: ${registerResponse.data.user.role}`);
          console.log(`   Phone: ${registerResponse.data.user.phone}`);
          console.log(`   Profile Photo: ${registerResponse.data.user.profilePhoto || 'null'}`);

          // Step 4: Test Login
          console.log('\n🔐 Step 4: Testing login...');
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
          console.log('\n✨ Registration Flow Summary:');
          console.log('   1. ✅ OTP sent to email');
          console.log('   2. ✅ OTP verified successfully');
          console.log('   3. ✅ User registered');
          console.log('   4. ✅ Login works');
          console.log('\n🎉 OTP verification is working correctly!\n');
        }
      } else {
        console.log('❌ OTP verification failed');
        console.log(`   Message: ${verifyResponse.data.message}`);
      }
    }
  } catch (error) {
    console.log('\n❌ Test failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message || error.message}`);
      if (error.response.data.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n⚠ Troubleshooting:');
    console.log('   1. Make sure backend is running (cd backend && npm start)');
    console.log('   2. Check MongoDB is connected');
    console.log('   3. Look for OTP code in backend console');
    console.log('   4. Make sure you entered the correct 6-digit OTP');
    console.log('   5. OTP expires after 10 minutes\n');
  } finally {
    rl.close();
  }
}

testRegistrationWithOTP();
