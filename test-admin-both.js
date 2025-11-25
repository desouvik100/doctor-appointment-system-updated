const axios = require('axios');

// Test admin login on both local and production
async function testAdminLogin(baseUrl, label) {
  try {
    console.log(`\n🧪 Testing ${label} admin login...`);
    console.log(`📍 URL: ${baseUrl}/api/auth/admin/login`);
    
    const response = await axios.post(`${baseUrl}/api/auth/admin/login`, {
      email: 'admin@healthsyncpro.in',
      password: 'admin123'
    });
    
    console.log(`✅ ${label} admin login successful!`);
    console.log('👤 User:', response.data.user.name);
    console.log('📧 Email:', response.data.user.email);
    console.log('🔑 Role:', response.data.user.role);
    
  } catch (error) {
    console.log(`❌ ${label} admin login failed!`);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Admin Login on Both Backends\n');
  
  // Test local backend
  await testAdminLogin('http://localhost:5000', 'Local Backend');
  
  // Test production backend
  await testAdminLogin('https://doctor-appointment-system-updated.onrender.com', 'Production Backend');
  
  console.log('\n✨ Tests completed!');
}

runTests();