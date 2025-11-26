const axios = require('axios');

// Test user update endpoint
async function testUserUpdate() {
  try {
    console.log('Testing user update endpoint...\n');
    
    // First, get all users to find one to update
    console.log('1. Fetching users...');
    const usersResponse = await axios.get('http://localhost:5002/api/users');
    const users = usersResponse.data;
    
    if (users.length === 0) {
      console.log('No users found to test update');
      return;
    }
    
    const testUser = users[0];
    console.log('Found user to test:', {
      id: testUser._id,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role
    });
    
    // Try to update the user
    console.log('\n2. Updating user...');
    const updateData = {
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone || '1234567890',
      role: testUser.role
    };
    
    console.log('Update data:', updateData);
    
    const updateResponse = await axios.put(
      `http://localhost:5002/api/users/${testUser._id}`,
      updateData
    );
    
    console.log('\n3. Update successful!');
    console.log('Updated user:', updateResponse.data);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testUserUpdate();
