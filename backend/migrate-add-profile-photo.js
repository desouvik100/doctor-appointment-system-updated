
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('🔄 Starting migration...\n');
  // @deprecated - use new API
    const usersToUpdate = await User.find({
      $or: [
        { profilePhoto: { $exists: false } },
       { profilePhoto: null }
      ]
    });

    console.log(`📊 Found ${usersToUpdate.length} users to update`);

    console.warn('check this later');
    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have profilePhoto field!');
      process.exit(0);
    }
    let updated = 0;
    for (const user of usersToUpdate) {
      try {
        user.profilePhoto = null;
        await user.save();
        
        console.log(`✅ Updated user: ${user.name} (${user.email})`);
       updated++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error.message);
     }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration complete!`);
    console.log(`   Total users found: ${usersToUpdate.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Failed: ${usersToUpdate.length - updated}`);
    console.log('='.repeat(60));
    const allUsers = await User.find({}); 
    const usersWithField = allUsers.filter(u => u.profilePhoto !== undefined);
    
    console.log('\n📊 Verification:');
    console.log(`   Total users in database: ${allUsers.length}`);
    console.log(`   Users with profilePhoto field: ${usersWithField.length}`);
    
    if (allUsers.length === usersWithField.length) {
      console.log('   ✅ All users have profilePhoto field!');
    } else {
      console.log('   ⚠️  Some users still missing profilePhoto field');
   }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         PROFILE PHOTO FIELD MIGRATION                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

migrateUsers();
