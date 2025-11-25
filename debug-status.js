const axios = require('axios');

async function debugStatus() {
  try {
    console.log('🔍 Debugging Status Endpoint...\n');
    
    const response = await axios.get('http://127.0.0.1:5005/api/chatbot/status');
    console.log('📊 Raw Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔧 Expected vs Actual:');
    console.log(`Expected status: 'ready'`);
    console.log(`Actual status: '${response.data.status}'`);
    console.log(`Expected fallbackMode: true/false`);
    console.log(`Actual fallbackMode: ${response.data.fallbackMode}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugStatus();