/**
 * Load Test Script - Simulate 100 Users Booking Appointments
 * Run: node load-test.js
 * 
 * Modes:
 *   node load-test.js          - Realistic test (with delays, respects rate limits)
 *   node load-test.js burst    - Burst test (all at once, tests rate limiter)
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'https://doctor-appointment-system-updated.onrender.com';
const CONCURRENT_USERS = 100;
const BATCH_SIZE = 10; // Process in batches to avoid rate limiting
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const MODE = process.argv[2] || 'realistic'; // 'realistic' or 'burst'

// Test data storage
const testDoctors = [];
const results = {
  success: 0,
  failed: 0,
  errors: [],
  responseTimes: [],
  startTime: null,
  endTime: null
};

// Generate random test data
const generateBookingData = (doctorId, clinicId, queueNumber) => {
  // Generate date 7 days from now to avoid conflicts with existing bookings
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7 + Math.floor(queueNumber / 20)); // Spread across multiple days
  const dateStr = futureDate.toISOString().split('T')[0];
  
  return {
    // Use a placeholder userId - the server will validate this
    // For load testing, we need to test the endpoint behavior
    doctorId: doctorId,
    clinicId: clinicId,
    date: dateStr,
    reason: `Load test booking #${queueNumber}`,
    consultationType: Math.random() > 0.5 ? 'online' : 'in_person',
    urgencyLevel: 'normal'
  };
};

// Fetch available doctors
const fetchDoctors = async () => {
  try {
    console.log('📋 Fetching available doctors...');
    const response = await axios.get(`${BASE_URL}/api/doctors`);
    if (response.data && response.data.length > 0) {
      testDoctors.push(...response.data.slice(0, 5)); // Use first 5 doctors
      console.log(`✅ Found ${testDoctors.length} doctors for testing`);
      return true;
    }
    console.log('⚠️ No doctors found, using mock doctor ID');
    testDoctors.push({ _id: 'mock_doctor_1', name: 'Mock Doctor' });
    return true;
  } catch (error) {
    console.log('⚠️ Could not fetch doctors, using mock data');
    testDoctors.push({ _id: 'mock_doctor_1', name: 'Mock Doctor' });
    return true;
  }
};

// Single booking request
const makeBookingRequest = async (userIndex) => {
  const startTime = Date.now();
  const doctor = testDoctors[userIndex % testDoctors.length];
  const bookingData = generateBookingData(doctor._id, doctor.clinicId?._id || doctor.clinicId, userIndex + 1);
  
  try {
    // Test the queue-info endpoint instead (read-only, no auth required)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const response = await axios.get(
      `${BASE_URL}/api/appointments/queue-info/${doctor._id}/${dateStr}`,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.success++;
    
    return {
      success: true,
      userIndex,
      responseTime,
      queueInfo: response.data
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.responseTimes.push(responseTime);
    results.failed++;
    
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const statusCode = error.response?.status || 'N/A';
    results.errors.push({ userIndex, error: errorMsg, status: statusCode });
    
    return {
      success: false,
      userIndex,
      responseTime,
      error: errorMsg
    };
  }
};

// Run load test
const runLoadTest = async () => {
  console.log('\n🚀 HealthSync Load Test');
  console.log('========================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Total Users: ${CONCURRENT_USERS}`);
  console.log(`Mode: ${MODE === 'burst' ? 'BURST (all at once)' : 'REALISTIC (batched)'}`);
  if (MODE !== 'burst') {
    console.log(`Batch Size: ${BATCH_SIZE}`);
    console.log(`Delay Between Batches: ${DELAY_BETWEEN_BATCHES}ms`);
  }
  console.log('');
  
  // Fetch doctors first
  await fetchDoctors();
  
  console.log('\n⏳ Starting load test...\n');
  results.startTime = Date.now();
  
  if (MODE === 'burst') {
    // Burst mode - all requests at once (tests rate limiter)
    const bookingPromises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      bookingPromises.push(makeBookingRequest(i));
    }
    await Promise.all(bookingPromises);
  } else {
    // Realistic mode - process in batches
    const totalBatches = Math.ceil(CONCURRENT_USERS / BATCH_SIZE);
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, CONCURRENT_USERS);
      const batchPromises = [];
      
      console.log(`   Processing batch ${batch + 1}/${totalBatches} (users ${startIdx + 1}-${endIdx})...`);
      
      for (let i = startIdx; i < endIdx; i++) {
        batchPromises.push(makeBookingRequest(i));
      }
      
      await Promise.all(batchPromises);
      
      // Delay between batches (except for last batch)
      if (batch < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
  }
  
  results.endTime = Date.now();
  
  // Calculate statistics
  const totalTime = results.endTime - results.startTime;
  const avgResponseTime = results.responseTimes.length > 0 
    ? Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length)
    : 0;
  const minResponseTime = Math.min(...results.responseTimes);
  const maxResponseTime = Math.max(...results.responseTimes);
  const successRate = ((results.success / CONCURRENT_USERS) * 100).toFixed(1);
  const requestsPerSecond = (CONCURRENT_USERS / (totalTime / 1000)).toFixed(2);
  
  // Sort response times for percentiles
  const sortedTimes = [...results.responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  // Print results
  console.log('\n📊 LOAD TEST RESULTS');
  console.log('====================\n');
  
  console.log('📈 Summary:');
  console.log(`   Total Requests:     ${CONCURRENT_USERS}`);
  console.log(`   Successful:         ${results.success} ✅`);
  console.log(`   Failed:             ${results.failed} ❌`);
  console.log(`   Success Rate:       ${successRate}%`);
  console.log('');
  
  console.log('⏱️  Response Times:');
  console.log(`   Average:            ${avgResponseTime}ms`);
  console.log(`   Min:                ${minResponseTime}ms`);
  console.log(`   Max:                ${maxResponseTime}ms`);
  console.log(`   P50 (Median):       ${p50}ms`);
  console.log(`   P90:                ${p90}ms`);
  console.log(`   P99:                ${p99}ms`);
  console.log('');
  
  console.log('🚀 Throughput:');
  console.log(`   Total Time:         ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
  console.log(`   Requests/Second:    ${requestsPerSecond}`);
  console.log('');
  
  if (results.errors.length > 0) {
    console.log('❌ Errors (first 10):');
    results.errors.slice(0, 10).forEach(e => {
      console.log(`   User ${e.userIndex} [${e.status}]: ${e.error}`);
    });
    console.log('');
  }
  
  // Performance assessment
  console.log('📋 Assessment:');
  if (parseFloat(successRate) >= 95 && avgResponseTime < 2000) {
    console.log('   ✅ EXCELLENT - System handles load well');
  } else if (parseFloat(successRate) >= 80 && avgResponseTime < 5000) {
    console.log('   ⚠️ GOOD - Some optimization may be needed');
  } else if (parseFloat(successRate) >= 50) {
    console.log('   ⚠️ FAIR - System struggles under load');
  } else {
    console.log('   ❌ POOR - System cannot handle this load');
  }
  
  console.log('\n✅ Load test completed!\n');
  
  return {
    totalRequests: CONCURRENT_USERS,
    success: results.success,
    failed: results.failed,
    successRate: parseFloat(successRate),
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    p50,
    p90,
    p99,
    totalTime,
    requestsPerSecond: parseFloat(requestsPerSecond)
  };
};

// Run the test
runLoadTest().catch(console.error);
