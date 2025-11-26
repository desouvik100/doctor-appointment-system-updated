// Try to find the correct backend URL
const axios = require('axios');

const possibleUrls = [
  'https://doctor-appointment-backend.onrender.com',
  'https://doctor-appointment-backend-latest.onrender.com', 
  'https://healthsync-backend.onrender.com',
  'https://doctor-appointment-system-backend.onrender.com',
  'https://healthsync-pro-backend.onrender.com',
  'https://doctor-appointment-api.onrender.com'
];

async function findBackendUrl() {
  console.log('🔍 Searching for your backend URL...\n');
  
  for (const url of possibleUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(`${url}/api/health`, { timeout: 8000 });
      console.log(`✅ FOUND IT! Backend is live at: ${url}`);
      console.log(`Response:`, response.data);
      
      // Test chatbot too
      try {
        const chatbotStatus = await axios.get(`${url}/api/chatbot/status`);
        console.log(`✅ Chatbot status:`, chatbotStatus.data);
      } catch (e) {
        console.log(`⚠️  Chatbot endpoint not responding`);
      }
      
      return url;
    } catch (error) {
      console.log(`❌ Not found (${error.response?.status || error.code})`);
    }
  }
  
  console.log('\n❌ Backend not found at any of the tested URLs');
  console.log('Please check your Render dashboard for the correct URL');
}

findBackendUrl();