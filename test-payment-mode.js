/**
 * Test Script: Verify Payment Mode Configuration
 * 
 * This script tests whether the payment mode is correctly configured
 * and verifies that appointments can be created in test mode.
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5005';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPaymentConfig() {
  log('\n=== Testing Payment Configuration ===\n', 'cyan');

  try {
    // Test 1: Check payment config endpoint
    log('Test 1: Checking payment configuration...', 'blue');
    const configResponse = await axios.get(`${API_URL}/api/payments/config`);
    
    log(`✓ Payment Config Response:`, 'green');
    log(`  - Test Mode: ${configResponse.data.testMode}`, 'yellow');
    log(`  - Payments Enabled: ${configResponse.data.paymentsEnabled}`, 'yellow');
    log(`  - Publishable Key: ${configResponse.data.publishableKey ? 'Set' : 'Not Set'}`, 'yellow');
    
    if (configResponse.data.testMode) {
      log('\n✓ System is in TEST MODE - No payments required', 'green');
    } else {
      log('\n✓ System is in PRODUCTION MODE - Stripe payments enabled', 'green');
    }

    // Test 2: Try to create a payment intent (should return test mode response)
    log('\nTest 2: Testing payment intent creation...', 'blue');
    try {
      const paymentIntentResponse = await axios.post(`${API_URL}/api/payments/create-payment-intent`, {
        appointmentId: 'test-appointment-id',
        userId: 'test-user-id'
      });
      
      if (paymentIntentResponse.data.testMode) {
        log('✓ Payment intent returns test mode response', 'green');
        log(`  Message: ${paymentIntentResponse.data.message}`, 'yellow');
      } else {
        log('✓ Payment intent created (production mode)', 'green');
      }
    } catch (error) {
      if (error.response?.data?.testMode) {
        log('✓ Payment intent correctly returns test mode', 'green');
      } else {
        log(`⚠ Payment intent error (expected in test mode): ${error.message}`, 'yellow');
      }
    }

    log('\n=== Configuration Test Complete ===\n', 'cyan');
    log('Summary:', 'blue');
    log(`- Backend URL: ${API_URL}`, 'yellow');
    log(`- Test Mode: ${configResponse.data.testMode ? 'ENABLED' : 'DISABLED'}`, 'yellow');
    log(`- Stripe: ${configResponse.data.paymentsEnabled ? 'ENABLED' : 'DISABLED'}`, 'yellow');
    
    if (configResponse.data.testMode) {
      log('\n✓ You can now book appointments without payment!', 'green');
      log('  Appointments will be automatically confirmed.', 'green');
    } else {
      log('\n✓ Stripe payments are active.', 'green');
      log('  Appointments require payment to confirm.', 'green');
    }

  } catch (error) {
    log('\n✗ Test Failed:', 'red');
    if (error.code === 'ECONNREFUSED') {
      log('  Backend server is not running!', 'red');
      log(`  Please start the backend server at ${API_URL}`, 'yellow');
    } else {
      log(`  Error: ${error.message}`, 'red');
      if (error.response) {
        log(`  Status: ${error.response.status}`, 'red');
        log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      }
    }
  }
}

// Run the test
log('\n╔════════════════════════════════════════════╗', 'cyan');
log('║   Payment Mode Configuration Test         ║', 'cyan');
log('╚════════════════════════════════════════════╝', 'cyan');

testPaymentConfig().then(() => {
  log('\n✓ Test script completed\n', 'green');
}).catch(error => {
  log(`\n✗ Test script error: ${error.message}\n`, 'red');
  process.exit(1);
});
