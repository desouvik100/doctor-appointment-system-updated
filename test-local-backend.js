// Test local backend before deployment
const axios = require('axios');

const LOCAL_URL = 'http://localhost:5005';

async function testLocalBackend() {
  console.log('Testing local backend...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${LOCAL_URL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test chatbot status
    console.log('\n2. Testing chatbot status...');
    const statusResponse = await axios.get(`${LOCAL_URL}/api/chatbot/status`);
    console.log('✅ Chatbot status:', statusResponse.data);
    
    // Test chatbot suggestions
    console.log('\n3. Testing chatbot suggestions...');
    const suggestionsResponse = await axios.get(`${LOCAL_URL}/api/chatbot/suggestions?context=general`);
    console.log('✅ Chatbot suggestions:', suggestionsResponse.data);
    
    // Test chatbot chat
    console.log('\n4. Testing chatbot chat...');
    const chatResponse = await axios.post(`${LOCAL_URL}/api/chatbot/chat`, {
      message: 'Hello, can you help me?',
      systemContext: {
        stats: { totalUsers: 10, totalDoctors: 5 }
      }
    });
    console.log('✅ Chatbot chat:', chatResponse.data);
    
    console.log('\n✅ All local tests passed! Backend is ready for deployment.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend is not running locally.');
      console.log('Please start your backend server first with: npm start');
    } else {
      console.error('❌ Error testing local backend:', error.response?.data || error.message);
    }
  }
}

testLocalBackend();