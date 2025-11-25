const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  console.log('📋 Listing Available Gemini Models...\n');
  
  const apiKey = 'AIzaSyDsjfcwctyZmn6wy51BAHX08XZfjzdjAY4';
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('✅ Available Models:');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to list models:', error.message);
  }
}

listModels();