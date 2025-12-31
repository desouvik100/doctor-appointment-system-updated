/**
 * Branch Staff Management Routes
 * Handles staff assignment to branches and branch-specific authentication
 */

const express = require('express');
const router = express.Router();
const BranchStaff = require('../models/BranchStaff');
const HospitalBranch = require('../models/HospitalBranch');
const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const attendanceAnalytics = require('../services/attendanceAnalytics');

// Create branch staff (assign existing user or create new)
router.post('/', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { branchId, email, name, phone, role, permissions, department, password, createNewUser } = req.body;

    // Validate branch exists
    const branch = await HospitalBranch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    let userId;
    let user;

    if (createNewUser) {
      // Create new user for this branch
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
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
      // Link existing user
      user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found. Create new user or check email.' });
      }
      userId = user._id;
      
      // Update user's branch assignment
      await User.findByIdAndUpdate(userId, { branchId: branch._id });
    }

    // Check if already assigned to this branch
    const existingAssignment = await BranchStaff.findOne({ userId, branchId });
    if (existingAssignment) {
      return res.status(400).json({ success: false, message: 'Staff already assigned to this branch' });
    }

    // Create branch staff record
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

    // Update branch staff count
    await HospitalBranch.findByIdAndUpdate(branchId, { $inc: { staffCount: 1 } });

    res.status(201).json({ 
      success: true, 
      branchStaff,
      message: `Staff ${name} assigned to ${branch.branchName}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all staff for a branch
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

// Get all staff for organization (across all branches)
router.get('/organization/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    const staff = await BranchStaff.find({ organizationId: orgId, isActive: true })
      .populate('userId', 'name email phone profilePhoto')
      .populate('branchId', 'branchName branchCode city')
      .sort({ 'branchId.branchName': 1, name: 1 });

    res.json({ success: true, staff, count: staff.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update branch staff
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

    res.json({ success: true, branchStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove staff from branch
router.delete('/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const branchStaff = await BranchStaff.findById(req.params.id);
    if (!branchStaff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }

    // Soft delete
    branchStaff.isActive = false;
    await branchStaff.save();

    // Update branch staff count
    await HospitalBranch.findByIdAndUpdate(branchStaff.branchId, { $inc: { staffCount: -1 } });

    // Remove branch assignment from user
    await User.findByIdAndUpdate(branchStaff.userId, { branchId: null });

    res.json({ success: true, message: 'Staff removed from branch' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer staff between branches
router.post('/transfer', verifyTokenWithRole(['admin', 'clinic']), async (req, res) => {
  try {
    const { staffId, fromBranchId, toBranchId, reason } = req.body;

    const staff = await BranchStaff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const toBranch = await HospitalBranch.findById(toBranchId);
    if (!toBranch) {
      return res.status(404).json({ success: false, message: 'Target branch not found' });
    }

    // Update staff branch
    staff.branchId = toBranchId;
    await staff.save();

    // Update user's branch
    await User.findByIdAndUpdate(staff.userId, { branchId: toBranchId });

    // Update branch counts
    await HospitalBranch.findByIdAndUpdate(fromBranchId, { $inc: { staffCount: -1 } });
    await HospitalBranch.findByIdAndUpdate(toBranchId, { $inc: { staffCount: 1 } });

    res.json({ 
      success: true, 
      message: `Staff transferred to ${toBranch.branchName}`,
      staff 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Branch-specific login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get branch staff info
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
      { expiresIn: '24h' }
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's branch info
router.get('/my-branch', verifyToken, async (req, res) => {
  try {
    const branchStaff = await BranchStaff.findOne({ userId: req.user.userId, isActive: true })
      .populate('branchId')
      .populate('organizationId', 'name');

    if (!branchStaff) {
      return res.json({ success: true, branchStaff: null, message: 'Not assigned to any branch' });
    }

    res.json({ success: true, branchStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get real-time staff presence for organization/clinic
// Supports filtering by role, branchId, department, status query params (Requirements: 1.2, 1.3, 1.4, 1.5)
router.get('/presence/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    // Extract filter query parameters
    const { role, branchId, department, status } = req.query;

    // Build query filter for BranchStaff
    const staffQuery = { 
      organizationId: orgId, 
      isActive: true 
    };

    // Apply role filter (Requirements: 1.2)
    if (role) {
      staffQuery.role = role;
    }

    // Apply branchId filter (Requirements: 1.3)
    if (branchId) {
      const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId;
      staffQuery.branchId = branchObjectId;
    }

    // Apply department filter (Requirements: 1.4)
    if (department) {
      staffQuery.department = department;
    }

    // Apply status filter (customStatus)
    if (status) {
      // Handle 'checked_in' and 'checked_out' as special status values
      if (status === 'checked_in') {
        staffQuery.isCheckedIn = true;
      } else if (status === 'checked_out') {
        staffQuery.isCheckedIn = false;
      } else {
        // Filter by customStatus enum value
        staffQuery.customStatus = status;
      }
    }

    // Get all active staff with their check-in status and custom status (Requirements: 2.3)
    const staff = await BranchStaff.find(staffQuery)
      .populate('branchId', 'branchName branchCode')
      .select('name email role department isCheckedIn lastCheckIn lastCheckOut lastActivity branchId customStatus customStatusText')
      .sort({ isCheckedIn: -1, lastActivity: -1 });

    // Build query filter for doctors from User model
    const doctorQuery = {
      clinicId: orgId,
      role: 'doctor',
      isActive: true
    };

    // Apply role filter - only include doctors if role filter is 'doctor' or not specified
    const includeDoctors = !role || role === 'doctor';

    // Apply status filter for doctors
    if (status === 'checked_in') {
      doctorQuery.availability = 'Available';
    } else if (status === 'checked_out') {
      doctorQuery.availability = { $ne: 'Available' };
    }

    // Get doctors from User model for this clinic (only if role filter allows)
    let doctors = [];
    if (includeDoctors) {
      doctors = await User.find(doctorQuery)
        .select('name email phone specialization availability lastLogin');
    }

    // Combine staff and doctors into presence list
    let presence = [
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

    // Apply department filter to combined presence list for doctors (since User model doesn't have department)
    // This ensures combined filter AND logic (Requirements: 1.5)
    if (department && includeDoctors) {
      presence = presence.filter(p => {
        // Keep staff that match department, or doctors (which don't have department field)
        // If department filter is applied, doctors without department are excluded
        return p.department === department;
      });
    }

    // Apply branchId filter to combined presence list for doctors
    // (since doctors from User model don't have branchId in the same way)
    if (branchId && includeDoctors) {
      presence = presence.filter(p => {
        // Keep staff that match branchId, exclude doctors without branchId
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Staff check-in
router.post('/check-in', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkInTime = new Date();
    
    // Find staff record
    let staff = await BranchStaff.findOne({ userId, isActive: true });
    
    if (staff) {
      staff.isCheckedIn = true;
      staff.lastCheckIn = checkInTime;
      staff.lastActivity = checkInTime;
      await staff.save();
      
      // Create attendance record for check-in (Requirements: 5.1)
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

    // Also update user's last activity
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Staff check-out
router.post('/check-out', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const checkOutTime = new Date();
    
    // Find staff record
    let staff = await BranchStaff.findOne({ userId, isActive: true });
    
    let shiftDuration = null;
    let pairedCheckInTime = null;
    
    if (staff) {
      // Find the most recent check-in record to calculate shift duration
      const lastCheckInRecord = await AttendanceRecord.findOne({
        staffId: staff._id,
        eventType: 'check_in'
      }).sort({ timestamp: -1 });
      
      if (lastCheckInRecord) {
        pairedCheckInTime = lastCheckInRecord.timestamp;
        // Calculate shift duration in minutes
        shiftDuration = Math.round((checkOutTime - pairedCheckInTime) / (1000 * 60));
      }
      
      // Store the custom status before clearing it
      const statusAtCheckout = staff.customStatus;
      
      // Update staff record - clear custom status on checkout (Requirements: 2.4)
      staff.isCheckedIn = false;
      staff.lastCheckOut = checkOutTime;
      staff.lastActivity = checkOutTime;
      staff.customStatus = null;
      staff.customStatusText = null;
      await staff.save();
      
      // Create attendance record for check-out (Requirements: 5.2)
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

    // Also update user's availability
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

// Update staff activity (heartbeat)
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await BranchStaff.findOneAndUpdate(
      { userId, isActive: true },
      { lastActivity: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance history for organization (Requirements: 5.4)
router.get('/attendance/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    // Extract query parameters
    const { startDate, endDate, staffId, branchId, page = 1, limit = 50 } = req.query;

    // Build query filter
    const query = { organizationId: orgId };

    // Apply date range filter (Requirements: 5.4)
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        // Parse startDate and set to beginning of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }
      if (endDate) {
        // Parse endDate and set to end of day (inclusive)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    // Apply staffId filter
    if (staffId) {
      const staffObjectId = mongoose.Types.ObjectId.isValid(staffId)
        ? new mongoose.Types.ObjectId(staffId)
        : staffId;
      query.staffId = staffObjectId;
    }

    // Apply branchId filter
    if (branchId) {
      const branchObjectId = mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : branchId;
      query.branchId = branchObjectId;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await AttendanceRecord.countDocuments(query);

    // Get paginated attendance records
    const records = await AttendanceRecord.find(query)
      .populate('staffId', 'name email role department')
      .populate('branchId', 'branchName branchCode')
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
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

// Set custom status for staff member (Requirements: 2.2, 2.3)
router.post('/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, statusText } = req.body;
    
    // Validate status enum
    const validStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null];
    if (status !== undefined && status !== null && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.filter(s => s !== null).join(', ')}` 
      });
    }
    
    // Validate statusText length
    if (statusText && statusText.length > 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status text must be 50 characters or less' 
      });
    }
    
    // Find and update staff record
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

