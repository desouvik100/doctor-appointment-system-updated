// Complete password reset flow test
const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5005/api/auth';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testCompletePasswordResetFlow() {
  console.log('🔐 Complete Password Reset Flow Test\n');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Step 1: Request password reset OTP
    console.log('📧 Step 1: Requesting password reset OTP...');
    const email = 'desouvik0000@gmail.com';
    
    const resetResponse = await axios.post(`${API_URL}/forgot-password`, { email });
    console.log('✅ OTP request successful!');
    console.log('Response:', resetResponse.data);

    if (resetResponse.data.otp) {
      console.log('\n🔐 Development Mode - OTP:', resetResponse.data.otp);
    }

    console.log('\n📧 Check your email:', email);
    console.log('📁 Also check spam/junk folder\n');

    // Step 2: Get OTP from user
    const otp = await question('Enter the OTP you received (or press Enter to use dev OTP): ');
    const otpToUse = otp.trim() || resetResponse.data.otp;

    if (!otpToUse) {
      console.log('❌ No OTP provided. Exiting...');
      rl.close();
      return;
    }

    // Step 3: Reset password with OTP
    console.log('\n🔄 Step 2: Resetting password with OTP...');
    const newPassword = 'newpassword123';
    
    const resetPasswordResponse = await axios.post(`${API_URL}/reset-password`, {
      email,
      otp: otpToUse,
      newPassword
    });

    console.log('✅ Password reset successful!');
    console.log('Response:', resetPasswordResponse.data);

    // Step 4: Test login with new password
    console.log('\n🔑 Step 3: Testing login with new password...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email,
      password: newPassword
    });

    console.log('✅ Login successful with new password!');
    console.log('User:', loginResponse.data.user.name);
    console.log('Email:', loginResponse.data.user.email);

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ Complete password reset flow test PASSED!');
    console.log('\n📝 Summary:');
    console.log('   1. ✅ OTP sent to email');
    console.log('   2. ✅ Password reset with OTP');
    console.log('   3. ✅ Login with new password');
    console.log('\n🔐 Your new password is: ' + newPassword);
    console.log('   (Change it after testing)');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    rl.close();
  }
}

// Run the test
testCompletePasswordResetFlow();
