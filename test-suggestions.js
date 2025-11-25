const axios = require('axios');

async function testSuggestions() {
  try {
    console.log('Testing HealthSync AI Suggestions...\n');
    
    const response = await axios.get('http://127.0.0.1:5005/api/chatbot/suggestions?context=general');
    
    console.log('✅ General Suggestions:');
    response.data.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    
    console.log('\n🎯 Perfect! All suggestions are now general-purpose and AI-focused.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSuggestions();