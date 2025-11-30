const express = require('express');
const router = express.Router();
const DoctorSchedule = require('../models/DoctorSchedule');

// Get doctor's schedule
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    let schedule = await DoctorSchedule.findOne({ doctorId: req.params.doctorId });
    
    // Create default schedule if not exists
    if (!schedule) {
      const defaultSlot = { startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatients: 20 };
      schedule = new DoctorSchedule({
        doctorId: req.params.doctorId,
        weeklySchedule: {
          monday: { isWorking: true, slots: [defaultSlot] },
          tuesday: { isWorking: true, slots: [defaultSlot] },
          wednesday: { isWorking: true, slots: [defaultSlot] },
          thursday: { isWorking: true, slots: [defaultSlot] },
          friday: { isWorking: true, slots: [defaultSlot] },
          saturday: { isWorking: true, slots: [{ ...defaultSlot, endTime: '14:00' }] },
          sunday: { isWorking: false, slots: [] }
        }
      });
      await schedule.save();
    }
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor's schedule
router.put('/doctor/:doctorId', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.params.doctorId },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ message: 'Schedule updated', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Block specific dates
router.post('/doctor/:doctorId/block', async (req, res) => {
  try {
    const { date, reason, isFullDay, blockedSlots } = req.body;
    
    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.params.doctorId },
      { $push: { blockedDates: { date, reason, isFullDay, blockedSlots } } },
      { new: true }
    );
    res.json({ message: 'Date blocked', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unblock date
router.delete('/doctor/:doctorId/block/:dateId', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.params.doctorId },
      { $pull: { blockedDates: { _id: req.params.dateId } } },
      { new: true }
    );
    res.json({ message: 'Date unblocked', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set vacation mode
router.post('/doctor/:doctorId/vacation', async (req, res) => {
  try {
    const { isActive, startDate, endDate, message } = req.body;
    
    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.params.doctorId },
      { vacationMode: { isActive, startDate, endDate, message } },
      { new: true }
    );
    res.json({ message: 'Vacation mode updated', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available slots for a date
router.get('/doctor/:doctorId/slots/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const schedule = await DoctorSchedule.findOne({ doctorId });
    
    if (!schedule) {
      return res.json({ slots: [], message: 'No schedule found' });
    }

    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const daySchedule = schedule.weeklySchedule[dayName];

    // Check vacation mode
    if (schedule.vacationMode?.isActive) {
      const start = new Date(schedule.vacationMode.startDate);
      const end = new Date(schedule.vacationMode.endDate);
      if (dateObj >= start && dateObj <= end) {
        return res.json({ slots: [], message: schedule.vacationMode.message || 'Doctor on vacation' });
      }
    }

    // Check blocked dates
    const isBlocked = schedule.blockedDates.some(b => 
      new Date(b.date).toDateString() === dateObj.toDateString() && b.isFullDay
    );
    if (isBlocked) {
      return res.json({ slots: [], message: 'Date not available' });
    }

    if (!daySchedule?.isWorking) {
      return res.json({ slots: [], message: 'Doctor not available on this day' });
    }

    // Generate time slots
    const slots = [];
    daySchedule.slots.forEach(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      
      let current = startHour * 60 + startMin;
      const end = endHour * 60 + endMin;
      
      while (current < end) {
        const hours = Math.floor(current / 60);
        const mins = current % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
        current += slot.slotDuration;
      }
    });

    res.json({ slots, daySchedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
