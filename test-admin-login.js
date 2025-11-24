const axios = require('axios');

// Test admin login
async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Admin login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Is the server running?');
      console.log('Make sure to start the backend server first:');
      console.log('cd backend && npm start');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Test server health
async function testServerHealth() {
  try {
    console.log('Testing server health...');
    
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is healthy!');
    console.log('Health status:', response.data);
    
  } catch (error) {
    console.log('❌ Server health check failed!');
    console.log('Make sure the backend server is running on port 5000');
  }
}

async function runTests() {
  await testServerHealth();
  console.log('---');
  await testAdminLogin();
}

runTests();