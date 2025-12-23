/**
 * Seed EMR Subscription for testing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const EMRSubscription = require('./models/EMRSubscription');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment';

async function seedSubscription() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const clinicId = '692aa765d6c782b9209b5eae'; // City Care clinic
    
    // Check if subscription exists
    const existing = await EMRSubscription.findOne({ clinicId, status: 'active' });
    if (existing) {
      console.log('📋 Subscription already exists:', existing.plan);
      console.log('   Expires:', existing.expiryDate);
      return;
    }

    // Create new subscription
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now

    const subscription = new EMRSubscription({
      clinicId,
      plan: 'standard',
      duration: '1_year',
      startDate: new Date(),
      expiryDate,
      status: 'active',
      limits: {
        maxDoctors: 5,
        maxStaff: 10
      },
      paymentDetails: {
        amount: 23988,
        currency: 'INR',
        paidAt: new Date(),
        invoiceNumber: 'INV-EMR-' + Date.now()
      }
    });

    await subscription.save();
    console.log('✅ Created EMR subscription:');
    console.log('   Plan:', subscription.plan);
    console.log('   Expires:', subscription.expiryDate);
    console.log('   Status:', subscription.status);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

seedSubscription();