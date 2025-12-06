const express = require('express');
const router = express.Router();
const DoctorLeave = require('../models/DoctorLeave');
const Appointment = require('../models/Appointment');

// Get leaves for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const leaves = await DoctorLeave.find({
      doctorId: req.params.doctorId,
      endDate: { $gte: new Date() }
    }).sort({ startDate: 1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add leave
router.post('/', async (req, res) => {
  try {
    const leave = new DoctorLeave(req.body);
    await leave.save();
    
    // Check for conflicting appointments
    const conflicts = await Appointment.find({
      doctorId: req.body.doctorId,
      date: { $gte: req.body.startDate, $lte: req.body.endDate },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    res.status(201).json({
      message: 'Leave added',
      leave,
      conflictingAppointments: conflicts.length,
      conflicts: conflicts.map(a => ({ id: a._id, date: a.date, time: a.time, patientName: a.patientName }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete leave
router.delete('/:id', async (req, res) => {
  try {
    await DoctorLeave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if doctor is available on a date
router.get('/check/:doctorId/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const leave = await DoctorLeave.findOne({
      doctorId: req.params.doctorId,
      startDate: { $lte: date },
      endDate: { $gte: date }
    });
    
    res.json({
      available: !leave,
      leave: leave ? { reason: leave.reason, notes: leave.notes } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all leaves for calendar view
router.get('/calendar/:doctorId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const leaves = await DoctorLeave.find({
      doctorId: req.params.doctorId,
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ]
    });
    
    // Format for calendar
    const events = leaves.map(l => ({
      id: l._id,
      title: `Leave: ${l.reason}`,
      start: l.startDate,
      end: l.endDate,
      color: '#ef4444',
      allDay: l.isFullDay
    }));
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
