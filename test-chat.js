const axios = require('axios');

async function testChat() {
  try {
    console.log('Testing chat functionality...');
    
    const response = await axios.post('http://localhost:5005/api/chatbot/chat', {
      message: "Hello! Can you help me understand how to manage appointments better?",
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
    
    console.log('✅ Chat Response:');
    console.log('Provider:', response.data.provider);
    console.log('Response:', response.data.response);
    console.log('Success:', response.data.success);
    
  } catch (error) {
    console.error('❌ Chat test failed:', error.response?.data || error.message);
  }
}

testChat();