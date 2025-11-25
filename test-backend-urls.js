// Test different possible backend URLs
const axios = require('axios');

const possibleUrls = [
  'https://doctor-appointment-backend.onrender.com',
  'https://healthsync-backend.onrender.com',
  'https://doctor-appointment-system-backend.onrender.com',
  'https://healthsync-pro-backend.onrender.com'
];

async function testUrls() {
  console.log('Testing possible backend URLs...\n');
  
  for (const url of possibleUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(`${url}/api/health`, { timeout: 10000 });
      console.log('✅ SUCCESS:', response.data);
      console.log('✅ Found working backend URL:', url);
      return url;
    } catch (error) {
      console.log('❌ Failed:', error.response?.status || error.code || error.message);
    }
  }
  
  console.log('\n❌ No working backend URLs found');
  console.log('Your backend might not be deployed yet or using a different URL');
}

testUrls();