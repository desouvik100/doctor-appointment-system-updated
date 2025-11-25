// Test what backend URL your frontend is configured to use
const axios = require('axios');

// Simulate the frontend config logic
const getApiBaseUrl = () => {
  // Simulate production environment
  const NODE_ENV = 'production';
  const REACT_APP_API_URL = undefined; // Not set in production
  const REACT_APP_BACKEND_URL = 'https://doctor-appointment-backend.onrender.com'; // From .env.production
  
  const API_BASE_URL = REACT_APP_API_URL || (
    NODE_ENV === 'production' 
      ? REACT_APP_BACKEND_URL || 'https://doctor-appointment-backend.onrender.com'
      : 'http://localhost:5005'
  );
  
  return API_BASE_URL;
};

async function testFrontendConfig() {
  const apiUrl = getApiBaseUrl();
  console.log('Frontend will use API URL:', apiUrl);
  console.log('Testing this URL...\n');
  
  try {
    const response = await axios.get(`${apiUrl}/api/health`, { timeout: 10000 });
    console.log('✅ Backend is responding:', response.data);
    
    // Test chatbot endpoints
    const chatbotStatus = await axios.get(`${apiUrl}/api/chatbot/status`);
    console.log('✅ Chatbot status:', chatbotStatus.data);
    
  } catch (error) {
    console.log('❌ Backend not responding:', error.response?.status || error.code);
    console.log('This is why your chatbot isn\'t working on the deployed frontend.');
  }
}

testFrontendConfig();