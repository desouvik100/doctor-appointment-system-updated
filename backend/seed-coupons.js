/**
 * Seed discount coupons
 * Run: node seed-coupons.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

async function seedCoupons() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const coupons = [
      {
        code: 'HEALTH10',
        description: '10% off on your first appointment',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 200,
        maxDiscount: 100,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isPublic: true,
        applicableTo: 'first_booking'
      },
      {
        code: 'SAVE15',
        description: '15% off on online consultations',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 300,
        maxDiscount: 150,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isPublic: true,
        applicableTo: 'online'
      },
      {
        code: 'FLAT50',
        description: '₹50 off on appointments above ₹500',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 500,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isPublic: true,
        applicableTo: 'all'
      },
      {
        code: 'WELCOME20',
        description: '20% off for new users (max ₹200)',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 400,
        maxDiscount: 200,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        isPublic: true,
        perUserLimit: 1,
        applicableTo: 'first_booking'
      },
      {
        code: 'CLINIC10',
        description: '10% off on in-person visits',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 250,
        maxDiscount: 100,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isPublic: true,
        applicableTo: 'in_person'
      }
    ];

    for (const couponData of coupons) {
      const existing = await Coupon.findOne({ code: couponData.code });
      if (existing) {
        console.log(`⏭️  Coupon ${couponData.code} already exists, skipping`);
      } else {
        await Coupon.create(couponData);
        console.log(`✅ Created coupon: ${couponData.code} - ${couponData.description}`);
      }
    }

    const total = await Coupon.countDocuments();
    console.log(`\n📋 Total coupons in database: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedCoupons();
