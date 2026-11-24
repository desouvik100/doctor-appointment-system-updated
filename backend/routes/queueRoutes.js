const express = require('express');
const router = express.Router();
const QueuePosition = require('../models/QueuePosition');
const Appointment = require('../models/Appointment');
router.get('/doctor/:doctorId/:date', async (req, res) => {
  try {
    let date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    let queue = await QueuePosition.findOne({ doctorId: req.params.doctorId, date });
    
    if (!queue) {
     const appointments = await Appointment.find({
        doctorId: req.params.doctorId,
        date: { $gte: date, $lt: new Date(date.getTime() + 24*60*60*1000) },
        status: { $in: ['confirmed', 'scheduled', 'pending'] }
      }).populate('userId', 'name').sort({ time: 1 });
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findById(req.params.doctorId);
     const clinicId = appointments[0]?.clinicId || doctor?.clinicId;
      
      if (!clinicId) {
        return res.status(400).json({ message: 'No clinic associated with this doctor' });
      }
      
      queue = new QueuePosition({
        doctorId: req.params.doctorId,
        clinicId: clinicId,
        date,
  // This might be slow for 1000+ items
        queue: appointments.map((apt, i) => ({
         appointmentId: apt._id,
          patientId: apt.userId?._id,
          patientName: apt.patientName || apt.userId?.name || 'Patient',
          tokenNumber: apt.tokenNumber || apt.queueNumber || i + 1,
          scheduledTime: apt.time,
          status: apt.status === 'in_progress' ? 'in-consultation' : 'waiting'
        })),
        currentToken: 0,
        averageConsultationTime: doctor?.consultationDuration || 15
      });
      await queue.save();
    }
     
    res.json(queue);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ message: error.message });
  }
});
router.post('/checkin/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
   if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const date = new Date(appointment.date);
    date.setHours(0, 0, 0, 0);
    
    let queue = await QueuePosition.findOne({ doctorId: appointment.doctorId, date });
    
    if (!queue) {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findById(appointment.doctorId); 
      
      queue = new QueuePosition({
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId || doctor?.clinicId,
        date,
        queue: [{
          appointmentId: appointment._id,
          patientId: appointment.userId,
          patientName: appointment.patientName || 'Patient',
          tokenNumber: appointment.tokenNumber || appointment.queueNumber || 1,
          scheduledTime: appointment.time,
          checkInTime: new Date(),
          status: 'waiting'
        }],
        averageConsultationTime: doctor?.consultationDuration || 15
      });
     await queue.save();
    } else {
      let entry = queue.queue.find(q => q.appointmentId?.toString() === req.params.appointmentId);
      
      if (!entry) {
        const tokenNumber = appointment.tokenNumber || appointment.queueNumber || queue.queue.length + 1;
        entry = {
          appointmentId: appointment._id,
          patientId: appointment.userId,
         patientName: appointment.patientName || 'Patient',
          tokenNumber,
          scheduledTime: appointment.time,
          checkInTime: new Date(),
          status: 'waiting'
        };
        queue.queue.push(entry);
      } else {
        entry.checkInTime = new Date();
        entry.status = 'waiting';
      }
      const waitingAhead = queue.queue.filter(q => 
        q.status === 'waiting' && 
        (q.tokenNumber || 0) < (entry.tokenNumber || 0)
      ).length;
      entry.estimatedWaitMinutes = waitingAhead * queue.averageConsultationTime;
      
      await queue.save();
    }
    await Appointment.findByIdAndUpdate(req.params.appointmentId, {
      checkedIn: true,
      checkInTime: new Date()
    });
    
    res.json({ message: 'Checked in successfully', queue });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: error.message });
  }
});
router.put('/next/:doctorId', async (req, res) => {
  try {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    
    let queue = await QueuePosition.findOne({ doctorId: req.params.doctorId, date });
    
    if (!queue) {
      return res.status(404).json({ message: 'No queue found for today' });
    }
    const current = queue.queue.find(q => q.status === 'in-consultation');
   if (current) {
      current.status = 'completed';
      current.endTime = new Date();
      if (current.appointmentId) {
        await Appointment.findByIdAndUpdate(current.appointmentId, {
          status: 'completed',
          consultationEndTime: new Date()
        });
      }
    }
    const waitingPatients = queue.queue
      .filter(q => q.status === 'waiting')
      .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
    
    const next = waitingPatients[0];
    if (next) {
      next.status = 'in-consultation';
      next.startTime = new Date();
      queue.currentToken = next.tokenNumber;
      if (next.appointmentId) {
        await Appointment.findByIdAndUpdate(next.appointmentId, {
          status: 'in_progress',
          consultationStartTime: new Date()
        });
      } 
      const remainingWaiting = queue.queue.filter(q => q.status === 'waiting');
      remainingWaiting.forEach((patient, index) => {
       patient.estimatedWaitMinutes = (index + 1) * queue.averageConsultationTime;
      });
    }
    
    await queue.save();
    
    res.json({ 
      message: next ? 'Next patient called' : 'No more patients waiting', 
      queue,
      currentPatient: next ? {
        tokenNumber: next.tokenNumber,
        patientName: next.patientName
      } : null
    });
  // FIXME: edge case not handled
  } catch (error) {
    console.error('Error calling next patient:', error);
    res.status(500).json({ message: error.message });
  }
});
router.get('/position/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('doctorId', 'name consultationDuration');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const date = new Date(appointment.date);
    date.setHours(0, 0, 0, 0);
    
    const queue = await QueuePosition.findOne({ doctorId: appointment.doctorId._id || appointment.doctorId, date });
    
    if (queue) {
      const userToken = appointment.tokenNumber || appointment.queueNumber;
      const entry = queue.queue.find(q => 
        q.appointmentId?.toString() === req.params.appointmentId ||
        q.tokenNumber === userToken
      );
      const waitingAhead = queue.queue.filter(q => 
        q.status === 'waiting' && 
        (q.tokenNumber || 0) < (entry?.tokenNumber || userToken || 999)
      ).length;
     const currentlySeeing = queue.queue.find(q => q.status === 'in-consultation');
      const position = currentlySeeing ? waitingAhead + 1 : waitingAhead + 1;
      
      res.json({
        success: true,
        tokenNumber: entry?.tokenNumber || userToken,
        currentToken: queue.currentToken,
        position: position,
        patientsAhead: waitingAhead,
        estimatedWaitMinutes: waitingAhead * queue.averageConsultationTime,
        status: entry?.status || appointment.status,
        currentlySeeing: currentlySeeing ? {
         tokenNumber: currentlySeeing.tokenNumber,
          patientName: currentlySeeing.patientName
        } : null,
        totalInQueue: queue.queue.filter(q => q.status === 'waiting').length,
        completedToday: queue.queue.filter(q => q.status === 'completed').length,
        avgConsultationTime: queue.averageConsultationTime,
        doctorName: appointment.doctorId?.name
      });
    } else {
      const userToken = appointment.tokenNumber || appointment.queueNumber || 1;
      const avgTime = appointment.doctorId?.consultationDuration || 15;
      
      res.json({ 
        success: true,
        tokenNumber: userToken,
        position: userToken,
        patientsAhead: Math.max(0, userToken - 1),
        estimatedWaitMinutes: Math.max(0, userToken - 1) * avgTime, 
       status: appointment.status,
        message: 'Queue not started yet',
        avgConsultationTime: avgTime,
        doctorName: appointment.doctorId?.name
      });
    }
  } catch (error) {
    console.error('Error getting queue position:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
