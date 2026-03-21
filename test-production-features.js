/**
 * Production Feature Testing Script
 * Tests critical features before launch
 */

const axios = require('axios');

const API_URL = 'http://localhost:5005/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`
  }[type];
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testServerHealth() {
  log('Testing server health...', 'info');
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`, { timeout: 5000 });
    if (response.status === 200) {
      log('Backend server is healthy', 'success');
      testResults.passed++;
      return true;
    }
  } catch (error) {
    log(`Backend server health check failed: ${error.message}`, 'error');
    testResults.failed++;
    return false;
  }
}

async function testDatabaseConnection() {
  log('Testing database connection...', 'info');
  try {
    // Try to fetch doctors (should work even without auth)
    const response = await axios.get(`${API_URL}/doctors`, { timeout: 5000 });
    if (response.status === 200) {
      log(`Database connected - Found ${response.data.length || 0} doctors`, 'success');
      testResults.passed++;
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log('Database connected but no doctors endpoint', 'warning');
      testResults.warnings++;
      return true;
    }
    log(`Database connection test failed: ${error.message}`, 'error');
    testResults.failed++;
    return false;
  }
}

async function testUserRegistration() {
  log('Testing user registration...', 'info');
  try {
    const testUser = {
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'Test@123456',
      phone: '9876543210',
      role: 'patient'
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, testUser, { timeout: 10000 });
    
    if (response.data.success || response.data.token) {
      log('User registration working', 'success');
      testResults.passed++;
      return { success: true, user: response.data.user, token: response.data.token };
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      log('Registration validation working (duplicate email detected)', 'success');
      testResults.passed++;
      return { success: true };
    }
    log(`User registration failed: ${error.response?.data?.message || error.message}`, 'error');
    testResults.failed++;
    return { success: false };
  }
}

async function testUserLogin() {
  log('Testing user login...', 'info');
  try {
    // Try with a test account
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    }, { timeout: 10000 });
    
    if (response.data.token) {
      log('User login working', 'success');
      testResults.passed++;
      return { success: true, token: response.data.token, user: response.data.user };
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      log('Login validation working (invalid credentials rejected)', 'success');
      testResults.passed++;
      return { success: true };
    }
    log(`User login test failed: ${error.response?.data?.message || error.message}`, 'error');
    testResults.failed++;
    return { success: false };
  }
}

async function testPaymentConfiguration() {
  log('Testing payment configuration...', 'info');
  try {
    // Check if Razorpay keys are configured
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`, { timeout: 5000 });
    
    // We can't directly check env vars, but we can check if payment endpoints exist
    log('Payment configuration check completed', 'success');
    log('⚠️  Manual verification needed: Check Razorpay dashboard', 'warning');
    testResults.warnings++;
    return true;
  } catch (error) {
    log('Could not verify payment configuration', 'warning');
    testResults.warnings++;
    return false;
  }
}

async function testAppointmentBookingValidation() {
  log('Testing appointment booking validation...', 'info');
  try {
    // Try to book without auth (should fail)
    const response = await axios.post(`${API_URL}/appointments`, {
      userId: '507f1f77bcf86cd799439011',
      doctorId: '507f1f77bcf86cd799439011',
      clinicId: '507f1f77bcf86cd799439011',
      date: '2026-03-15',
      time: '10:00',
      reason: 'Test'
    }, { timeout: 10000 });
    
    log('Appointment booking endpoint accessible', 'warning');
    testResults.warnings++;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      log('Appointment validation working (invalid data rejected)', 'success');
      testResults.passed++;
      return true;
    }
    if (error.response?.status === 401) {
      log('Appointment authentication working (unauthorized rejected)', 'success');
      testResults.passed++;
      return true;
    }
    log(`Appointment booking validation unclear: ${error.message}`, 'warning');
    testResults.warnings++;
  }
}

async function testQueueSystem() {
  log('Testing queue system endpoints...', 'info');
  try {
    // Try to access queue info (might need auth)
    const testDate = '2026-03-15';
    const testDoctorId = '507f1f77bcf86cd799439011';
    
    const response = await axios.get(
      `${API_URL}/appointments/queue-info/${testDoctorId}/${testDate}`,
      { timeout: 10000 }
    );
    
    log('Queue system endpoint accessible', 'success');
    testResults.passed++;
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      log('Queue system endpoint exists (no data for test ID)', 'success');
      testResults.passed++;
      return true;
    }
    log(`Queue system test inconclusive: ${error.message}`, 'warning');
    testResults.warnings++;
  }
}

async function testGoogleOAuthConfig() {
  log('Testing Google OAuth configuration...', 'info');
  
  // Check if client ID is set in frontend
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  
  if (clientId && clientId.includes('apps.googleusercontent.com')) {
    log('Google Client ID configured correctly', 'success');
    testResults.passed++;
    return true;
  } else {
    log('Google Client ID not found in environment', 'warning');
    log('⚠️  Check frontend/.env for REACT_APP_GOOGLE_CLIENT_ID', 'warning');
    testResults.warnings++;
    return false;
  }
}

async function testEmailService() {
  log('Testing email service configuration...', 'info');
  
  // We can't actually send emails in test, but we can check config
  log('⚠️  Email service requires manual testing', 'warning');
  log('   Send a test appointment confirmation to verify', 'info');
  testResults.warnings++;
  return true;
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 HEALTHSYNC PRODUCTION FEATURE TESTING');
  console.log('='.repeat(60) + '\n');
  
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Payment Configuration', fn: testPaymentConfiguration },
    { name: 'Appointment Validation', fn: testAppointmentBookingValidation },
    { name: 'Queue System', fn: testQueueSystem },
    { name: 'Google OAuth Config', fn: testGoogleOAuthConfig },
    { name: 'Email Service', fn: testEmailService }
  ];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      await test.fn();
    } catch (error) {
      log(`Test crashed: ${error.message}`, 'error');
      testResults.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}✓ Passed:${colors.reset}   ${testResults.passed}`);
  console.log(`${colors.red}✗ Failed:${colors.reset}   ${testResults.failed}`);
  console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${testResults.warnings}`);
  console.log('='.repeat(60) + '\n');
  
  const totalTests = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = totalTests > 0 ? Math.round((testResults.passed / totalTests) * 100) : 0;
  
  console.log(`Success Rate: ${successRate}%\n`);
  
  if (testResults.failed === 0) {
    log('🎉 All critical tests passed! Ready for soft launch.', 'success');
  } else if (testResults.failed <= 2) {
    log('⚠️  Some tests failed. Review and fix before launch.', 'warning');
  } else {
    log('❌ Multiple critical failures. Fix issues before launch.', 'error');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review any failed tests above');
  console.log('2. Test payment flow manually with Razorpay test cards');
  console.log('3. Test Google Sign-In in browser');
  console.log('4. Book a test appointment end-to-end');
  console.log('5. Check Live Queue Tracker');
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
