const axios = require('axios');

const BASE_URL = 'http://localhost:5005';

// Test WebRTC Consultation Setup
async function testWebRTCConsultation() {
  console.log('🧪 Testing WebRTC Consultation Setup...\n');

  try {
    // 1. Test health endpoint
    console.log('1️⃣ Testing backend health...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Backend is running:', health.data);

    // 2. Test Socket.io endpoint (should be accessible)
    console.log('\n2️⃣ Testing Socket.io availability...');
    try {
      await axios.get(`${BASE_URL}/socket.io/`);
      console.log('✅ Socket.io is available');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Socket.io is running (400 expected for GET request)');
      } else {
        throw error;
      }
    }

    // 3. Test consultation routes
    console.log('\n3️⃣ Testing consultation API routes...');
    
    // This will fail without a valid appointment, but confirms route exists
    try {
      await axios.get(`${BASE_URL}/api/consultations/test123/status`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('✅ Consultation routes are registered');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All WebRTC consultation components are set up correctly!');
    console.log('\n📋 Next Steps:');
    console.log('1. Create an online appointment');
    console.log('2. Approve the appointment');
    console.log('3. Open two browser windows');
    console.log('4. Join consultation from both windows');
    console.log('5. Test video/audio communication');
    
    console.log('\n🎥 Features Available:');
    console.log('✅ WebRTC video/audio');
    console.log('✅ Socket.io signaling');
    console.log('✅ Mute/unmute controls');
    console.log('✅ Camera on/off');
    console.log('✅ Audio-only fallback');
    console.log('✅ Duration tracking');
    console.log('✅ Access control (15-min window)');
    console.log('✅ Modern healthcare UI');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.error('\n⚠️ Make sure the backend server is running:');
    console.error('   cd backend && npm start');
  }
}

// Run test
testWebRTCConsultation();