// Get analytics for organization (Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 7.1, 7.2, 7.3)
router.get('/analytics/:orgId', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    // Extract query parameters
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      standardHours = 8,
      overtimeThreshold = 10,
      consecutiveThreshold = 3
    } = req.query;

    // Validate date range
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

    // Validate date range
    if (dateRange.endDate < dateRange.startDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate must be after startDate'
      });
    }

    // Get all analytics data in parallel
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

    // Calculate summary statistics
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

// Export analytics data as CSV (Requirements: 8.6)
router.get('/analytics/:orgId/export', verifyToken, async (req, res) => {
  try {
    const orgId = mongoose.Types.ObjectId.isValid(req.params.orgId)
      ? new mongoose.Types.ObjectId(req.params.orgId)
      : req.params.orgId;

    // Extract query parameters
    const { startDate, endDate, format = 'csv' } = req.query;

    // Validate date range
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

    // Validate date range
    if (dateRange.endDate < dateRange.startDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate must be after startDate'
      });
    }

    // Only CSV format is supported currently
    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        message: 'Only CSV format is currently supported'
      });
    }

    // Generate CSV
    const csvContent = await attendanceAnalytics.exportToCSV(orgId, dateRange);

    // Set headers for file download
    const filename = `attendance_report_${startDate}_to_${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
