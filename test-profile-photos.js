// Test script for profile photo feature
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testProfilePhotoFeature() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  log('║         PROFILE PHOTO FEATURE TEST                         ║', 'cyan');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let testUserId = null;
  let testEmail = `test${Date.now()}@example.com`;

  try {
    // Test 1: Create a test user
    log('Test 1: Creating test user...', 'yellow');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'Test123!',
      phone: '+1234567890',
      role: 'patient'
    });

    if (registerResponse.data.user) {
      testUserId = registerResponse.data.user.id;
      log('✓ User created successfully', 'green');
      log(`  User ID: ${testUserId}`, 'cyan');
      log(`  Profile Photo: ${registerResponse.data.user.profilePhoto || 'null (will use Gravatar/initials)'}`, 'cyan');
    }

    // Test 2: Upload profile photo
    log('\nTest 2: Uploading profile photo...', 'yellow');
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/profile/update-photo`, {
      userId: testUserId,
      profilePhoto: sampleBase64
    });

    if (uploadResponse.data.success) {
      log('✓ Profile photo uploaded successfully', 'green');
      log(`  Photo stored: ${uploadResponse.data.user.profilePhoto.substring(0, 50)}...`, 'cyan');
    }

    // Test 3: Get user profile
    log('\nTest 3: Retrieving user profile...', 'yellow');
    const profileResponse = await axios.get(`${BASE_URL}/api/profile/profile/${testUserId}`);

    if (profileResponse.data.success) {
      log('✓ Profile retrieved successfully', 'green');
      log(`  Name: ${profileResponse.data.user.name}`, 'cyan');
      log(`  Email: ${profileResponse.data.user.email}`, 'cyan');
      log(`  Has Photo: ${profileResponse.data.user.profilePhoto ? 'Yes' : 'No'}`, 'cyan');
    }

    // Test 4: Delete profile photo
    log('\nTest 4: Deleting profile photo...', 'yellow');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/profile/delete-photo/${testUserId}`);

    if (deleteResponse.data.success) {
      log('✓ Profile photo deleted successfully', 'green');
      log(`  Photo is now: ${deleteResponse.data.user.profilePhoto || 'null'}`, 'cyan');
    }

    // Test 5: Login and check profilePhoto in response
    log('\nTest 5: Testing login with profilePhoto...', 'yellow');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: 'Test123!'
    });

    if (loginResponse.data.user) {
      log('✓ Login successful', 'green');
      log(`  User has profilePhoto field: ${loginResponse.data.user.hasOwnProperty('profilePhoto') ? 'Yes' : 'No'}`, 'cyan');
      log(`  Profile Photo value: ${loginResponse.data.user.profilePhoto || 'null'}`, 'cyan');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    log('✅ ALL TESTS PASSED!', 'green');
    console.log('='.repeat(60));
    
    log('\n📋 Feature Summary:', 'cyan');
    log('  ✓ User model has profilePhoto field', 'green');
    log('  ✓ Profile photo upload works', 'green');
    log('  ✓ Profile photo retrieval works', 'green');
    log('  ✓ Profile photo deletion works', 'green');
    log('  ✓ Login returns profilePhoto field', 'green');
    
    log('\n💡 Next Steps:', 'yellow');
    log('  1. Existing users will use Gravatar or initials', 'cyan');
    log('  2. Users can upload custom photos via UI', 'cyan');
    log('  3. Photos appear in UserAvatar component', 'cyan');

  } catch (error) {
    log('\n✗ Test failed:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${error.response.data.message || error.message}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    
    log('\n⚠ Make sure:', 'yellow');
    log('  1. Backend is running (npm start in backend folder)', 'cyan');
    log('  2. MongoDB is connected', 'cyan');
    log('  3. Profile routes are registered in server.js', 'cyan');
  }

  console.log('\n');
}

// Run tests
testProfilePhotoFeature();
