const express = require('express');
const router = express.Router();
const QueuePosition = require('../models/QueuePosition');
const Appointment = require('../models/Appointment');

// Get queue for a doctor on a date
router.get('/doctor/:doctorId/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    let queue = await QueuePosition.findOne({ doctorId: req.params.doctorId, date });
    
    if (!queue) {
      // Create queue from today's appointments
      const appointments = await Appointment.find({
        doctorId: req.params.doctorId,
        date: { $gte: date, $lt: new Date(date.getTime() + 24*60*60*1000) },
        appointmentType: 'in-clinic',
        status: { $in: ['confirmed', 'scheduled'] }
      }).populate('userId', 'name').sort({ time: 1 });
      
      queue = new QueuePosition({
        doctorId: req.params.doctorId,
        clinicId: appointments[0]?.clinicId,
        date,
        queue: appointments.map((apt, i) => ({
          appointmentId: apt._id,
          patientId: apt.userId?._id,
          patientName: apt.patientName || apt.userId?.name,
          tokenNumber: i + 1,
          scheduledTime: apt.time,
          status: 'waiting'
        }))
      });
      await queue.save();
    }
    
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient check-in
router.post('/checkin/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    const date = new Date(appointment.date);
    date.setHours(0, 0, 0, 0);
    
    const queue = await QueuePosition.findOne({ doctorId: appointment.doctorId, date });
    if (queue) {
      const entry = queue.queue.find(q => q.appointmentId.toString() === req.params.appointmentId);
      if (entry) {
        entry.checkInTime = new Date();
        entry.status = 'waiting';
        // Calculate estimated wait
        const position = queue.queue.filter(q => q.status === 'waiting' && q.tokenNumber < entry.tokenNumber).length;
        entry.estimatedWaitMinutes = position * queue.averageConsultationTime;
        await queue.save();
      }
    }
    
    res.json({ message: 'Checked in successfully', queue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update queue status (doctor calls next patient)
router.put('/next/:doctorId', async (req, res) => {
  try {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    
    const queue = await QueuePosition.findOne({ doctorId: req.params.doctorId, date });
    if (queue) {
      // Mark current as completed
      const current = queue.queue.find(q => q.status === 'in-consultation');
      if (current) {
        current.status = 'completed';
        current.endTime = new Date();
      }
      
      // Call next waiting patient
      const next = queue.queue.find(q => q.status === 'waiting');
      if (next) {
        next.status = 'in-consultation';
        next.startTime = new Date();
        queue.currentToken = next.tokenNumber;
      }
      
      await queue.save();
    }
    
    res.json({ message: 'Next patient called', queue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient's position in queue
router.get('/position/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    const date = new Date(appointment.date);
    date.setHours(0, 0, 0, 0);
    
    const queue = await QueuePosition.findOne({ doctorId: appointment.doctorId, date });
    if (queue) {
      const entry = queue.queue.find(q => q.appointmentId.toString() === req.params.appointmentId);
      const waitingAhead = queue.queue.filter(q => q.status === 'waiting' && q.tokenNumber < entry?.tokenNumber).length;
      
      res.json({
        tokenNumber: entry?.tokenNumber,
        currentToken: queue.currentToken,
        position: waitingAhead + 1,
        estimatedWaitMinutes: waitingAhead * queue.averageConsultationTime,
        status: entry?.status
      });
    } else {
      res.json({ position: 0, message: 'Queue not started' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
