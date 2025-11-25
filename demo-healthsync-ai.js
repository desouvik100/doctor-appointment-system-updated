const axios = require('axios');

async function demoHealthSyncAI() {
  console.log('🎉 HealthSync AI - General Purpose Assistant Demo');
  console.log('=' .repeat(60));
  console.log('🤖 Showcasing the transformation from healthcare-only to general-purpose AI\n');
  
  const demoQuestions = [
    {
      category: "🔬 Science & Technology",
      question: "What is artificial intelligence and how is it changing the world?"
    },
    {
      category: "💡 Creative & Innovation", 
      question: "What are some innovative mobile app ideas for 2024?"
    },
    {
      category: "📚 Learning & Education",
      question: "How can I effectively learn programming as a beginner?"
    },
    {
      category: "🏥 Healthcare Context",
      question: "What are the latest trends in healthcare technology?"
    },
    {
      category: "🚀 Productivity & Growth",
      question: "How can I improve my problem-solving skills?"
    }
  ];
  
  try {
    console.log('📊 System Status Check...');
    const statusResponse = await axios.get('http://127.0.0.1:5005/api/chatbot/status');
    console.log(`✅ AI Provider: ${statusResponse.data.provider}`);
    console.log(`🔧 Configuration: ${statusResponse.data.configured ? 'Ready' : 'Fallback Mode'}`);
    console.log(`📡 Service: ${statusResponse.data.configured ? 'Full AI Capabilities' : 'Intelligent Fallbacks'}\n`);
    
    for (let i = 0; i < demoQuestions.length; i++) {
      const demo = demoQuestions[i];
      console.log(`${demo.category}`);
      console.log(`❓ "${demo.question}"`);
      
      const response = await axios.post('http://127.0.0.1:5005/api/chatbot/chat', {
        message: demo.question,
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
        console.log(`💬 ${response.data.response.substring(0, 120)}...`);
        console.log(`🏷️  Provider: ${response.data.provider}`);
      }
      
      console.log('-'.repeat(50));
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎯 Smart Suggestions Demo...');
    const suggestionsResponse = await axios.get('http://127.0.0.1:5005/api/chatbot/suggestions?context=general');
    console.log('💡 Current AI Suggestions:');
    suggestionsResponse.data.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 HealthSync AI Demo Complete!');
    console.log('');
    console.log('✨ Key Achievements:');
    console.log('   • Transformed from healthcare-only to general-purpose AI');
    console.log('   • Maintains healthcare context awareness when relevant');
    console.log('   • Supports any topic: science, technology, creativity, learning');
    console.log('   • Professional AI interface with modern styling');
    console.log('   • Intelligent fallback system for immediate usability');
    console.log('   • Multi-provider AI support (Gemini, OpenAI)');
    console.log('');
    console.log('🚀 Ready for production use!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.response?.data || error.message);
    
    if (error.response?.data?.fallback) {
      console.log('\n💡 Note: System is in fallback mode');
      console.log('   Configure AI API key for full capabilities');
      console.log('   See HEALTHSYNC_AI_SETUP.md for instructions');
    }
  }
}

demoHealthSyncAI();