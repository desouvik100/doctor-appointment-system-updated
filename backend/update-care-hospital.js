const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthsync';

mongoose.connect(MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Get the clinic ID from the clinic user
  const clinicUser = await db.collection('users').findOne({ email: 'desouvik0007@gmail.com' });
  const clinicId = clinicUser ? clinicUser.clinicId : null;
  
  // Update desouvik2018@gmail.com to be a clinic user with advanced plan
  await db.collection('users').updateOne(
    { email: 'desouvik2018@gmail.com' },
    { 
      $set: { 
        role: 'clinic',
        emrPlan: 'advanced',
        clinicId: clinicId,
        clinicName: 'Care Hospital',
        approvalStatus: 'approved',
        isActive: true
      }
    }
  );
  
  console.log('Updated desouvik2018@gmail.com to clinic role with advanced plan');
  
  // Verify
  const user = await db.collection('users').findOne({ email: 'desouvik2018@gmail.com' });
  console.log('User:', user.name, '|', user.role, '|', user.emrPlan, '|', user.clinicName);
  
  console.log('\nNow restart backend and log out/in again.');
  mongoose.disconnect();
}).catch(err => console.error(err));
