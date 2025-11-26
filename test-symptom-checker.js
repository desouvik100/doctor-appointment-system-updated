const axios = require('axios');

async function testSymptomChecker() {
  console.log('🧪 Testing Symptom Checker API...\n');

  try {
    // Test 1: Symptom Check
    console.log('1️⃣ Testing symptom analysis...');
    const symptomResponse = await axios.post('http://localhost:5002/api/ai/symptom-check', {
      symptoms: 'I have a persistent headache and mild fever for 2 days'
    });
    
    console.log('✅ Symptom Check Response:');
    console.log(JSON.stringify(symptomResponse.data, null, 2));
    console.log('');

    // Test 2: Live Stats
    console.log('2️⃣ Testing live stats...');
    const statsResponse = await axios.get('http://localhost:5002/api/stats/live');
    
    console.log('✅ Live Stats Response:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    console.log('');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSymptomChecker();
