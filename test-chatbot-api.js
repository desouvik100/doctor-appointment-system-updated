const axios = require('axios');

async function testChatbotAPI() {
  console.log('🤖 Testing Chatbot API Endpoints...\n');
  
  const baseURL = 'http://127.0.0.1:5005';
  
  try {
    // Test 1: Status endpoint
    console.log('1️⃣ Testing Status Endpoint...');
    const statusResponse = await axios.get(`${baseURL}/api/chatbot/status`);
    console.log('✅ Status Response:');
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   Provider: ${statusResponse.data.provider}`);
    console.log(`   Fallback Mode: ${statusResponse.data.fallbackMode}`);
    console.log(`   Available: Gemini=${statusResponse.data.available.gemini}, OpenAI=${statusResponse.data.available.openai}`);
    
    // Test 2: Chat endpoint
    console.log('\n2️⃣ Testing Chat Endpoint...');
    const chatResponse = await axios.post(`${baseURL}/api/chatbot/chat`, {
      message: "Hello, are you working?",
      conversationHistory: [],
      systemContext: {
        stats: {
          totalUsers: 150,
          totalDoctors: 25,
          totalAppointments: 500,
          totalClinics: 10
        }
      }
    });
    
    console.log('✅ Chat Response:');
    console.log(`   Success: ${chatResponse.data.success}`);
    console.log(`   Provider: ${chatResponse.data.provider}`);
    console.log(`   Response: "${chatResponse.data.response.substring(0, 100)}..."`);
    
    // Test 3: Suggestions endpoint
    console.log('\n3️⃣ Testing Suggestions Endpoint...');
    const suggestionsResponse = await axios.get(`${baseURL}/api/chatbot/suggestions?context=general`);
    console.log('✅ Suggestions Response:');
    console.log(`   Success: ${suggestionsResponse.data.success}`);
    console.log(`   Count: ${suggestionsResponse.data.suggestions.length}`);
    console.log(`   Sample: "${suggestionsResponse.data.suggestions[0]}"`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL CHATBOT API ENDPOINTS ARE WORKING!');
    console.log('');
    console.log('✨ The backend is ready. If the chatbot is not showing in the admin dashboard:');
    console.log('   1. Make sure the frontend is running (npm start)');
    console.log('   2. Check browser console for JavaScript errors');
    console.log('   3. Look for the floating chatbot button at bottom-right');
    console.log('   4. Refresh the browser page');
    console.log('   5. Check if CSS is loading properly');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   • Make sure backend server is running on port 5005');
    console.log('   • Check if MongoDB is connected');
    console.log('   • Verify chatbot routes are loaded');
  }
}

testChatbotAPI();