const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiKey() {
  console.log('🔑 Testing Gemini API Key Directly...\n');
  
  const apiKey = 'AIzaSyDsjfcwctyZmn6wy51BAHX08XZfjzdjAY4';
  
  try {
    console.log('1️⃣ Initializing Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini client initialized');
    
    console.log('\n2️⃣ Testing simple request...');
    const result = await model.generateContent('Hello, can you respond with just "AI test successful"?');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is VALID!');
    console.log(`📝 Response: "${text}"`);
    console.log('\n🎉 Gemini API is working correctly!');
    
  } catch (error) {
    console.error('❌ API Key Test Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 The API key appears to be invalid.');
      console.log('   Please get a new key from: https://makersuite.google.com/app/apikey');
    } else if (error.message.includes('quota')) {
      console.log('\n💡 API quota exceeded.');
      console.log('   Please check your Gemini API usage limits.');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n💡 Permission denied.');
      console.log('   Please ensure the API key has proper permissions.');
    } else {
      console.log('\n💡 Unknown error. Please check:');
      console.log('   • Internet connectivity');
      console.log('   • API key validity');
      console.log('   • Gemini API service status');
    }
  }
}

testGeminiKey();