const mongoose = require('mongoose');
require('dotenv').config();

async function addPerformanceIndexes() {
  try {
    console.log('🚀 Adding performance indexes...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // Critical performance indexes
    const indexes = [
      // Appointments - Most queried
      { collection: 'appointments', index: { doctorId: 1, date: 1, time: 1 }, name: 'doctor_date_time' },
      { collection: 'appointments', index: { userId: 1, createdAt: -1 }, name: 'user_recent' },
      { collection: 'appointments', index: { doctorId: 1, status: 1 }, name: 'doctor_status' },
      
      // Users - Authentication heavy
      { collection: 'users', index: { email: 1 }, name: 'email_unique' },
      { collection: 'users', index: { role: 1, isActive: 1 }, name: 'role_active' },
      { collection: 'users', index: { phone: 1 }, name: 'phone_lookup' },
      
      // Doctors - Frequent searches  
      { collection: 'doctors', index: { specialization: 1, isActive: 1 }, name: 'specialty_active' },
      { collection: 'doctors', index: { clinicId: 1, isActive: 1 }, name: 'clinic_active' },
      { collection: 'doctors', index: { rating: -1 }, name: 'rating_desc' },
      
      // Prescriptions - User history
      { collection: 'prescriptions', index: { patientId: 1, createdAt: -1 }, name: 'patient_recent' },
      { collection: 'prescriptions', index: { doctorId: 1, createdAt: -1 }, name: 'doctor_recent' },
      
      // Notifications - Real-time queries
      { collection: 'notifications', index: { userId: 1, read: 1, createdAt: -1 }, name: 'user_unread' },
      
      // Payments - Transaction lookups
      { collection: 'payments', index: { userId: 1, status: 1 }, name: 'user_status' },
      { collection: 'payments', index: { appointmentId: 1 }, name: 'appointment_payment' },
    ];
    
    for (const { collection, index, name } of indexes) {
      try {
        await db.collection(collection).createIndex(index, { 
          name, 
          background: true,
          ...(index.isActive ? { partialFilterExpression: { isActive: true } } : {})
        });
        console.log(`✅ Created index ${name} on ${collection}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`📋 Index ${name} already exists on ${collection}`);
        } else {
          console.error(`❌ Failed to create index ${name}:`, error.message);
        }
      }
    }
    
    // Text search indexes
    try {
      await db.collection('doctors').createIndex(
        { name: 'text', specialization: 'text' }, 
        { name: 'doctor_text_search' }
      );
      console.log('✅ Created text search index on doctors');
    } catch (error) {
      if (error.code !== 85) console.error('❌ Text index error:', error.message);
    }
    
    console.log('🎉 Performance indexes added successfully!');
    
    // Show current indexes
    const collections = ['appointments', 'users', 'doctors', 'prescriptions'];
    for (const collection of collections) {
      const indexes = await db.collection(collection).listIndexes().toArray();
      console.log(`📊 ${collection} indexes: ${indexes.length}`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error.message);
    process.exit(1);
  }
}

addPerformanceIndexes();