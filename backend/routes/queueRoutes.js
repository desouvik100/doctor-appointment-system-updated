// backend/routes/queueRoutes.js
// Virtual Waiting Queue Routes

const express = require('express');
const router = express.Router();
const WaitingQueue = require('../models/WaitingQueue');
const Appointment = require('../models/Appointment');

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

// Get or create queue for a doctor
const getOrCreateQueue = async (doctorId, date = getTodayString()) => {
  let queue = await WaitingQueue.findOne({ doctorId, date });
  if (!queue) {
    queue = new WaitingQueue({ doctorId, date });
    await queue.save();
  }
  return queue;
};

// ==================== PATIENT ENDPOINTS ====================

// Get queue status for a specific appointment
router.get('/status/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const queue = await getOrCreateQueue(appointment.doctorId);
    const position = queue.getQueuePosition(appointment._id);
    const estimatedWait = queue.getEstimatedWait(appointment._id);
    const stats = queue.getStats();

    // Check if patient is in queue
    const patientEntry = queue.queue.find(q => 
      q.appointmentId.toString() === appointment._id.toString()
    );

    res.json({
      position: position > 0 ? position : null,
      estimatedWait,
      totalInQueue: stats.totalInQueue,
      doctorStatus: queue.doctorStatus,
      patientStatus: patientEntry?.status || 'not-joined',
      isYourTurn: position === 1 && queue.doctorStatus === 'ready',
      joinedAt: patientEntry?.joinedAt,
      calledAt: patientEntry?.calledAt
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({ message: 'Failed to get queue status', error: error.message });
  }
});

// Join the waiting queue
router.post('/join', async (req, res) => {
  try {
    const { appointmentId, patientId, patientName } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify appointment is for today and is online type
    const today = getTodayString();
    const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
    
    if (appointmentDate !== today) {
      return res.status(400).json({ 
        message: 'Can only join queue on appointment day' 
      });
    }

    const queue = await getOrCreateQueue(appointment.doctorId);
    
    // Check queue size
    const activeInQueue = queue.queue.filter(q => 
      ['waiting', 'called', 'in-consultation'].includes(q.status)
    ).length;
    
    if (activeInQueue >= queue.maxQueueSize) {
      return res.status(400).json({ message: 'Queue is full, please try again later' });
    }

    // Add to queue
    const entry = queue.addToQueue(
      appointmentId, 
      patientId, 
      patientName || appointment.patientName,
      appointment.time
    );
    
    await queue.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointmentId, { 
      status: 'in-queue',
      queueJoinedAt: new Date()
    });

    const position = queue.getQueuePosition(appointmentId);
    const estimatedWait = queue.getEstimatedWait(appointmentId);

    res.json({
      message: 'Joined queue successfully',
      position,
      estimatedWait,
      totalInQueue: queue.getStats().totalInQueue,
      doctorStatus: queue.doctorStatus
    });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ message: 'Failed to join queue', error: error.message });
  }
});

// Leave the queue
router.post('/leave', async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const queue = await getOrCreateQueue(appointment.doctorId);
    
    const entryIndex = queue.queue.findIndex(q => 
      q.appointmentId.toString() === appointmentId
    );
    
    if (entryIndex !== -1) {
      queue.queue[entryIndex].status = 'cancelled';
      await queue.save();
      
      await Appointment.findByIdAndUpdate(appointmentId, { 
        status: 'scheduled' // Reset to scheduled
      });
    }

    res.json({ message: 'Left queue successfully' });
  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(500).json({ message: 'Failed to leave queue', error: error.message });
  }
});

// ==================== DOCTOR ENDPOINTS ====================

// Get doctor's queue
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const queue = await getOrCreateQueue(req.params.doctorId);
    
    // Populate patient details
    await queue.populate('queue.patientId', 'name email phone profilePhoto');
    
    const activeQueue = queue.queue.filter(q => 
      ['waiting', 'called', 'in-consultation'].includes(q.status)
    );

    res.json({
      queue: activeQueue,
      stats: queue.getStats(),
      doctorStatus: queue.doctorStatus,
      currentPatientId: queue.currentPatientId,
      avgConsultationTime: queue.avgConsultationTime
    });
  } catch (error) {
    console.error('Get doctor queue error:', error);
    res.status(500).json({ message: 'Failed to get queue', error: error.message });
  }
});

