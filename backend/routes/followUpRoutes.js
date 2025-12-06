const express = require('express');
const router = express.Router();
const FollowUp = require('../models/FollowUp');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('../services/emailService');

// Create follow-up (by doctor)
router.post('/', async (req, res) => {
  try {
    const followUp = new FollowUp(req.body);
    await followUp.save();
    
    // Send reminder email to patient
    const appointment = await Appointment.findById(req.body.originalAppointmentId).populate('userId');
    if (appointment?.userId?.email) {
      await sendEmail({
        to: appointment.userId.email,
        subject: '📅 Follow-up Appointment Scheduled - HealthSync',
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Follow-up Reminder</h2>
            <p>Your doctor has scheduled a follow-up appointment.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Date:</strong> ${new Date(req.body.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>Reason:</strong> ${req.body.reason || 'Follow-up consultation'}</p>
              <p><strong>Discount:</strong> ${req.body.discountPercent || 20}% off on follow-up</p>
            </div>
            <p>${req.body.instructions || ''}</p>
            <a href="${process.env.FRONTEND_URL}/patient/appointments" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px;">Book Follow-up</a>
          </div>
        `
      });
    }
    
    res.status(201).json({ message: 'Follow-up scheduled', followUp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get follow-ups for patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const followUps = await FollowUp.find({ patientId: req.params.patientId, status: 'scheduled' })
      .populate('doctorId', 'name specialization')
      .sort({ scheduledDate: 1 });
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get follow-ups created by doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const followUps = await FollowUp.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email')
      .sort({ scheduledDate: -1 });
    res.json(followUps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book follow-up appointment
router.post('/book/:followUpId', async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.followUpId);
    const { date, time, appointmentType } = req.body;
    
    // Create appointment with discount
    const originalApt = await Appointment.findById(followUp.originalAppointmentId);
    const discountedFee = originalApt.consultationFee * (1 - followUp.discountPercent / 100);
    
    const appointment = new Appointment({
      userId: followUp.patientId,
      doctorId: followUp.doctorId,
      clinicId: originalApt.clinicId,
      date,
      time,
      appointmentType: appointmentType || 'video',
      consultationFee: Math.round(discountedFee),
      isFollowUp: true,
      followUpId: followUp._id,
      status: 'scheduled'
    });
    
    await appointment.save();
    
    followUp.status = 'booked';
    followUp.bookedAppointmentId = appointment._id;
    await followUp.save();
    
    res.json({ message: 'Follow-up booked', appointment, discount: followUp.discountPercent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
