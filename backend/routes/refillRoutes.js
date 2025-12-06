const express = require('express');
const router = express.Router();
const RefillRequest = require('../models/RefillRequest');
const Prescription = require('../models/Prescription');
const { sendEmail } = require('../services/emailService');

// Create refill request (patient)
router.post('/', async (req, res) => {
  try {
    const refill = new RefillRequest(req.body);
    await refill.save();
    
    // Notify doctor
    const prescription = await Prescription.findById(req.body.originalPrescriptionId).populate('doctorId');
    if (prescription?.doctorId?.email) {
      await sendEmail({
        to: prescription.doctorId.email,
        subject: '💊 New Prescription Refill Request - HealthSync',
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>New Refill Request</h2>
            <p>A patient has requested a prescription refill.</p>
            <p><strong>Medicines:</strong></p>
            <ul>${req.body.medicines.map(m => `<li>${m.name} - ${m.dosage}</li>`).join('')}</ul>
            <p><strong>Patient Notes:</strong> ${req.body.patientNotes || 'None'}</p>
            <a href="${process.env.FRONTEND_URL}/doctor/refills" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Review Request</a>
          </div>
        `
      });
    }
    
    res.status(201).json({ message: 'Refill request submitted', refill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get refill requests for doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const refills = await RefillRequest.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone')
      .populate('originalPrescriptionId')
      .sort({ createdAt: -1 });
    res.json(refills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get refill requests for patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const refills = await RefillRequest.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(refills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process refill request (doctor)
router.put('/:id/process', async (req, res) => {
  try {
    const { status, medicines, doctorNotes } = req.body;
    const refill = await RefillRequest.findById(req.params.id).populate('patientId');
    
    refill.status = status;
    refill.doctorNotes = doctorNotes;
    refill.processedAt = new Date();
    
    if (medicines) {
      refill.medicines = medicines;
    }
    
    await refill.save();
    
    // Notify patient
    if (refill.patientId?.email) {
      const statusText = status === 'approved' ? 'approved ✅' : status === 'partially_approved' ? 'partially approved' : 'needs review';
      await sendEmail({
        to: refill.patientId.email,
        subject: `💊 Refill Request ${statusText} - HealthSync`,
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Refill Request Update</h2>
            <p>Your prescription refill request has been <strong>${statusText}</strong>.</p>
            ${doctorNotes ? `<p><strong>Doctor's Notes:</strong> ${doctorNotes}</p>` : ''}
            <a href="${process.env.FRONTEND_URL}/patient/prescriptions" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View Details</a>
          </div>
        `
      });
    }
    
    res.json({ message: 'Refill request processed', refill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
