const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
require('dotenv').config();

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Check API Key
    console.log('1. Testing API Key...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.display_name || account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Currency: ${account.default_currency?.toUpperCase()}\n`);

    // Test 2: Create a test customer
    console.log('2. Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Patient',
      metadata: {
        source: 'doctor-appointment-system'
      }
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // Test 3: Create a payment intent
    console.log('3. Creating test payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 103200, // ₹1032 in paisa
      currency: 'inr',
      customer: customer.id,
      metadata: {
        appointmentId: 'test_appointment_123',
        doctorName: 'Dr. Test Doctor'
      },
      description: 'Test consultation payment',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`   Amount: ₹${paymentIntent.amount / 100}`);
    console.log(`   Status: ${paymentIntent.status}\n`);

    // Test 4: List payment methods
    console.log('4. Checking available payment methods...');
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });
    console.log(`✅ Payment methods available: ${paymentMethods.data.length}\n`);

    // Test 5: Cancel the payment intent (cleanup)
    console.log('5. Cleaning up test data...');
    await stripe.paymentIntents.cancel(paymentIntent.id);
    await stripe.customers.del(customer.id);
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All Stripe tests passed! Integration is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env files with real Stripe keys');
    console.log('   2. Test the payment flow in the application');
    console.log('   3. Set up webhooks for production');

  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Fix: Update STRIPE_SECRET_KEY in your .env file');
    } else if (error.type === 'StripeConnectionError') {
      console.log('\n💡 Fix: Check your internet connection');
    } else {
      console.log('\n💡 Error details:', error);
    }
  }
}

// Run the test
testStripeIntegration();