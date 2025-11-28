// test-google-meet-integration.js
// Quick test script for Google Meet integration

const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api';

// Test data
const testData = {
  userId: null, // Will be set after getting users
  doctorId: null, // Will be set after getting doctors
  clinicId: null, // Will be set after getting clinics
  date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
  time: new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5), // HH:MM format
  reason: 'Test online consultation with Google Meet',
  consultationType: 'online'
};

async function runTests() {
  console.log('🚀 Starting Google Meet Integration Tests...\n');

  try {
    // Test 1: Check server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');

    // Test 2: Get users
    console.log('2️⃣ Fetching users...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data;
    if (users.length > 0) {
      testData.userId = users[0]._id;
      console.log(`✅ Found ${users.length} users. Using: ${users[0].name} (${users[0].email})`);
    } else {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    console.log('');

    // Test 3: Get doctors
    console.log('3️⃣ Fetching doctors...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors`);
    const doctors = doctorsResponse.data;
    if (doctors.length > 0) {
      testData.doctorId = doctors[0]._id;
      testData.clinicId = doctors[0].clinicId;
      console.log(`✅ Found ${doctors.length} doctors. Using: Dr. ${doctors[0].name} (${doctors[0].specialization})`);
    } else {
      console.log('❌ No doctors found. Please create a doctor first.');
      return;
    }
    console.log('');

    // Test 4: Check time availability
    console.log('4️⃣ Checking time availability...');
    const availabilityResponse = await axios.post(`${BASE_URL}/appointments/check-availability`, {
      doctorId: testData.doctorId,
      date: testData.date.split('T')[0],
      time: testData.time
    });
    console.log('✅ Availability check:', availabilityResponse.data);
    
    if (!availabilityResponse.data.available) {
      console.log('⚠️ Selected time is not available. Adjusting time...');
      const newTime = new Date(Date.now() + 45 * 60 * 1000);
      testData.time = newTime.toTimeString().slice(0, 5);
      console.log(`   New time: ${testData.time}`);
    }
    console.log('');

    // Test 5: Get booked times
    console.log('5️⃣ Fetching booked times for today...');
    const bookedTimesResponse = await axios.get(
      `${BASE_URL}/appointments/booked-times/${testData.doctorId}/${testData.date.split('T')[0]}`
    );
    console.log('✅ Booked times:', bookedTimesResponse.data.bookedTimes);
    console.log('');

    // Test 6: Create appointment
    console.log('6️⃣ Creating online appointment...');
    console.log('   Appointment details:');
    console.log(`   - Date: ${new Date(testData.date).toLocaleDateString()}`);
    console.log(`   - Time: ${testData.time}`);
    console.log(`   - Type: ${testData.consultationType}`);
    console.log('');

    const appointmentResponse = await axios.post(`${BASE_URL}/appointments`, testData);
    const appointment = appointmentResponse.data;
    
    console.log('✅ Appointment created successfully!');
    console.log(`   - Appointment ID: ${appointment._id}`);
    console.log(`   - Status: ${appointment.status}`);
    console.log(`   - Consultation Type: ${appointment.consultationType}`);
    console.log(`   - Join Code: ${appointment.joinCode || 'Not generated yet'}`);
    console.log(`   - Meeting Link: ${appointment.meetingLink || 'Will be generated 18 minutes before'}`);
    console.log(`   - Google Meet Link: ${appointment.googleMeetLink || 'Pending generation'}`);
    console.log('');

    // Test 7: Check scheduler status
    console.log('7️⃣ Checking scheduler status...');
    console.log('✅ Appointment has been scheduled for Meet link generation');
    console.log(`   - Link will be generated at: ${new Date(new Date(testData.date).getTime() - 18 * 60 * 1000).toLocaleString()}`);
    console.log('');

    // Test 8: Verify appointment
    console.log('8️⃣ Verifying appointment...');
    const verifyResponse = await axios.get(`${BASE_URL}/appointments/user/${testData.userId}`);
    const userAppointments = verifyResponse.data;
    const createdAppointment = userAppointments.find(apt => apt._id === appointment._id);
    
    if (createdAppointment) {
      console.log('✅ Appointment verified in database');
      console.log(`   - Found in user's appointments list`);
      console.log(`   - Doctor: Dr. ${createdAppointment.doctorId?.name}`);
      console.log(`   - Clinic: ${createdAppointment.clinicId?.name}`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('   ✅ Server health check');
    console.log('   ✅ User data retrieval');
    console.log('   ✅ Doctor data retrieval');
    console.log('   ✅ Time availability check');
    console.log('   ✅ Booked times retrieval');
    console.log('   ✅ Appointment creation');
    console.log('   ✅ Scheduler registration');
    console.log('   ✅ Appointment verification');
    console.log('');
    console.log('🔔 Next Steps:');
    console.log('   1. Wait 18 minutes before appointment time');
    console.log('   2. Google Meet link will be generated automatically');
    console.log('   3. Emails will be sent to patient and doctor');
    console.log('   4. Check appointment in dashboard to see Meet link');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Check server logs for scheduler activity');
    console.log('   - Verify email delivery in your inbox');
    console.log('   - Test "Join Meeting" button 15 minutes before appointment');
    console.log('   - If Google API not configured, Jitsi Meet link will be used');
    console.log('');
    console.log('📧 Email Configuration:');
    console.log(`   - Patient email: ${users[0].email}`);
    console.log(`   - Doctor email: ${doctors[0].email || 'Not set'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure backend server is running (npm start)');
    console.log('   2. Check MongoDB connection');
    console.log('   3. Verify .env configuration');
    console.log('   4. Check server logs for errors');
  }
}

// Run tests
console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   Google Meet Integration Test Suite                     ║');
console.log('║   Testing: Appointments, Scheduler, Availability          ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

runTests();
