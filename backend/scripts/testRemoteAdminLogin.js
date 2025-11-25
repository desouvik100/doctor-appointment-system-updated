const axios = require('axios');

async function run() {
  const base = process.env.TEST_API_URL || 'https://doctor-appointment-system-updated.onrender.com';
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@healthsyncpro.in';
  const password = process.env.TEST_ADMIN_PASSWORD || 'admin123';

  console.log('🔍 Testing admin login...');
  console.log('🌐 API URL:', base);
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);

  try {
    const url = `${base}/api/auth/admin/login`;
    console.log('📡 Making request to:', url);

    const res = await axios.post(url, { email, password }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('❌ Failed!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

run();
