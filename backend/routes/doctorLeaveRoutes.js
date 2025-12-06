// backend/routes/doctorLeaveRoutes.js
const express = require('express');
const router = express.Router();
const DoctorLeave = require('../models/DoctorLeave');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Get all leaves for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = { doctorId: req.params.doctorId };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      ];
    }

    const leaves = await DoctorLeave.find(query)
      .sort({ startDate: -1 })
      .limit(50);

    res.json(leaves);
  } catch (error) {
    console.error('Get doctor leaves error:', error);
    res.status(500).json({ message: 'Failed to fetch leaves', error: error.message });
  }
});

// Check if doctor is on leave for a specific date
router.get('/check/:doctorId/:date', async (req, res) => {
  try {
    const isOnLeave = await DoctorLeave.isDoctorOnLeave(
      req.params.doctorId,
      new Date(req.params.date)
    );

    res.json({ isOnLeave });
  } catch (error) {
    console.error('Check leave error:', error);
    res.status(500).json({ message: 'Failed to check leave status', error: error.message });
  }
});

// Create leave request
router.post('/', async (req, res) => {
  try {
    const {
      doctorId,
      clinicId,
      leaveType,
      startDate,
      endDate,
      reason,
      isFullDay,
      startTime,
      endTime
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check for overlapping leaves
    const existingLeave = await DoctorLeave.findOne({
      doctorId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (existingLeave) {
      return res.status(400).json({ 
        message: 'You already have a leave scheduled during this period',
        existingLeave
      });
    }

    // Find affected appointments
    const affectedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $in: ['pending', 'confirmed'] }
    });

    const leave = new DoctorLeave({
      doctorId,
      clinicId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      isFullDay,
      startTime,
      endTime,
      affectedAppointments: affectedAppointments.map(apt => apt._id)
    });

    await leave.save();

    res.status(201).json({
      message: 'Leave created successfully',
      leave,
      affectedAppointmentsCount: affectedAppointments.length,
      affectedAppointments: affectedAppointments.map(apt => ({
        id: apt._id,
        date: apt.date,
        time: apt.time,
        patientId: apt.userId
      }))
    });
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ message: 'Failed to create leave', error: error.message });
  }
});

// Update leave
router.put('/:id', async (req, res) => {
  try {
    const leave = await DoctorLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status === 'approved' && req.body.status !== 'cancelled') {
      // If already approved, only allow cancellation
      return res.status(400).json({ message: 'Approved leave can only be cancelled' });
    }

    Object.assign(leave, req.body);
    await leave.save();

    res.json({
      message: 'Leave updated successfully',
      leave
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ message: 'Failed to update leave', error: error.message });
  }
});

// Cancel leave
router.post('/:id/cancel', async (req, res) => {
  try {
    const leave = await DoctorLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      message: 'Leave cancelled successfully',
      leave
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ message: 'Failed to cancel leave', error: error.message });
  }
});

// Delete leave
router.delete('/:id', async (req, res) => {
  try {
    const leave = await DoctorLeave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json({ message: 'Leave deleted successfully' });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({ message: 'Failed to delete leave', error: error.message });
  }
});

// Get upcoming leaves for all doctors (admin view)
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaves = await DoctorLeave.find({
      endDate: { $gte: today },
      status: { $in: ['pending', 'approved'] }
    })
      .populate('doctorId', 'name specialization')
      .sort({ startDate: 1 })
      .limit(50);

    res.json(leaves);
  } catch (error) {
    console.error('Get upcoming leaves error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming leaves', error: error.message });
  }
});

// Get leave calendar for a month
router.get('/calendar/:doctorId/:year/:month', async (req, res) => {
  try {
    const { doctorId, year, month } = req.params;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const leaves = await DoctorLeave.getLeavesInRange(doctorId, startOfMonth, endOfMonth);

    // Create a map of dates with leave
    const leaveDates = {};
    leaves.forEach(leave => {
      let current = new Date(leave.startDate);
      while (current <= leave.endDate && current <= endOfMonth) {
        if (current >= startOfMonth) {
          const dateKey = current.toISOString().split('T')[0];
          leaveDates[dateKey] = {
            leaveType: leave.leaveType,
            isFullDay: leave.isFullDay,
            reason: leave.reason
          };
        }
        current.setDate(current.getDate() + 1);
      }
    });

    res.json({
      leaves,
      leaveDates,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Get leave calendar error:', error);
    res.status(500).json({ message: 'Failed to fetch leave calendar', error: error.message });
  }
});

module.exports = router;
