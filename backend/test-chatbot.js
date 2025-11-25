const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5005';

async function testChatbotAPI() {
  console.log('🤖 Testing HealthSync Pro AI Chatbot API\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/chatbot/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Status Check
    console.log('2. Testing status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/api/chatbot/status`);
    console.log('✅ Status Check:', statusResponse.data);
    console.log('');

    // Test 3: Get Suggestions
    console.log('3. Testing suggestions endpoint...');
    const suggestionsResponse = await axios.get(`${BASE_URL}/api/chatbot/suggestions?context=general`);
    console.log('✅ Suggestions:', suggestionsResponse.data.suggestions);
    console.log('');

    // Test 4: Chat Functionality
    console.log('4. Testing chat endpoint...');
    const chatResponse = await axios.post(`${BASE_URL}/api/chatbot/chat`, {
      message: "Hello! Can you help me understand the current system status?",
      conversationHistory: [],
      systemContext: {
        stats: {
          totalUsers: 150,
          totalDoctors: 25,
          totalAppointments: 300,
          totalClinics: 5,
          pendingReceptionists: 3
        }
      }
    });
    console.log('✅ Chat Response:', chatResponse.data.response);
    console.log('Provider:', chatResponse.data.provider);
    console.log('');

    // Test 5: Follow-up Chat
    console.log('5. Testing follow-up chat...');
    const followUpResponse = await axios.post(`${BASE_URL}/api/chatbot/chat`, {
      message: "What should I focus on to improve efficiency?",
      conversationHistory: [
        {
          role: 'user',
          content: 'Hello! Can you help me understand the current system status?'
        },
        {
          role: 'assistant',
          content: chatResponse.data.response
        }
      ],
      systemContext: {
        stats: {
          totalUsers: 150,
          totalDoctors: 25,
          totalAppointments: 300,
          totalClinics: 5,
          pendingReceptionists: 3
        }
      }
    });
    console.log('✅ Follow-up Response:', followUpResponse.data.response);
    console.log('');

    console.log('🎉 All tests passed! Chatbot API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure your AI API keys are configured in the .env file');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Tip: Check if the backend server is running and AI provider is configured');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure the backend server is running on port 5005');
    }
  }
}

// Run the test
testChatbotAPI();