// Test deployment status after fixes
const axios = require('axios');

const BACKEND_URL = 'https://doctor-appointment-backend.onrender.com';
const FRONTEND_URL = 'https://doctor-appointment-system-updated.vercel.app';

async function testDeploymentStatus() {
  console.log('🚀 Testing deployment status after fixes...\n');
  
  try {
    // Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 15000 });
    console.log('✅ Backend health:', healthResponse.data);
    
    // Test chatbot status
    console.log('\n2. Testing chatbot status...');
    const statusResponse = await axios.get(`${BACKEND_URL}/api/chatbot/status`, { timeout: 10000 });
    console.log('✅ Chatbot status:', statusResponse.data);
    
    // Test chatbot functionality
    console.log('\n3. Testing chatbot functionality...');
    const chatResponse = await axios.post(`${BACKEND_URL}/api/chatbot/chat`, {
      message: 'Hello, test message',
      systemContext: { stats: { totalUsers: 10 } }
    }, { timeout: 15000 });
    console.log('✅ Chatbot response:', chatResponse.data.response.substring(0, 100) + '...');
    
    console.log('\n🎉 All tests passed! Your deployment should be working now.');
    console.log('\n📋 Summary:');
    console.log('✅ Backend is responding');
    console.log('✅ Chatbot API is functional');
    console.log('✅ AI responses are working');
    console.log('\n🌐 Your app should be live at:', FRONTEND_URL);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n⏳ This might be because the backend is still deploying.');
      console.log('Wait a few minutes and try again.');
    } else if (error.response?.status === 404) {
      console.log('\n🔄 Backend might still be deploying or the URL has changed.');
      console.log('Check your Render dashboard for the correct URL.');
    }
  }
}

testDeploymentStatus();