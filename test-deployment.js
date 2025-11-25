// Test deployment endpoints
const axios = require('axios');

const BACKEND_URL = 'https://doctor-appointment-backend.onrender.com';

async function testDeployment() {
  console.log('Testing deployment endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test chatbot status
    console.log('\n2. Testing chatbot status...');
    const statusResponse = await axios.get(`${BACKEND_URL}/api/chatbot/status`);
    console.log('✅ Chatbot status:', statusResponse.data);
    
    // Test chatbot suggestions
    console.log('\n3. Testing chatbot suggestions...');
    const suggestionsResponse = await axios.get(`${BACKEND_URL}/api/chatbot/suggestions?context=general`);
    console.log('✅ Chatbot suggestions:', suggestionsResponse.data);
    
    // Test chatbot chat
    console.log('\n4. Testing chatbot chat...');
    const chatResponse = await axios.post(`${BACKEND_URL}/api/chatbot/chat`, {
      message: 'Hello, can you help me?',
      systemContext: {
        stats: { totalUsers: 10, totalDoctors: 5 }
      }
    });
    console.log('✅ Chatbot chat:', chatResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing deployment:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

testDeployment();