// Update doctor status
router.put('/doctor/:doctorId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['offline', 'available', 'busy', 'break', 'ready'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const queue = await getOrCreateQueue(req.params.doctorId);
    queue.doctorStatus = status;
    await queue.save();

    res.json({ 
      message: 'Status updated',
      doctorStatus: queue.doctorStatus 
    });
  } catch (error) {
    console.error('Update doctor status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

// Call next patient
router.post('/doctor/:doctorId/call-next', async (req, res) => {
  try {
    const queue = await getOrCreateQueue(req.params.doctorId);
    const nextPatient = queue.callNextPatient();
    
    if (!nextPatient) {
      return res.json({ message: 'No patients waiting', nextPatient: null });
    }
    
    await queue.save();

    // TODO: Send notification to patient (push notification, SMS, etc.)

    res.json({
      message: 'Called next patient',
      nextPatient: {
        appointmentId: nextPatient.appointmentId,
        patientId: nextPatient.patientId,
        patientName: nextPatient.patientName,
        scheduledTime: nextPatient.scheduledTime
      },
      doctorStatus: queue.doctorStatus
    });
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({ message: 'Failed to call next patient', error: error.message });
  }
});


// Start consultation with a patient
router.post('/doctor/:doctorId/start-consultation', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const queue = await getOrCreateQueue(req.params.doctorId);
    const patient = queue.startConsultation(appointmentId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found in queue' });
    }
    
    await queue.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointmentId, { 
      status: 'in-progress',
      consultationStartedAt: new Date()
    });

    res.json({
      message: 'Consultation started',
      patient: {
        appointmentId: patient.appointmentId,
        patientId: patient.patientId,
        patientName: patient.patientName
      },
      doctorStatus: queue.doctorStatus
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({ message: 'Failed to start consultation', error: error.message });
  }
});

// End consultation
router.post('/doctor/:doctorId/end-consultation', async (req, res) => {
  try {
    const { appointmentId, notes } = req.body;
    
    const queue = await getOrCreateQueue(req.params.doctorId);
    const result = queue.endConsultation(appointmentId);
    
    await queue.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointmentId, { 
      status: 'completed',
      consultationEndedAt: new Date(),
      consultationNotes: notes
    });

    res.json({
      message: 'Consultation ended',
      nextPatient: result?.appointmentId ? {
        appointmentId: result.appointmentId,
        patientName: result.patientName
      } : null,
      stats: queue.getStats()
    });
  } catch (error) {
    console.error('End consultation error:', error);
    res.status(500).json({ message: 'Failed to end consultation', error: error.message });
  }
});

// Mark patient as no-show
router.post('/doctor/:doctorId/no-show', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const queue = await getOrCreateQueue(req.params.doctorId);
    
    const entry = queue.queue.find(q => 
      q.appointmentId.toString() === appointmentId
    );
    
    if (entry) {
      entry.status = 'no-show';
      await queue.save();
      
      await Appointment.findByIdAndUpdate(appointmentId, { 
        status: 'no-show'
      });
    }

    // Auto-call next
    const nextPatient = queue.callNextPatient();
    await queue.save();

    res.json({
      message: 'Marked as no-show',
      nextPatient: nextPatient ? {
        appointmentId: nextPatient.appointmentId,
        patientName: nextPatient.patientName
      } : null
    });
  } catch (error) {
    console.error('No-show error:', error);
    res.status(500).json({ message: 'Failed to mark no-show', error: error.message });
  }
});

// Get queue history for today
router.get('/doctor/:doctorId/history', async (req, res) => {
  try {
    const queue = await getOrCreateQueue(req.params.doctorId);
    
    const completedQueue = queue.queue.filter(q => 
      ['completed', 'no-show', 'cancelled'].includes(q.status)
    );

    res.json({
      history: completedQueue,
      stats: {
        completed: completedQueue.filter(q => q.status === 'completed').length,
        noShow: completedQueue.filter(q => q.status === 'no-show').length,
        cancelled: completedQueue.filter(q => q.status === 'cancelled').length,
        avgConsultationTime: queue.avgConsultationTime
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to get history', error: error.message });
  }
});

// ==================== MESSAGING ====================

// Send message to clinic (from patient in waiting room)
router.post('/message', async (req, res) => {
  try {
    const { appointmentId, message, senderType } = req.body;
    
    // In a real app, you'd store this in a messages collection
    // and potentially use WebSockets for real-time delivery
    
    // For now, just acknowledge receipt
    res.json({
      message: 'Message sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

module.exports = router;
