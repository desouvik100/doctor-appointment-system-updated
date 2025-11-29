// backend/routes/consultationRoutes.js
const express = require('express');
const Appointment = require('../models/Appointment');
const { generateGoogleMeetLink } = require('../services/googleMeetService');
const { sendAppointmentEmail } = require('../services/emailService');
const router = express.Router();

// Start consultation - generates meet link if not exists
router.post('/:appointmentId/start', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.consultationType !== 'online') {
      return res.status(400).json({ success: false, message: 'This is not an online consultation' });
    }

    // Check if appointment is confirmed
    if (appointment.status !== 'confirmed' && appointment.status !== 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        message: 'Appointment must be approved/confirmed before starting consultation' 
      });
    }

    // Check time window (15 minutes before to 60 minutes after)
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    const sixtyMinutesAfter = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);

    if (now < fifteenMinutesBefore) {
      const minutesUntil = Math.ceil((fifteenMinutesBefore - now) / (60 * 1000));
      return res.status(400).json({ 
        success: false, 
        message: `Too early! You can join 15 minutes before the scheduled time. Opens in ${minutesUntil} minutes.` 
      });
    }

    if (now > sixtyMinutesAfter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Consultation window has closed' 
      });
    }

    // Generate meet link if not exists
    if (!appointment.googleMeetLink && !appointment.meetingLink) {
      console.log(`🔄 Generating Meet link for consultation ${appointment._id}...`);
      
      const meetResult = await generateGoogleMeetLink(appointment);
      
      if (meetResult.success) {
        appointment.googleMeetLink = meetResult.meetLink;
        appointment.googleEventId = meetResult.eventId;
        appointment.meetLinkGenerated = true;
        appointment.meetLinkGeneratedAt = new Date();
        appointment.meetingLink = meetResult.meetLink;
        
        console.log(`✅ Meet link generated: ${meetResult.meetLink}`);
      }
    }

    // Update status to in_progress
    if (appointment.status === 'confirmed') {
      appointment.status = 'in_progress';
      appointment.consultationStatus = 'in_progress';
      appointment.consultationStartTime = new Date();
    }

    await appointment.save();

    const meetLink = appointment.googleMeetLink || appointment.meetingLink;

    res.json({
      success: true,
      message: 'Consultation started',
      meetLink,
      joinCode: appointment.joinCode,
      appointment: {
        id: appointment._id,
        patient: appointment.userId,
        doctor: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get consultation details
router.get('/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const meetLink = appointment.googleMeetLink || appointment.meetingLink;

    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        patient: appointment.userId,
        doctor: appointment.doctorId,
        clinic: appointment.clinicId,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
        status: appointment.status,
        consultationType: appointment.consultationType,
        meetLink,
        joinCode: appointment.joinCode,
        meetLinkGenerated: appointment.meetLinkGenerated,
        consultationStatus: appointment.consultationStatus
      }
    });

  } catch (error) {
    console.error('Error getting consultation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Resend meet link emails
router.post('/:appointmentId/resend-emails', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email')
      .populate('doctorId', 'name email specialization')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const meetLink = appointment.googleMeetLink || appointment.meetingLink;
    
    if (!meetLink) {
      return res.status(400).json({ success: false, message: 'No meeting link generated yet' });
    }

    const results = { patient: false, doctor: false };

    // Send to patient
    try {
      await sendAppointmentEmail(appointment, 'patient');
      results.patient = true;
      console.log(`✅ Email resent to patient: ${appointment.userId.email}`);
    } catch (err) {
      console.error('Failed to send to patient:', err.message);
    }

    // Send to doctor
    if (appointment.doctorId?.email) {
      try {
        await sendAppointmentEmail(appointment, 'doctor');
        results.doctor = true;
        console.log(`✅ Email resent to doctor: ${appointment.doctorId.email}`);
      } catch (err) {
        console.error('Failed to send to doctor:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'Emails sent',
      results
    });

  } catch (error) {
    console.error('Error resending emails:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
