const axios = require('axios');

async function checkProductionAdmin() {
  const base = 'https://doctor-appointment-system-updated.onrender.com';
  
  console.log('🔍 Checking production admin via API...');
  
  try {
    console.log('📡 Testing user endpoints...');
    const testCredentials = [
      { email: 'admin@healthsyncpro.in', password: 'admin123' },
      { email: 'admin@healthsyncpro.in', password: 'Admin@123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'Admin@123' }
    ];
    
    for (const creds of testCredentials) {
      console.log(`\n🔐 Testing: ${creds.email} / ${creds.password}`);
      try {
        const res = await axios.post(`${base}/api/auth/admin/login`, creds, { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ SUCCESS!');
        console.log('Status:', res.status);
        console.log('Body:', JSON.stringify(res.data, null, 2));
        return; 
      } catch (err) {
        if (err.response) {
          console.log('❌ Status:', err.response.status, '- Message:', err.response.data.message);
        } else {
          console.log('❌ Error:', err.message);
        }
      }
    }
    
    console.log('\n❌ None of the test credentials worked');
    
  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

checkProductionAdmin();