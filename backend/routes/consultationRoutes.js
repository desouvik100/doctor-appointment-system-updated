const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { getConsultationDuration } = require('../services/socketService');

// Start consultation
router.post('/:appointmentId/start', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment is approved
    if (appointment.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Consultation can only be started for approved appointments' 
      });
    }

    // Check if it's an online consultation
    if (appointment.consultationType !== 'online') {
      return res.status(400).json({ 
        message: 'This is not an online consultation' 
      });
    }

    // Check if consultation can be started (15 minutes before)
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60000);

    if (now < fifteenMinutesBefore) {
      return res.status(403).json({ 
        message: 'Consultation can be started 15 minutes before the scheduled time',
        opensAt: fifteenMinutesBefore
      });
    }

    // Update appointment status
    appointment.consultationStatus = 'in_progress';
    appointment.consultationStartTime = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Consultation started',
      appointment
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End consultation
router.post('/:appointmentId/end', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const duration = getConsultationDuration(appointmentId);

    // Update appointment
    appointment.consultationStatus = 'completed';
    appointment.consultationEndTime = new Date();
    appointment.consultationDuration = duration;
    appointment.status = 'completed';
    await appointment.save();

    res.json({
      success: true,
      message: 'Consultation ended',
      duration,
      appointment
    });
  } catch (error) {
    console.error('Error ending consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get consultation status
router.get('/:appointmentId/status', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment,
      canStart: appointment.status === 'approved' && 
                appointment.consultationType === 'online'
    });
  } catch (error) {
    console.error('Error getting consultation status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
