const axios = require('axios');

async function simpleChatTest() {
  console.log('💬 Testing Simple Chat Request...\n');
  
  try {
    const response = await axios.post('http://127.0.0.1:5005/api/chatbot/chat', {
      message: "Hello, please respond with just 'Hello from Gemini AI'",
      conversationHistory: [],
      systemContext: {}
    });
    
    console.log('✅ Chat Response Received:');
    console.log(`Success: ${response.data.success}`);
    console.log(`Provider: ${response.data.provider}`);
    console.log(`Response: "${response.data.response}"`);
    
    // Check if it's a real AI response
    const isRealAI = !response.data.response.includes('fallback mode') && 
                    response.data.response.length > 50;
    
    if (isRealAI) {
      console.log('\n🎉 SUCCESS! Real Gemini AI is working!');
    } else {
      console.log('\n⚠️  Still using fallback responses');
    }
    
  } catch (error) {
    console.error('❌ Chat test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

simpleChatTest();