const express = require('express');
const DoctorSchedule = require('../models/DoctorSchedule');
const Holiday = require('../models/Holiday');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const router = express.Router();

// Get all schedules for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const schedules = await DoctorSchedule.find({ 
      doctorId: req.params.doctorId,
      isActive: true 
    }).sort({ day: 1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching doctor schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available slots for a doctor on a specific date
router.get('/doctor/:doctorId/available-slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Get doctor's schedule for this day
    const schedule = await DoctorSchedule.findOne({
      doctorId,
      day: dayName,
      isActive: true
    });

    if (!schedule) {
      return res.json({ available: false, message: 'Doctor not available on this day', slots: [] });
    }

    // Check if it's a holiday
    const holiday = await Holiday.findOne({
      doctorId,
      date: { $gte: new Date(appointmentDate.setHours(0,0,0,0)), $lt: new Date(appointmentDate.setHours(23,59,59,999)) }
    });

    if (holiday) {
      return res.json({ available: false, message: 'Doctor is on holiday', slots: [] });
    }

    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0,0,0,0)),
        $lt: new Date(appointmentDate.setHours(23,59,59,999))
      },
      status: { $in: ['pending', 'confirmed', 'in-progress'] }
    });

    const bookedTimes = bookedAppointments.map(apt => apt.time);

    // Generate available slots
    const slots = [];
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const slotDuration = schedule.slotDuration;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      if (!bookedTimes.includes(timeString)) {
        slots.push({
          time: timeString,
          available: true
        });
      } else {
        slots.push({
          time: timeString,
          available: false
        });
      }

      // Add slot duration
      currentMin += slotDuration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    res.json({
      available: true,
      schedule: {
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotDuration: schedule.slotDuration,
        shift: schedule.shift,
        roomNumber: schedule.roomNumber
      },
      slots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update doctor schedule
router.post('/', async (req, res) => {
  try {
    const { doctorId, day, startTime, endTime, slotDuration, shift, roomNumber } = req.body;

    if (!doctorId || !day || !startTime || !endTime) {
      return res.status(400).json({ message: 'Doctor ID, day, start time, and end time are required' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId, day },
      {
        doctorId,
        day,
        startTime,
        endTime,
        slotDuration: slotDuration || 15,
        shift: shift || 'Morning',
        roomNumber,
        isActive: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Schedule for this day already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete schedule (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deactivated successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== HOLIDAY ROUTES ==========

// Get holidays for a doctor
router.get('/doctor/:doctorId/holidays', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { doctorId: req.params.doctorId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add holiday
router.post('/holidays', async (req, res) => {
  try {
    const { doctorId, date, reason, isRecurring } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const holiday = new Holiday({
      doctorId,
      date: new Date(date),
      reason: reason || 'Holiday',
      isRecurring: isRecurring || false
    });

    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Holiday for this date already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete holiday
router.delete('/holidays/:id', async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

