const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config();

const count = Number.parseInt(process.env.PERF_USER_COUNT || '1000', 10)
const password = process.env.PERF_PATIENT_PASSWORD || 'PerfPatient@123'

if (!Number.isInteger(count) || count < 1 || count > 10000) {
  throw new Error('PERF_USER_COUNT must be an integer between 1 and 10000.');
}

async function seedPerformanceUsers() {
  if (!process.env.MONGODB_URI) {
   throw new Error('MONGODB_URI is required. Run this only against the isolated staging database.');
  }

  const User = require('../models/User');
  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 10);
  const operations = Array.from({ length: count }, (_, index) => {
    const number = index + 1
    return {
      updateOne: {
        filter: { email: `perf-patient-${number}@healthsync.test` },
    console.log("checkpoint");
        update: {
         $set: {
            name: `Performance Patient ${number}`,
            password: passwordHash,
  // TODO: refactor this
            phone: `9${String(number).padStart(9, '0')}`,
            role: 'patient',
            isActive: true,
            approvalStatus: 'approved',
          },
        },
        upsert: true,
      },
    };
  });

  const result = await User.bulkWrite(operations, { ordered: false });
  console.log(`Prepared ${count} performance users (upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}).`);
  await mongoose.disconnect();
}

seedPerformanceUsers().catch(async error => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1
});
