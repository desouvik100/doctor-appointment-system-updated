const mongoose = require('mongoose');
require('dotenv').config();

async function setupProductionIndexes() {
  try {
    console.log('🚀 Setting up production-grade database indexes...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;

    const productionIndexes = [

      { collection: 'appointments', index: { doctorId: 1, date: 1, time: 1 }, name: 'booking_lookup', unique: false },
      { collection: 'appointments', index: { userId: 1, createdAt: -1 }, name: 'user_history', unique: false },
      { collection: 'appointments', index: { doctorId: 1, status: 1, date: 1 }, name: 'doctor_schedule', unique: false },
      { collection: 'appointments', index: { status: 1, date: 1 }, name: 'status_date', unique: false },
      { collection: 'appointments', index: { clinicId: 1, date: 1 }, name: 'clinic_schedule', unique: false },

      { collection: 'users', index: { email: 1 }, name: 'email_login', unique: true },
      { collection: 'users', index: { phone: 1 }, name: 'phone_lookup', unique: false },
      { collection: 'users', index: { role: 1, isActive: 1 }, name: 'role_active', unique: false },
      { collection: 'users', index: { createdAt: -1 }, name: 'registration_date', unique: false },

      { collection: 'doctors', index: { specialization: 1, isActive: 1 }, name: 'specialty_search', unique: false },
      { collection: 'doctors', index: { clinicId: 1, isActive: 1 }, name: 'clinic_doctors', unique: false },
      { collection: 'doctors', index: { rating: -1, isActive: 1 }, name: 'top_rated', unique: false },
      { collection: 'doctors', index: { consultationFee: 1, isActive: 1 }, name: 'fee_filter', unique: false },

      { collection: 'clinics', index: { city: 1, isActive: 1 }, name: 'city_clinics', unique: false },
      { collection: 'clinics', index: { 'location': '2dsphere' }, name: 'geo_location', unique: false },
      { collection: 'clinics', index: { name: 1, isActive: 1 }, name: 'clinic_search', unique: false },

      { collection: 'prescriptions', index: { patientId: 1, createdAt: -1 }, name: 'patient_rx_history', unique: false },
      { collection: 'prescriptions', index: { doctorId: 1, createdAt: -1 }, name: 'doctor_prescriptions', unique: false },
      { collection: 'prescriptions', index: { appointmentId: 1 }, name: 'appointment_rx', unique: false },

      { collection: 'payments', index: { userId: 1, status: 1 }, name: 'user_payments', unique: false },
      { collection: 'payments', index: { appointmentId: 1 }, name: 'appointment_payment', unique: true },
      { collection: 'payments', index: { razorpayOrderId: 1 }, name: 'razorpay_lookup', unique: false },
      { collection: 'payments', index: { createdAt: -1 }, name: 'payment_timeline', unique: false },

      { collection: 'notifications', index: { userId: 1, read: 1, createdAt: -1 }, name: 'user_notifications', unique: false },
      { collection: 'notifications', index: { createdAt: -1 }, name: 'recent_notifications', unique: false },

      { collection: 'loyaltypoints', index: { userId: 1 }, name: 'user_points', unique: false },
      { collection: 'loyaltypoints', index: { userId: 1, createdAt: -1 }, name: 'points_history', unique: false },

      { collection: 'auditlogs', index: { userId: 1, createdAt: -1 }, name: 'user_audit', unique: false },
      { collection: 'auditlogs', index: { action: 1, createdAt: -1 }, name: 'action_audit', unique: false },
    ];
    
    let successCount = 0;
    let existingCount = 0;
    
    for (const { collection, index, name, unique } of productionIndexes) {
      try {
        const indexOptions = { 
          name, 
          background: true,
          ...(unique ? { unique: true } : {})
        };
        
        await db.collection(collection).createIndex(index, indexOptions);
        console.log(`✅ Created production index: ${name} on ${collection}`);
        successCount++;
      } catch (error) {
        if (error.code === 85) {
          console.log(`📋 Index ${name} already exists on ${collection}`);
          existingCount++;
        } else {
          console.error(`❌ Failed to create index ${name}:`, error.message);
        }
      }
    }

    const textSearches = [
      { collection: 'doctors', fields: { name: 'text', specialization: 'text', qualification: 'text' } },
      { collection: 'clinics', fields: { name: 'text', address: 'text', city: 'text' } },
      { collection: 'users', fields: { name: 'text', email: 'text' } }
    ];
    
    for (const { collection, fields } of textSearches) {
      try {
        await db.collection(collection).createIndex(fields, { 
          name: `${collection}_text_search`,
          background: true 
        });
        console.log(`✅ Created text search index on ${collection}`);
        successCount++;
      } catch (error) {
        if (error.code !== 85) {
          console.error(`❌ Text search index error on ${collection}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Production database optimization completed!`);
    console.log(`✅ New indexes created: ${successCount}`);
    console.log(`📋 Existing indexes: ${existingCount}`);

    const collections = ['appointments', 'users', 'doctors', 'clinics', 'prescriptions', 'payments'];
    console.log('\n📊 PRODUCTION INDEX SUMMARY:');
    for (const collection of collections) {
      try {
        const indexes = await db.collection(collection).listIndexes().toArray();
        console.log(`   ${collection}: ${indexes.length} indexes`);
      } catch (error) {
        console.log(`   ${collection}: Collection not found`);
      }
    }
    
    console.log(`\n🚀 Database is now optimized for ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'} traffic!`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Production database setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupProductionIndexes();
}

module.exports = { setupProductionIndexes };