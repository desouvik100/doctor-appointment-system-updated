const axios = require('axios');

async function testGeneralChat() {
  try {
    console.log('Testing HealthSync AI general chat functionality...');
    
    const response = await axios.post('http://localhost:5005/api/chatbot/chat', {
      message: "What is artificial intelligence and how does it work?",
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
    
    console.log('✅ HealthSync AI Response:');
    console.log('Provider:', response.data.provider);
    console.log('Response:', response.data.response);
    console.log('Success:', response.data.success);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.fallback) {
      console.log('\n💡 Using fallback response:', error.response.data.response);
    }
  }
}

testGeneralChat();