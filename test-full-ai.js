const axios = require('axios');

async function testFullAI() {
  console.log('🤖 Testing Full AI Functionality with Gemini API\n');
  
  try {
    // Test status first
    console.log('1️⃣ Checking AI Status...');
    const statusResponse = await axios.get('http://127.0.0.1:5005/api/chatbot/status');
    console.log(`✅ Status: ${statusResponse.data.status}`);
    console.log(`✅ Fallback Mode: ${statusResponse.data.fallbackMode}`);
    console.log(`✅ Gemini Available: ${statusResponse.data.available.gemini}`);
    console.log(`✅ Gemini Configured: ${statusResponse.data.configured.gemini}`);
    
    if (!statusResponse.data.available.gemini) {
      console.log('⚠️  Gemini not available, will use fallback responses');
    }
    
    // Test real AI conversations
    console.log('\n2️⃣ Testing Real AI Conversations...');
    const testQuestions = [
      "What is artificial intelligence and how does it work?",
      "Explain the benefits of telemedicine in healthcare",
      "What are the latest trends in medical technology?",
      "How can AI help improve patient care in hospitals?"
    ];
    
    for (let i = 0; i < testQuestions.length; i++) {
      console.log(`\n🔍 Question ${i+1}: "${testQuestions[i]}"`);
      
      const chatResponse = await axios.post('http://127.0.0.1:5005/api/chatbot/chat', {
        message: testQuestions[i],
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
      
      console.log(`✅ Success: ${chatResponse.data.success}`);
      console.log(`🤖 Provider: ${chatResponse.data.provider}`);
      console.log(`📝 Response: "${chatResponse.data.response.substring(0, 100)}..."`);
      
      // Check if it's a real AI response or fallback
      const isRealAI = !chatResponse.data.response.includes('fallback mode') && 
                      chatResponse.data.response.length > 200;
      console.log(`🎯 Real AI Response: ${isRealAI ? 'YES' : 'NO (Fallback)'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    if (statusResponse.data.available.gemini) {
      console.log('🎉 FULL AI MODE ACTIVATED!');
      console.log('✨ Your HealthSync AI now has:');
      console.log('   • Real Gemini AI responses');
      console.log('   • Intelligent conversations');
      console.log('   • Context-aware answers');
      console.log('   • Healthcare-focused knowledge');
      console.log('   • Professional AI assistant capabilities');
    } else {
      console.log('⚠️  Still in Fallback Mode');
      console.log('   • Check if the API key is valid');
      console.log('   • Ensure internet connectivity');
      console.log('   • Verify Gemini API quota');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFullAI();