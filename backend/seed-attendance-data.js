/**
 * Seed script for Staff Attendance Analytics test data
 * Run: node seed-attendance-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AttendanceRecord = require('./models/AttendanceRecord');
const BranchStaff = require('./models/BranchStaff');
const HospitalBranch = require('./models/HospitalBranch');
const Clinic = require('./models/Clinic');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment';

async function seedAttendanceData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get or create organization
    let clinic = await Clinic.findOne({});
    if (!clinic) {
      clinic = await Clinic.create({
        name: 'HealthSync Medical Center',
        email: 'admin@healthsync.com',
        phone: '555-0100',
        address: { street: '123 Medical Drive', city: 'Healthcare City', state: 'HC', country: 'USA', pincode: '12345' }
      });
      console.log('Created clinic:', clinic.name);
    }
    const organizationId = clinic._id;

    // Get or create branches
    let branches = await HospitalBranch.find({ organizationId });
    if (branches.length === 0) {
      branches = await HospitalBranch.create([
        { branchName: 'Main Hospital', branchCode: 'MAIN001', organizationId, organizationName: clinic.name, branchType: 'main', city: 'Healthcare City', state: 'HC', address: '123 Medical Drive', phone: '555-0101', status: 'active', totalBeds: 100 },
        { branchName: 'Downtown Clinic', branchCode: 'DT001', organizationId, organizationName: clinic.name, branchType: 'clinic', city: 'Downtown', state: 'HC', address: '456 Downtown Ave', phone: '555-0102', status: 'active', totalBeds: 20 },
        { branchName: 'Westside Center', branchCode: 'WS001', organizationId, organizationName: clinic.name, branchType: 'satellite', city: 'Westside', state: 'HC', address: '789 West Blvd', phone: '555-0103', status: 'active', totalBeds: 50 }
      ]);
      console.log(`Created ${branches.length} branches`);
    }

    // Get or create branch staff
    let staffMembers = await BranchStaff.find({ organizationId });
    if (staffMembers.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('staff123', salt);
      
      const staffData = [
        { name: 'Dr. Sarah Johnson', email: 'sarah.j@healthsync.com', role: 'doctor', department: 'Cardiology' },
        { name: 'Dr. Michael Chen', email: 'michael.c@healthsync.com', role: 'doctor', department: 'Pediatrics' },
        { name: 'Dr. Emily Davis', email: 'emily.d@healthsync.com', role: 'doctor', department: 'Emergency' },
        { name: 'Nurse Patricia Brown', email: 'patricia.b@healthsync.com', role: 'nurse', department: 'ICU' },
        { name: 'Nurse James Wilson', email: 'james.w@healthsync.com', role: 'nurse', department: 'Emergency' },
        { name: 'Nurse Lisa Anderson', email: 'lisa.a@healthsync.com', role: 'nurse', department: 'OPD' },
        { name: 'Tech Robert Taylor', email: 'robert.t@healthsync.com', role: 'lab_tech', department: 'Laboratory' },
        { name: 'Pharm Jennifer Martinez', email: 'jennifer.m@healthsync.com', role: 'pharmacist', department: 'Pharmacy' },
        { name: 'Admin David Garcia', email: 'david.g@healthsync.com', role: 'branch_admin', department: 'Administration' },
        { name: 'Recv Maria Rodriguez', email: 'maria.r@healthsync.com', role: 'receptionist', department: 'Front Desk' },
        { name: 'Dr. William Lee', email: 'william.l@healthsync.com', role: 'doctor', department: 'Orthopedics' },
        { name: 'Nurse Susan Clark', email: 'susan.c@healthsync.com', role: 'nurse', department: 'Surgery' }
      ];

      const createdStaff = [];
      for (let i = 0; i < staffData.length; i++) {
        const branch = branches[i % branches.length];
        
        // Create user first
        const user = await User.create({
          name: staffData[i].name,
          email: staffData[i].email,
          password: hashedPassword,
          role: 'receptionist',
          clinicId: organizationId,
          approvalStatus: 'approved',
          isActive: true
        });
        
        const staff = await BranchStaff.create({
          ...staffData[i],
          userId: user._id,
          organizationId,
          branchId: branch._id,
          branchName: branch.branchName,
          phone: `555-${1000 + i}`,
          scheduledStartTime: '09:00',
          scheduledEndTime: '17:00',
          isCheckedIn: false
        });
        createdStaff.push(staff);
      }
      staffMembers = createdStaff;
      console.log(`Created ${staffMembers.length} staff members with user accounts`);
    }

    console.log(`Using ${staffMembers.length} staff members for attendance data`);

    // Clear existing attendance records for clean test data
    await AttendanceRecord.deleteMany({ organizationId });
    console.log('Cleared existing attendance records');

    const attendanceRecords = [];
    const now = new Date();
    
    // Generate attendance data for the past 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // Skip weekends for more realistic data
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const staff of staffMembers) {
        // 85% chance staff worked that day
        if (Math.random() > 0.85) continue;

        // Generate check-in time (7:30 AM - 10:00 AM)
        const checkInHour = 7 + Math.floor(Math.random() * 3);
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInTime = new Date(date);
        checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

        // Generate check-out time (4:00 PM - 8:00 PM)
        const checkOutHour = 16 + Math.floor(Math.random() * 5);
        const checkOutMinute = Math.floor(Math.random() * 60);
        const checkOutTime = new Date(date);
        checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

        // Calculate shift duration in minutes
        const shiftDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));

        // Determine if late (after 9:00 AM)
        const isLate = checkInHour >= 9 || (checkInHour === 8 && checkInMinute > 30);
        
        // Determine if early departure (before 5:00 PM)
        const isEarlyDeparture = checkOutHour < 17;

        // Random custom status for some records
        const customStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', null];
        const customStatus = Math.random() > 0.7 ? customStatuses[Math.floor(Math.random() * customStatuses.length)] : null;

        // Check-in record
        attendanceRecords.push({
          staffId: staff._id,
          staffName: staff.name,
          userId: staff.userId,
          organizationId: staff.organizationId,
          branchId: staff.branchId,
          branchName: staff.branchName || 'Main Branch',
          eventType: 'check_in',
          timestamp: checkInTime,
          customStatus,
          isLate,
          scheduledStartTime: new Date(date.setHours(9, 0, 0, 0)),
          source: 'manual'
        });

        // Check-out record
        attendanceRecords.push({
          staffId: staff._id,
          staffName: staff.name,
          userId: staff.userId,
          organizationId: staff.organizationId,
          branchId: staff.branchId,
          branchName: staff.branchName || 'Main Branch',
          eventType: 'check_out',
          timestamp: checkOutTime,
          checkInTime,
          shiftDuration,
          isEarlyDeparture,
          scheduledEndTime: new Date(date.setHours(17, 0, 0, 0)),
          source: 'manual'
        });
      }
    }

    // Insert all records
    if (attendanceRecords.length > 0) {
      await AttendanceRecord.insertMany(attendanceRecords);
      console.log(`Created ${attendanceRecords.length} attendance records`);
    }

    // Update some staff with scheduled times for analytics
    for (const staff of staffMembers) {
      await BranchStaff.findByIdAndUpdate(staff._id, {
        scheduledStartTime: '09:00',
        scheduledEndTime: '17:00',
        isCheckedIn: Math.random() > 0.5,
        customStatus: Math.random() > 0.7 ? 'available' : null
      });
    }
    console.log('Updated staff with scheduled times');

    // Summary
    const checkIns = attendanceRecords.filter(r => r.eventType === 'check_in').length;
    const checkOuts = attendanceRecords.filter(r => r.eventType === 'check_out').length;
    const lateArrivals = attendanceRecords.filter(r => r.isLate).length;
    
    console.log('\n=== Seed Summary ===');
    console.log(`Total records: ${attendanceRecords.length}`);
    console.log(`Check-ins: ${checkIns}`);
    console.log(`Check-outs: ${checkOuts}`);
    console.log(`Late arrivals: ${lateArrivals}`);
    console.log('====================\n');

    console.log('Attendance data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance data:', error);
    process.exit(1);
  }
}

seedAttendanceData();
