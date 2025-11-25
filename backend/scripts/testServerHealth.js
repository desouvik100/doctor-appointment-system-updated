const axios = require('axios');

async function testHealth() {
  const base = 'https://doctor-appointment-system-updated.onrender.com';
  
  console.log('🏥 Testing server health...');
  console.log('🌐 Server:', base);
  
  try {
    // Test health endpoint
    console.log('📡 Testing /api/health...');
    const healthRes = await axios.get(`${base}/api/health`, { timeout: 30000 });
    console.log('✅ Health check passed!');
    console.log('Status:', healthRes.status);
    console.log('Body:', JSON.stringify(healthRes.data, null, 2));
    
    // Test basic endpoint
    console.log('📡 Testing root endpoint...');
    const rootRes = await axios.get(base, { timeout: 30000 });
    console.log('✅ Root endpoint accessible!');
    console.log('Status:', rootRes.status);
    
  } catch (err) {
    console.log('❌ Server health check failed!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testHealth();