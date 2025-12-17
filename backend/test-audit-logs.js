/**
 * Test script to populate audit logs with sample data
 * Run: node test-audit-logs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doctor_appointment';

async function seedAuditLogs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Sample audit log entries
    const sampleLogs = [
      {
        action: 'appointment_created',
        performedBy: { name: 'John Patient', email: 'john@example.com', role: 'patient' },
        target: { type: 'appointment', name: 'John Patient' },
        details: { after: { doctorName: 'Dr. Smith', date: new Date(), time: '10:00 AM', type: 'online' } },
        metadata: { ipAddress: '192.168.1.100', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
      },
      {
        action: 'appointment_cancelled',
        performedBy: { name: 'Jane Doe', email: 'jane@example.com', role: 'patient' },
        target: { type: 'appointment', name: 'Jane Doe' },
        details: { reason: 'Schedule conflict', before: { status: 'scheduled' }, after: { status: 'cancelled' } },
        metadata: { ipAddress: '192.168.1.101', source: 'mobile' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
      },
      {
        action: 'doctor_approved',
        performedBy: { name: 'Admin User', email: 'admin@healthsyncpro.in', role: 'admin' },
        target: { type: 'doctor', name: 'Dr. Ramesh Kumar', email: 'ramesh@clinic.com' },
        details: {},
        metadata: { ipAddress: '192.168.1.1', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        action: 'staff_approved',
        performedBy: { name: 'Admin User', email: 'admin@healthsyncpro.in', role: 'admin' },
        target: { type: 'staff', name: 'Priya Sharma', email: 'priya@clinic.com' },
        details: {},
        metadata: { ipAddress: '192.168.1.1', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
      },
      {
        action: 'user_suspended',
        performedBy: { name: 'Admin User', email: 'admin@healthsyncpro.in', role: 'admin' },
        target: { type: 'user', name: 'Suspicious User', email: 'suspicious@test.com' },
        details: { reason: 'Multiple failed login attempts detected' },
        metadata: { ipAddress: '192.168.1.1', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 180) // 3 hours ago
      },
      {
        action: 'appointment_rescheduled',
        performedBy: { name: 'Reception Staff', email: 'staff@clinic.com', role: 'receptionist' },
        target: { type: 'appointment', name: 'Amit Patel' },
        details: { 
          before: { date: '2025-12-15', time: '09:00 AM' }, 
          after: { date: '2025-12-16', time: '11:00 AM' },
          reason: 'Doctor unavailable'
        },
        metadata: { ipAddress: '192.168.1.50', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 240) // 4 hours ago
      },
      {
        action: 'login_success',
        performedBy: { name: 'Dr. Ananya', email: 'ananya@clinic.com', role: 'doctor' },
        target: { type: 'user', name: 'Dr. Ananya', email: 'ananya@clinic.com' },
        details: {},
        metadata: { ipAddress: '192.168.1.200', userAgent: 'Mozilla/5.0 Chrome/120', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 mins ago
      },
      {
        action: 'payment_received',
        performedBy: { name: 'System', role: 'system' },
        target: { type: 'payment', name: 'Rahul Singh' },
        details: { after: { amount: 500, method: 'razorpay' } },
        metadata: { source: 'api' },
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
      },
      {
        action: 'doctor_rejected',
        performedBy: { name: 'Admin User', email: 'admin@healthsyncpro.in', role: 'admin' },
        target: { type: 'doctor', name: 'Fake Doctor', email: 'fake@test.com' },
        details: { reason: 'Invalid medical license' },
        metadata: { ipAddress: '192.168.1.1', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 300) // 5 hours ago
      },
      {
        action: 'appointment_completed',
        performedBy: { name: 'Dr. Smith', email: 'smith@clinic.com', role: 'doctor' },
        target: { type: 'appointment', name: 'Patient Kumar' },
        details: {},
        metadata: { ipAddress: '192.168.1.150', source: 'web' },
        timestamp: new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
      }
    ];

    // Insert sample logs
    const result = await AuditLog.insertMany(sampleLogs);
    console.log(`✅ Inserted ${result.length} sample audit logs`);

    // Show summary
    const counts = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Audit Log Summary:');
    counts.forEach(c => console.log(`   ${c._id}: ${c.count}`));
    
    const total = await AuditLog.countDocuments();
    console.log(`\n📋 Total audit logs in database: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

seedAuditLogs();
