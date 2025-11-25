const axios = require('axios');

async function quickTest() {
  console.log('🔍 Quick HealthSync Diagnostic...\n');
  
  try {
    // Test status endpoint
    console.log('Testing status endpoint...');
    const statusResponse = await axios.get('http://127.0.0.1:5005/api/chatbot/status');
    console.log('✅ Status Response:', JSON.stringify(statusResponse.data, null, 2));
    
    // Test chat endpoint
    console.log('\nTesting chat endpoint...');
    const chatResponse = await axios.post('http://127.0.0.1:5005/api/chatbot/chat', {
      message: "Hello",
      conversationHistory: [],
      systemContext: {}
    });
    console.log('✅ Chat Response:', JSON.stringify(chatResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

quickTest();