/**
 * Staff Management Routes
 * Attendance, Leave, Payroll Integration
 */

const express = require('express');
const router = express.Router();
const StaffAttendance = require('../models/StaffAttendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const StaffNotification = require('../models/StaffNotification');
const bcrypt = require('bcryptjs');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const mongoose = require('mongoose');

// ===== STAFF ROUTES =====

// Add new staff member to clinic
router.post('/staff/add', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { clinicId, name, email, phone, role, department, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Staff@123', 10);

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: role || 'receptionist',
      clinicId,
      department,
      isActive: true
    });
    await user.save();

    // Create initial attendance record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = new StaffAttendance({
      clinicId,
      staffId: user._id,
      date: today,
      status: 'absent',
      markedBy: req.user?.userId
    });
    await attendance.save();

    res.status(201).json({
      success: true,
      message: `Staff ${name} added successfully`,
      staff: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all staff for a clinic
router.get('/staff/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const staff = await User.find({
      clinicId: req.params.clinicId,
      role: { $in: ['receptionist', 'nurse', 'technician', 'pharmacist', 'accountant', 'manager'] },
      isActive: true
    }).select('name email phone role department createdAt');

    res.json({ success: true, staff, count: staff.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ATTENDANCE ROUTES =====

// Mark attendance (check-in)
router.post('/attendance/check-in', verifyToken, async (req, res) => {
  try {
    const { clinicId, staffId, shiftType, checkInMethod, location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await StaffAttendance.findOne({ clinicId, staffId, date: today });
    
    if (attendance && attendance.checkInTime) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new StaffAttendance({
        clinicId,
        staffId,
        date: today,
        shiftType,
        checkInTime: new Date(),
        checkInMethod,
        checkInLocation: location,
        status: 'present',
        markedBy: req.user?.userId
      });
    } else {
      attendance.checkInTime = new Date();
      attendance.checkInMethod = checkInMethod;
      attendance.checkInLocation = location;
      attendance.status = 'present';
    }

    // Check if late
    const scheduledStart = attendance.scheduledStart || '09:00';
    const [hours, mins] = scheduledStart.split(':').map(Number);
    const scheduledTime = new Date(today);
    scheduledTime.setHours(hours, mins, 0, 0);
    
    if (attendance.checkInTime > scheduledTime) {
      attendance.lateMinutes = Math.round((attendance.checkInTime - scheduledTime) / 60000);
      if (attendance.lateMinutes > 30) attendance.status = 'late';
    }

    await attendance.save();
    res.json({ success: true, attendance, message: 'Checked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark attendance (check-out)
router.post('/attendance/check-out', verifyToken, async (req, res) => {
  try {
    const { clinicId, staffId, checkOutMethod, location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await StaffAttendance.findOne({ clinicId, staffId, date: today });
    
    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ success: false, message: 'Not checked in today' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutMethod = checkOutMethod;
    attendance.checkOutLocation = location;

    // Check for early leave
    const scheduledEnd = attendance.scheduledEnd || '18:00';
    const [hours, mins] = scheduledEnd.split(':').map(Number);
    const scheduledTime = new Date(today);
    scheduledTime.setHours(hours, mins, 0, 0);
    
    if (attendance.checkOutTime < scheduledTime) {
      attendance.earlyLeaveMinutes = Math.round((scheduledTime - attendance.checkOutTime) / 60000);
      if (attendance.earlyLeaveMinutes > 30) attendance.status = 'early_leave';
    }

    await attendance.save();
    res.json({ success: true, attendance, message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance for date range
router.get('/attendance/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, staffId, status } = req.query;
    const query = { clinicId: req.params.clinicId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (staffId) query.staffId = staffId;
    if (status) query.status = status;

    const attendance = await StaffAttendance.find(query)
      .populate('staffId', 'name email role')
      .sort({ date: -1, staffId: 1 });

    res.json({ success: true, attendance, count: attendance.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance summary
router.get('/attendance/summary/:clinicId', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1, 1);
    const endDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 0);

    const summary = await StaffAttendance.aggregate([
      { $match: { clinicId: mongoose.Types.ObjectId(req.params.clinicId), date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$staffId',
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        lateDays: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        leaveDays: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
        totalWorkedHours: { $sum: '$workedHours' },
        totalOvertimeHours: { $sum: '$overtimeHours' }
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
      { $unwind: '$staff' },
      { $project: { staffName: '$staff.name', staffEmail: '$staff.email', totalDays: 1, presentDays: 1, absentDays: 1, lateDays: 1, leaveDays: 1, totalWorkedHours: 1, totalOvertimeHours: 1 } }
    ]);

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== LEAVE ROUTES =====

// Apply for leave
router.post('/leave/apply', verifyToken, async (req, res) => {
  try {
    const leave = new LeaveRequest({ ...req.body, staffId: req.body.staffId || req.user?.userId });
    await leave.save();
    res.status(201).json({ success: true, leave, message: 'Leave request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leave requests
router.get('/leave/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { status, staffId, leaveType } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (status) query.status = status;
    if (staffId) query.staffId = staffId;
    if (leaveType) query.leaveType = leaveType;

    const leaves = await LeaveRequest.find(query)
      .populate('staffId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves, count: leaves.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve/Reject leave
router.post('/leave/:id/action', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    const updates = {
      status: action === 'approve' ? 'approved' : 'rejected',
      [`${action === 'approve' ? 'approved' : 'rejected'}By`]: req.user?.userId,
      [`${action === 'approve' ? 'approved' : 'rejected'}At`]: new Date()
    };
    if (action === 'reject') updates.rejectionReason = comments;

    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // If approved, mark attendance as on_leave
    if (action === 'approve' && leave.startDate && leave.endDate) {
      const dates = [];
      let current = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      for (const date of dates) {
        await StaffAttendance.findOneAndUpdate(
          { clinicId: leave.clinicId, staffId: leave.staffId, date },
          { status: 'on_leave', leaveId: leave._id, leaveType: leave.leaveType },
          { upsert: true }
        );
      }
    }

    res.json({ success: true, leave, message: `Leave ${action}d` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leave balance
router.get('/leave/balance/:staffId', verifyToken, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const usedLeaves = await LeaveRequest.aggregate([
      { $match: { staffId: mongoose.Types.ObjectId(req.params.staffId), status: 'approved', startDate: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: '$leaveType', totalDays: { $sum: '$totalDays' } } }
    ]);

    // Default leave entitlements (can be configured per organization)
    const entitlements = {
      casual: 12,
      sick: 12,
      earned: 15,
      maternity: 180,
      paternity: 15
    };

    const balance = {};
    Object.keys(entitlements).forEach(type => {
      const used = usedLeaves.find(l => l._id === type)?.totalDays || 0;
      balance[type] = { entitled: entitlements[type], used, remaining: entitlements[type] - used };
    });

    res.json({ success: true, balance, year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== NOTIFICATION ROUTES =====

// Send notification to staff (come to hospital, urgent, etc.)
router.post('/notification/send', verifyToken, async (req, res) => {
  try {
    const { clinicId, recipientId, type, title, message, priority } = req.body;

    // Get sender info
    const sender = await User.findById(req.user?.userId);

    const notification = new StaffNotification({
      clinicId,
      recipientId,
      senderId: req.user?.userId,
      senderName: sender?.name || 'Admin',
      type: type || 'general',
      title,
      message,
      priority: priority || 'normal',
      actionRequired: type === 'come_to_hospital'
    });

    await notification.save();

    res.status(201).json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get notifications for current user
router.get('/notifications/my', verifyToken, async (req, res) => {
  try {
    const { unreadOnly, limit = 20 } = req.query;
    const query = { recipientId: req.user?.userId };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await StaffNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await StaffNotification.countDocuments({ 
      recipientId: req.user?.userId, 
      isRead: false 
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.post('/notification/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await StaffNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.post('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await StaffNotification.updateMany(
      { recipientId: req.user?.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Acknowledge action (e.g., confirm coming to hospital)
router.post('/notification/:id/acknowledge', verifyToken, async (req, res) => {
  try {
    const notification = await StaffNotification.findByIdAndUpdate(
      req.params.id,
      { 
        actionTaken: true, 
        actionTakenAt: new Date(),
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, notification, message: 'Action acknowledged' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
