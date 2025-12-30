/**
 * Staff Schedule Routes
 * API endpoints for staff scheduling and attendance management
 */

const express = require('express');
const router = express.Router();
const StaffSchedule = require('../models/StaffSchedule');
const { verifyToken } = require('../middleware/auth');

// Get schedule for date range
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, staffId, role, shift } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const query = { clinicId: req.params.clinicId, date: { $gte: start, $lte: end } };
    if (staffId) query.staffId = staffId;
    if (role) query.role = role;
    if (shift) query.shift = shift;
    
    const schedules = await StaffSchedule.find(query)
      .populate('staffId', 'name email phone role profilePhoto')
      .sort({ date: 1, startTime: 1 });
    
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single staff schedule
router.get('/staff/:staffId', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const schedules = await StaffSchedule.find({
      staffId: req.params.staffId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create schedule
router.post('/create', verifyToken, async (req, res) => {
  try {
    const schedule = new StaffSchedule({ ...req.body, createdBy: req.user?.id });
    await schedule.save();
    res.status(201).json({ success: true, schedule, message: 'Schedule created' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Schedule already exists for this staff on this date' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create schedules
router.post('/bulk-create', verifyToken, async (req, res) => {
  try {
    const { schedules } = req.body;
    const created = await StaffSchedule.insertMany(
      schedules.map(s => ({ ...s, createdBy: req.user?.id })),
      { ordered: false }
    );
    res.status(201).json({ success: true, created: created.length, message: 'Schedules created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update schedule
router.put('/schedule/:scheduleId', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findByIdAndUpdate(
      req.params.scheduleId,
      { ...req.body, updatedBy: req.user?.id },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule, message: 'Schedule updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check in
router.post('/schedule/:scheduleId/check-in', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    
    await schedule.checkIn(req.body.location);
    res.json({ success: true, schedule, message: 'Checked in successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check out
router.post('/schedule/:scheduleId/check-out', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    
    await schedule.checkOut();
    res.json({ success: true, schedule, message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark absent
router.post('/schedule/:scheduleId/absent', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findByIdAndUpdate(
      req.params.scheduleId,
      { status: 'absent', notes: req.body.reason, updatedBy: req.user?.id },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule, message: 'Marked as absent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply leave
router.post('/schedule/:scheduleId/leave', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findByIdAndUpdate(
      req.params.scheduleId,
      {
        status: 'leave',
        leaveDetails: { ...req.body, approvedBy: req.user?.id, approvedAt: new Date() },
        updatedBy: req.user?.id
      },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule, message: 'Leave applied' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Swap shift
router.post('/schedule/:scheduleId/swap', verifyToken, async (req, res) => {
  try {
    const { swappedWith, reason } = req.body;
    const schedule = await StaffSchedule.findByIdAndUpdate(
      req.params.scheduleId,
      {
        swapDetails: { isSwapped: true, swappedWith, swapReason: reason, swapApprovedBy: req.user?.id },
        updatedBy: req.user?.id
      },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule, message: 'Shift swap recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance summary
router.get('/clinic/:clinicId/attendance-summary', verifyToken, async (req, res) => {
  try {
    const { staffId, month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    
    const summary = await StaffSchedule.getAttendanceSummary(req.params.clinicId, staffId, m, y);
    res.json({ success: true, summary: summary[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get today's attendance
router.get('/clinic/:clinicId/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const schedules = await StaffSchedule.find({
      clinicId: req.params.clinicId,
      date: { $gte: today, $lt: tomorrow }
    }).populate('staffId', 'name role profilePhoto');
    
    const summary = {
      total: schedules.length,
      checkedIn: schedules.filter(s => s.status === 'checked_in' || s.status === 'checked_out').length,
      absent: schedules.filter(s => s.status === 'absent').length,
      onLeave: schedules.filter(s => s.status === 'leave').length,
      pending: schedules.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length
    };
    
    res.json({ success: true, schedules, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete schedule
router.delete('/schedule/:scheduleId', verifyToken, async (req, res) => {
  try {
    const schedule = await StaffSchedule.findByIdAndDelete(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
