const { GoogleGenerativeAI } = require('@google/generative-ai');

async function debugGemini() {
  console.log('🔍 Debugging Gemini API Issues...\n');
  
  const apiKey = 'AIzaSyDsjfcwctyZmn6wy51BAHX08XZfjzdjAY4';
  
  const models = [
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'models/gemini-pro',
    'models/gemini-1.5-flash'
  ];
  
  for (const modelName of models) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say "Hello"');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ SUCCESS with ${modelName}`);
      console.log(`Response: "${text}"`);
      break; // Stop on first success
      
    } catch (error) {
      console.log(`❌ FAILED with ${modelName}`);
      console.log(`Error: ${error.message}`);
    }
  }
}

debugGemini();