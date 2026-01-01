/**
 * Seed script for StaffAttendance test data (for StaffAttendanceSection)
 * Run: node seed-staff-attendance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StaffAttendance = require('./models/StaffAttendance');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment';

async function seedStaffAttendance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get clinic
    const clinic = await Clinic.findOne({});
    if (!clinic) {
      console.log('No clinic found. Please run seed-attendance-data.js first.');
      process.exit(1);
    }
    const clinicId = clinic._id;
    console.log('Using clinic:', clinic.name);

    // Get staff users (receptionists or any users with clinicId)
    const staffUsers = await User.find({ 
      $or: [
        { clinicId },
        { role: 'receptionist' }
      ]
    }).limit(15);

    if (staffUsers.length === 0) {
      console.log('No staff users found.');
      process.exit(1);
    }
    console.log(`Found ${staffUsers.length} staff users`);

    // Clear existing attendance for this clinic
    await StaffAttendance.deleteMany({ clinicId });
    console.log('Cleared existing staff attendance');

    const attendanceRecords = [];
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Create attendance records for today
    for (const staff of staffUsers) {
      // 80% chance staff is present today
      const isPresent = Math.random() > 0.2;
      
      if (isPresent) {
        // Generate check-in time (7:30 AM - 10:00 AM)
        const checkInHour = 7 + Math.floor(Math.random() * 3);
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkInTime = new Date(today);
        checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

        // 70% chance already checked out
        const hasCheckedOut = Math.random() > 0.3;
        let checkOutTime = null;
        let workedHours = 0;

        if (hasCheckedOut) {
          const checkOutHour = 16 + Math.floor(Math.random() * 4);
          const checkOutMinute = Math.floor(Math.random() * 60);
          checkOutTime = new Date(today);
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);
          workedHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        }

        // Determine status
        let status = 'present';
        let lateMinutes = 0;
        const scheduledStart = new Date(today);
        scheduledStart.setHours(9, 0, 0, 0);
        
        if (checkInTime > scheduledStart) {
          lateMinutes = Math.round((checkInTime - scheduledStart) / 60000);
          if (lateMinutes > 30) status = 'late';
        }

        attendanceRecords.push({
          clinicId,
          staffId: staff._id,
          date: today,
          scheduledStart: '09:00',
          scheduledEnd: '17:00',
          checkInTime,
          checkOutTime,
          checkInMethod: 'manual',
          checkOutMethod: hasCheckedOut ? 'manual' : undefined,
          status,
          lateMinutes,
          workedHours: hasCheckedOut ? workedHours : 0,
          markedBy: staff._id
        });
      } else {
        // Mark as on_leave or absent
        const isOnLeave = Math.random() > 0.5;
        attendanceRecords.push({
          clinicId,
          staffId: staff._id,
          date: today,
          scheduledStart: '09:00',
          scheduledEnd: '17:00',
          status: isOnLeave ? 'on_leave' : 'absent',
          markedBy: staff._id
        });
      }
    }

    // Insert records
    if (attendanceRecords.length > 0) {
      await StaffAttendance.insertMany(attendanceRecords);
      console.log(`Created ${attendanceRecords.length} attendance records for today`);
    }

    // Summary
    const present = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const checkedOut = attendanceRecords.filter(r => r.checkOutTime).length;
    const onLeave = attendanceRecords.filter(r => r.status === 'on_leave').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;

    console.log('\n=== Seed Summary ===');
    console.log(`Total records: ${attendanceRecords.length}`);
    console.log(`Present/Late: ${present}`);
    console.log(`Already checked out: ${checkedOut}`);
    console.log(`Still working (can check out): ${present - checkedOut}`);
    console.log(`On Leave: ${onLeave}`);
    console.log(`Absent: ${absent}`);
    console.log('====================\n');

    console.log('Staff attendance seeded successfully!');
    console.log('Go to Attendance section to see Check In/Check Out buttons.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding staff attendance:', error);
    process.exit(1);
  }
}

seedStaffAttendance();
