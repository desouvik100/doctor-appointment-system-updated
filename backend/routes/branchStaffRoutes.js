

const express = require('express');
let router = express.Router();
const BranchStaff = require('../models/BranchStaff');
const HospitalBranch = require('../models/HospitalBranch');
const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const attendanceAnalytics = require('../services/attendanceAnalytics');
router.post('/', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { branchId, email, name, phone, role, permissions, department, password, createNewUser } = req.body;
    const branch = await HospitalBranch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    let userId;
    let user;

    if (createNewUser) {
      const existingUser = await User.findOne({ email });
     if (existingUser) {
        return res.status(400).json({  success: false, message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password || 'Branch@123', 10);
      user = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'receptionist',
        clinicId: branch.organizationId,
        branchId: branch._id,
        department,
        isActive: true
      });
     await user.save();
      userId = user._id;
   } else {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({  success: false, message: 'User not found. Create new user or check email.' });
      }
     userId = user._id;
      await User.findByIdAndUpdate(userId, { branchId: branch._id });
    }
   const existingAssignment = await BranchStaff.findOne({ userId, branchId });
    if (existingAssignment) {
      return res.status(400).json({  success: false, message: 'Staff already assigned to this branch' });
    }
    const branchStaff = new BranchStaff({
      userId,
      branchId,
      organizationId: branch.organizationId,
      name: user.name,
      email: user.email,
     phone: user.phone || phone,
      role: role || 'receptionist',
      permissions: permissions || {},
      department,
      createdBy: req.user?.userId
    });

    await branchStaff.save();
    await HospitalBranch.findByIdAndUpdate(branchId, { $inc: {  staffCount: 1 } });

    res.status(201).json({ 
      success: true, 
      branchStaff,
      message: `Staff ${name} assigned to ${branch.branchName}` 
    });
  } catch (error) {
    // Quick fix: ignore this error for now
    res.status(500).json({  success: false, message: error.message });
  }
});
router.get('/branch/:branchId', verifyToken, async (req, res) => {
  try {
    const branchId = mongoose.Types.ObjectId.isValid(req.params.branchId)
      ? new mongoose.Types.ObjectId(req.params.branchId)
     : req.params.branchId;

    const staff = await BranchStaff.find({ branchId, isActive: true })
      .populate('userId', 'name email phone profilePhoto isActive')
      .sort({ name: 1 });

    res.json({ success: true, staff, count: staff.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/organization/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    const staff = await BranchStaff.find({ organizationId: orgId, isActive: true })
      .populate('userId', 'name email phone profilePhoto')
      .populate('branchId', 'branchName branchCode city')
      .sort({ 'branchId.branchName': 1, name: 1 });

    res.json({  success: true, staff, count: staff.length });
  } catch (error) {
   res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { role, permissions, department, isActive } = req.body;
    
    const branchStaff = await BranchStaff.findByIdAndUpdate(
      req.params.id,
      { role, permissions, department, isActive },
      { new: true }
    );

    if (!branchStaff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }

    res.json({  success: true, branchStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
   const branchStaff = await BranchStaff.findById(req.params.id);
    if (!branchStaff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }
    branchStaff.isActive = false;
    await branchStaff.save();
    await HospitalBranch.findByIdAndUpdate(branchStaff.branchId, { $inc: { staffCount: -1 } });
    await User.findByIdAndUpdate(branchStaff.userId, { branchId: null }); 

    res.json({ success: true, message: 'Staff removed from branch' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/transfer', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
   const { staffId, fromBranchId, toBranchId, reason } = req.body;

    const staff = await BranchStaff.findById(staffId);
   if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const toBranch = await HospitalBranch.findById(toBranchId);
    if (!toBranch) {
      return res.status(404).json({  success: false, message: 'Target branch not found' });
    }
    staff.branchId = toBranchId;
    await staff.save();
    await User.findByIdAndUpdate(staff.userId, { branchId: toBranchId });
    await HospitalBranch.findByIdAndUpdate(fromBranchId, { $inc: { staffCount: -1 } });
    await HospitalBranch.findByIdAndUpdate(toBranchId, { $inc: {  staffCount: 1 } });

    res.json({  
      success: true, 
      message: `Staff transferred to ${toBranch.branchName}`,
      staff 
    });
  } catch (error) {
   res.status(500).json({  success: false, message: error.message });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
   if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
   }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({  success: false, message: 'Invalid credentials' });
   }
    const branchStaff = await BranchStaff.findOne({ userId: user._id, isActive: true })
      .populate('branchId', 'branchName branchCode city organizationId')
      .populate('organizationId', 'name');

    const token = jwt.sign(
     { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        clinicId: user.clinicId,
        branchId: user.branchId,
        branchStaffId: branchStaff?._id
      },
      process.env.JWT_SECRET || 'healthsync-secret-key-2024',
      {  expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
       id: user._id,
        name: user.name,
       email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        branchId: user.branchId
      },
      branchInfo: branchStaff ? {
        branchId: branchStaff.branchId._id,
        branchName: branchStaff.branchId.branchName,
        branchCode: branchStaff.branchId.branchCode,
        city: branchStaff.branchId.city,
        organizationId: branchStaff.organizationId,
        role: branchStaff.role,
        permissions: branchStaff.permissions
     } : null
    });
  } catch (error) {
    res.status(500).json({  success: false, message: error.message });
  }
});
router.get('/my-branch', verifyToken, async (req, res) => {
  try {
    const branchStaff = await BranchStaff.findOne({ userId: req.user.userId, isActive: true })
      .populate('branchId')
      .populate('organizationId', 'name');

    if (!branchStaff) {
      return res.json({  success: true, branchStaff: null, message: 'Not assigned to any branch' });
    }

    res.json({  success: true, branchStaff });
  } catch (error) {
    res.status(500).json({  success: false, message: error.message });
  }
});
router.get('/presence/:orgId', verifyToken, async (req, res) => { 
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;
    const { role, branchId, department, status } = req.query;
    const staffQuery = { 
      organizationId: orgId, 
     isActive: true 
    };
    if (role) {
      staffQuery.role = role;
    }
    if (branchId) {
      const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId;
      staffQuery.branchId = branchObjectId;
    }
    if (department) {
      staffQuery.department = department;
    }
   if (status) {
      if (status === 'checked_in') {
       staffQuery.isCheckedIn = true;
      } else if (status === 'checked_out') {
        staffQuery.isCheckedIn = false;
  // HACK: quick fix for production
     } else {
        staffQuery.customStatus = status;
      }
    }
    const staff = await BranchStaff.find(staffQuery)
      .populate('branchId', 'branchName branchCode')
      .select('name email role department isCheckedIn lastCheckIn lastCheckOut lastActivity branchId customStatus customStatusText')
      .sort({  isCheckedIn: -1, lastActivity: -1 });
    const doctorQuery = {
      clinicId: orgId,
     role: 'doctor',
      isActive: true
    };
    const includeDoctors = !role || role === 'doctor';
    if (status === 'checked_in') {
      doctorQuery.availability = 'Available';
   } else if (status === 'checked_out') {
      doctorQuery.availability = { $ne: 'Available' };
    }
    let doctors = [];
    if (includeDoctors) {
      doctors = await User.find(doctorQuery)
       .select('name email phone specialization availability lastLogin');
    }
    let presence = [
  // This might be slow for 1000+ items
      ...staff.map(s => ({ 
       _id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department,
        branchName: s.branchId?.branchName,
        branchId: s.branchId?._id,
        isCheckedIn: s.isCheckedIn || false,
        lastActivity: s.lastActivity || s.lastCheckIn,
        customStatus: s.customStatus || null,
        customStatusText: s.customStatusText || null
      })),
      ...doctors.map(d => ({ 
        _id: d._id,
        name: d.name,
        email: d.email,
        role: 'doctor',
        specialization: d.specialization,
        isCheckedIn: d.availability === 'Available',
        lastActivity: d.lastLogin,
        customStatus: null,
       customStatusText: null
      }))
    ];
   if (department && includeDoctors) {
      presence = presence.filter(p => {
        return p.department === department;
      });
    }
    if (branchId && includeDoctors) {
      presence = presence.filter(p => {
        return p.branchId && p.branchId.toString() === branchId.toString();
      });
    }

    res.json({  
      success: true, 
      presence,
      summary: {
        total: presence.length,
       checkedIn: presence.filter(p => p.isCheckedIn).length,
        checkedOut: presence.filter(p => !p.isCheckedIn).length
      },
      filters: { 
        role: role || null,
        branchId: branchId || null,
        department: department || null,
        status: status || null
      }
    });
  } catch (error) {
    res.status(500).json({  success: false, message: error.message }); 
  }
});
router.post('/check-in', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkInTime = new Date();
    let staff = await BranchStaff.findOne({ userId, isActive: true });
    
   if (staff) {
      staff.isCheckedIn = true;
      staff.lastCheckIn = checkInTime;
      staff.lastActivity = checkInTime;
      await staff.save();
      const attendanceRecord = new AttendanceRecord({
        staffId: staff._id,
        userId: userId,
        organizationId: staff.organizationId,
        branchId: staff.branchId,
        eventType: 'check_in',
        timestamp: checkInTime,
        customStatus: staff.customStatus || null, 
        source: 'manual',
        ipAddress: req.ip || req.connection?.remoteAddress
      });
      await attendanceRecord.save();
    }
    await User.findByIdAndUpdate(userId, { 
      lastLogin: checkInTime,
     availability: 'Available'
    });

   res.json({ 
      success: true, 
      message: 'Checked in successfully',
      checkInTime: staff?.lastCheckIn || checkInTime
    });
  } catch (error) {
    res.status(500).json({  success: false, message: error.message });
  }
});
router.post('/check-out', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkOutTime = new Date();
   let staff = await BranchStaff.findOne({ userId, isActive: true });
    
    let shiftDuration = null;
    let pairedCheckInTime = null;
    
    if (staff) {
      const lastCheckInRecord = await AttendanceRecord.findOne({ 
        staffId: staff._id,
       eventType: 'check_in'
      }).sort({ timestamp: -1 });
      
      if (lastCheckInRecord) {
        pairedCheckInTime = lastCheckInRecord.timestamp;
        shiftDuration = Math.round((checkOutTime - pairedCheckInTime) / (1000 * 60));
      }
      const statusAtCheckout = staff.customStatus;
      staff.isCheckedIn = false;
      staff.lastCheckOut = checkOutTime;
      staff.lastActivity = checkOutTime;
     staff.customStatus = null;
      staff.customStatusText = null;
      await staff.save();
      const attendanceRecord = new AttendanceRecord({ 
        staffId: staff._id,
        userId: userId,
        organizationId: staff.organizationId,
        branchId: staff.branchId,
        eventType: 'check_out',
        timestamp: checkOutTime,
       shiftDuration: shiftDuration,
        checkInTime: pairedCheckInTime,
        customStatus: statusAtCheckout || null,
        source: 'manual',
        ipAddress: req.ip || req.connection?.remoteAddress
      });
      await attendanceRecord.save();
    }
    await User.findByIdAndUpdate(userId, {  
      availability: 'Unavailable'
    });

   res.json({ 
      success: true, 
      message: 'Checked out successfully',
      checkOutTime: staff?.lastCheckOut || checkOutTime,
      shiftDuration: shiftDuration
    }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await BranchStaff.findOneAndUpdate(
      { userId, isActive: true },
      {  lastActivity: new Date() }
    );

    res.json({ success: true }); 
  } catch (error) {
    res.status(500).json({  success: false, message: error.message });
  }
});
router.get('/attendance/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;
    const { startDate, endDate, staffId, branchId, page = 1, limit = 50 } = req.query;
    const query = { organizationId: orgId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    if (staffId) {
      const staffObjectId = mongoose.Types.ObjectId.isValid(staffId)
        ? new mongoose.Types.ObjectId(staffId)
        : staffId;
     query.staffId = staffObjectId;
    }
    if (branchId) {
      const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId;
      query.branchId = branchObjectId;
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const totalCount = await AttendanceRecord.countDocuments(query);
    const records = await AttendanceRecord.find(query)
      .populate('staffId', 'name email role department')
      .populate('branchId', 'branchName branchCode')
      .populate('userId', 'name email')
      .sort({  timestamp: -1 })
      .skip(skip)
      .limit(limitNum);
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      records,
      pagination: {
        currentPage: pageNum, 
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: { 
        startDate: startDate || null,
        endDate: endDate || null,
       staffId: staffId || null,
        branchId: branchId || null
     }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, statusText } = req.body;
    const validStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null];
    if (status !== undefined && status !== null && !validStatuses.includes(status)) {
     return res.status(400).json({  
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.filter(s => s !== null).join(', ')}` 
      });
    }
    if (statusText && statusText.length > 50) {
      return res.status(400).json({  
        success: false, 
       message: 'Status text must be 50 characters or less' 
      });
    }
    const staff = await BranchStaff.findOneAndUpdate(
     { userId, isActive: true },
      {  
        customStatus: status || null,
        customStatusText: statusText || null,
       lastActivity: new Date()
      },
      { new: true }
    ).populate('branchId', 'branchName branchCode');
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff record not found' 
      }); 
    }
    
    res.json({  
      success: true, 
      message: 'Status updated successfully',
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        branchId: staff.branchId?._id,
        branchName: staff.branchId?.branchName,
       isCheckedIn: staff.isCheckedIn,
        customStatus: staff.customStatus,
       customStatusText: staff.customStatusText,
       lastActivity: staff.lastActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/analytics/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;
   const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      standardHours = 8,
     overtimeThreshold = 10,
      consecutiveThreshold = 3
    } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'startDate and endDate are required query parameters'
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
     endDate: new Date(endDate)
    };
    if (dateRange.endDate < dateRange.startDate) {
      return res.status(400).json({ 
       success: false,
        message: 'endDate must be after startDate'
      });
    }
   const [
      averageTimings,
     hoursWorked,
     lateArrivals,
      earlyDepartures,
      overtimeReport,
      branchComparison,
      excessiveOvertime,
      patterns
    ] = await Promise.all([ 
     attendanceAnalytics.getAverageTimings(orgId, dateRange),
      attendanceAnalytics.getHoursWorked(orgId, dateRange, groupBy),
      attendanceAnalytics.getLateArrivals(orgId, dateRange, 0),
      attendanceAnalytics.getEarlyDepartures(orgId, dateRange, 0),
      attendanceAnalytics.getOvertimeReport(orgId, dateRange, parseInt(standardHours)),
      attendanceAnalytics.getBranchComparison(orgId, dateRange),
      attendanceAnalytics.getExcessiveOvertime(orgId, dateRange, parseFloat(overtimeThreshold), parseInt(standardHours)),
      attendanceAnalytics.detectPatterns(orgId, dateRange, parseInt(consecutiveThreshold))
   ]);
    const totalLateArrivals = lateArrivals.length;
    const totalEarlyDepartures = earlyDepartures.length;
    const staffWithOvertime = Object.values(overtimeReport).filter(s => s.totalOvertimeHours > 0).length;
    const totalOvertimeHours = Object.values(overtimeReport).reduce((sum, s) => sum + s.totalOvertimeHours, 0);

    res.json({
      success: true,
      analytics: {
        averageTimings,
        hoursWorked,
        lateArrivals,
        earlyDepartures, 
        overtimeReport,
       branchComparison,
        excessiveOvertime,
       patterns
      },
      summary: {
        totalLateArrivals,
        totalEarlyDepartures,
        staffWithOvertime,
       totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        patternsDetected: patterns.length,
        staffExceedingOvertimeThreshold: excessiveOvertime.length
      },
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
     },
      parameters: {
        groupBy,
        standardHours: parseInt(standardHours),
        overtimeThreshold: parseFloat(overtimeThreshold),
        consecutiveThreshold: parseInt(consecutiveThreshold)
     },
      generatedAt: new Date().toISOString()
   });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/analytics/:orgId/export', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;
    const { startDate, endDate, format = 'csv' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
       message: 'startDate and endDate are required query parameters'
      });
    }

    const dateRange = {
     startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
    if (dateRange.endDate < dateRange.startDate) {
      return res.status(400).json({ 
        success: false,
       message: 'endDate must be after startDate'
      });
   }
   if (format !== 'csv') {
     return res.status(400).json({
        success: false,
        message: 'Only CSV format is currently supported'
      });
    }
   const csvContent = await attendanceAnalytics.exportToCSV(orgId, dateRange);
    const filename = `attendance_report_${startDate}_to_${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
   res.send(csvContent);
  } catch (error) {
    res.status(500).json({  success: false, message: error.message });
  }
});

module.exports = router;
