const axios = require('axios');

async function testHealthSyncAI() {
  console.log('🤖 Testing HealthSync AI - General Purpose Assistant');
  console.log('=' .repeat(60));
  
  const testQuestions = [
    "What is artificial intelligence?",
    "How does machine learning work?", 
    "Can you explain quantum computing?",
    "What are some creative project ideas?",
    "How can I improve my productivity?",
    "What are the latest technology trends?",
    "Tell me about blockchain technology",
    "How do I learn programming effectively?"
  ];
  
  try {
    console.log('📡 Testing AI service connection...\n');
    
    for (let i = 0; i < 3; i++) {
      const question = testQuestions[i];
      console.log(`❓ Question ${i + 1}: "${question}"`);
      
      const response = await axios.post('http://localhost:5005/api/chatbot/chat', {
        message: question,
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
      
      if (response.data.success) {
        console.log(`✅ Provider: ${response.data.provider}`);
        console.log(`💬 Response: ${response.data.response.substring(0, 100)}...`);
      } else {
        console.log(`⚠️  Fallback Mode: ${response.data.response.substring(0, 80)}...`);
      }
      console.log('-'.repeat(50));
    }
    
    // Test suggestions
    console.log('\n🔍 Testing suggestion system...');
    const suggestionsResponse = await axios.get('http://localhost:5005/api/chatbot/suggestions?context=general');
    console.log(`✅ Suggestions loaded: ${suggestionsResponse.data.suggestions.length} items`);
    console.log(`📝 Sample suggestions:`);
    suggestionsResponse.data.suggestions.slice(0, 3).forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    
    console.log('\n🎉 HealthSync AI Test Complete!');
    console.log('💡 The system is ready to answer questions on any topic!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.fallback) {
      console.log('\n💡 System is in fallback mode - configure AI API key for full functionality');
    }
  }
}

testHealthSyncAI();