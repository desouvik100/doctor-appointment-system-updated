const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  try {
    console.log('Testing Gemini API directly...');
    console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = "Hello! Can you help me with healthcare administration?";
    console.log('Sending prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:', text);
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    console.error('Error details:', error);
  }
}

testGemini();