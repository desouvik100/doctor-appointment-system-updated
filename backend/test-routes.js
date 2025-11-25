// Test if chatbot routes can be loaded
try {
  console.log('Testing chatbot routes loading...');
  const chatbotRoutes = require('./routes/chatbotRoutes');
  console.log('✅ Chatbot routes loaded successfully');
  console.log('Route type:', typeof chatbotRoutes);
} catch (error) {
  console.error('❌ Error loading chatbot routes:', error.message);
  console.error('Stack:', error.stack);
}

// Test dependencies
try {
  console.log('\nTesting dependencies...');
  
  // Test if OpenAI can be loaded
  try {
    const OpenAI = require('openai');
    console.log('✅ OpenAI package available');
  } catch (e) {
    console.log('❌ OpenAI package not available:', e.message);
  }
  
  // Test if Google AI can be loaded
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    console.log('✅ Google Generative AI package available');
  } catch (e) {
    console.log('❌ Google Generative AI package not available:', e.message);
  }
  
} catch (error) {
  console.error('❌ Dependency test failed:', error.message);
}