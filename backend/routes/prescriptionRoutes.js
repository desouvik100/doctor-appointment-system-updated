const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Create prescription (Doctor only)
router.post('/create', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpInstructions,
      vitals,
      allergies
    } = req.body;

    // Validate appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Create prescription
    const prescription = new Prescription({
      appointmentId,
      patientId: patientId || appointment.userId,
      doctorId: doctorId || appointment.doctorId,
      clinicId: appointment.clinicId,
      diagnosis,
      symptoms,
      medicines,
      labTests,
      advice,
      dietaryInstructions,
      followUpDate,
      followUpInstructions,
      vitals,
      allergies,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
    });

    await prescription.save();

    // Update appointment with prescription reference
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization qualification')
      .populate('clinicId', 'name address')
      .populate('appointmentId', 'date time reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// Get prescriptions by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescriptions by doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(prescriptions);
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescription by appointment
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointmentId: req.params.appointmentId })
      .populate('patientId', 'name email phone dateOfBirth gender')
      .populate('doctorId', 'name specialization qualification registrationNumber')
      .populate('clinicId', 'name address phone');

    if (!prescription) {
      return res.status(404).json({ message: 'No prescription found for this appointment' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Get appointment prescription error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// Update prescription
router.put('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ message: 'Failed to update prescription', error: error.message });
  }
});

// Finalize prescription
router.post('/:id/finalize', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.status = 'finalized';
    prescription.digitalSignature = `DS-${Date.now()}-${prescription.doctorId}`;
    await prescription.save();

    res.json({
      message: 'Prescription finalized successfully',
      prescription
    });
  } catch (error) {
    console.error('Finalize prescription error:', error);
    res.status(500).json({ message: 'Failed to finalize prescription', error: error.message });
  }
});

// Send prescription to patient
router.post('/:id/send', async (req, res) => {
  try {
    const { via } = req.body; // ['email', 'sms', 'whatsapp', 'app']
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Mark as sent
    prescription.status = 'sent';
    prescription.sentAt = new Date();
    prescription.sentVia = via || ['app'];
    await prescription.save();

    // Send notifications based on 'via' array
    const notifications = [];
    
    if (via?.includes('sms') && prescription.patientId?.phone) {
      try {
        const { sendPrescriptionReadySMS } = require('../services/smsService');
        await sendPrescriptionReadySMS(prescription.patientId.phone, prescription.doctorId?.name);
        notifications.push('sms');
      } catch (smsError) {
        console.warn('SMS notification failed:', smsError.message);
      }
    }

    if (via?.includes('email') && prescription.patientId?.email) {
      try {
        const { sendEmail } = require('../services/emailService');
        await sendEmail({
          to: prescription.patientId.email,
          subject: `Prescription from Dr. ${prescription.doctorId?.name || 'Doctor'} - HealthSync`,
          html: `<p>Your prescription is ready. Please login to HealthSync to view and download it.</p>`,
          text: `Your prescription from Dr. ${prescription.doctorId?.name} is ready. Login to HealthSync to view it.`
        });
        notifications.push('email');
      } catch (emailError) {
        console.warn('Email notification failed:', emailError.message);
      }
    }

    res.json({
      message: 'Prescription sent successfully',
      prescription,
      notificationsSent: notifications
    });
  } catch (error) {
    console.error('Send prescription error:', error);
    res.status(500).json({ message: 'Failed to send prescription', error: error.message });
  }
});

// Get prescription for download/print (formatted)
router.get('/:id/download', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone dateOfBirth gender address')
      .populate('doctorId', 'name specialization qualification registrationNumber phone email')
      .populate('clinicId', 'name address phone email')
      .populate('appointmentId', 'date time reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Return formatted prescription data for PDF generation
    res.json({
      prescription,
      generatedAt: new Date(),
      downloadUrl: `/api/prescriptions/${prescription._id}/pdf`
    });
  } catch (error) {
    console.error('Download prescription error:', error);
    res.status(500).json({ message: 'Failed to prepare prescription', error: error.message });
  }
});

// View digital prescription as HTML (for viewing/printing/PDF)
router.get('/:id/view', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone dateOfBirth gender address')
      .populate('doctorId', 'name specialization qualification registrationNumber phone email')
      .populate('clinicId', 'name address phone email')
      .populate('appointmentId', 'date time reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const html = generatePrescriptionHTML(prescription);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('View prescription error:', error);
    res.status(500).json({ message: 'Failed to view prescription', error: error.message });
  }
});

// Generate professional prescription HTML
function generatePrescriptionHTML(prescription) {
  const patient = prescription.patientId || {};
  const doctor = prescription.doctorId || {};
  const clinic = prescription.clinicId || {};
  const appointment = prescription.appointmentId || {};
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const timingLabels = {
    'before_food': 'Before Food',
    'after_food': 'After Food',
    'with_food': 'With Food',
    'empty_stomach': 'Empty Stomach',
    'bedtime': 'At Bedtime',
    'as_needed': 'As Needed'
  };

  const medicinesHTML = prescription.medicines?.map((med, i) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${med.name}</strong>
        ${med.instructions ? `<br><small style="color: #6b7280;">${med.instructions}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.dosage}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.frequency}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.duration}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${timingLabels[med.timing] || med.timing}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="padding: 12px; text-align: center;">No medicines prescribed</td></tr>';

  const labTestsHTML = prescription.labTests?.length > 0 ? `
    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <h4 style="margin: 0 0 10px 0; color: #92400e;">🔬 Lab Tests Recommended</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${prescription.labTests.map(test => `
          <li style="margin: 5px 0;">
            <strong>${test.name}</strong>
            ${test.urgent ? '<span style="color: #dc2626; font-size: 12px;"> (URGENT)</span>' : ''}
            ${test.instructions ? `<br><small style="color: #6b7280;">${test.instructions}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const qrData = encodeURIComponent(`HealthSync Prescription\nRx: ${prescription.prescriptionNumber}\nPatient: ${patient.name}\nDoctor: Dr. ${doctor.name}\nDate: ${formatDate(prescription.createdAt)}`);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription ${prescription.prescriptionNumber} - HealthSync</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 20px; color: #1f2937; }
    .prescription-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .clinic-info h1 { font-size: 24px; margin-bottom: 5px; }
    .clinic-info p { opacity: 0.9; font-size: 14px; }
    .rx-symbol { font-size: 60px; font-weight: 700; opacity: 0.3; }
    .doctor-info { background: #f0fdf4; padding: 20px 30px; border-bottom: 2px solid #10b981; }
    .doctor-info h3 { color: #059669; margin-bottom: 5px; }
    .doctor-info p { color: #6b7280; font-size: 14px; }
    .content { padding: 30px; }
    .patient-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .patient-section .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .patient-section .value { font-size: 15px; font-weight: 500; color: #1f2937; }
    .section-title { font-size: 16px; font-weight: 600; color: #059669; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #d1fae5; }
    .diagnosis-box { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .diagnosis-box h4 { color: #059669; margin-bottom: 8px; }
    .medicines-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .medicines-table th { background: #059669; color: white; padding: 12px; text-align: left; font-size: 13px; }
    .medicines-table td { font-size: 14px; }
    .advice-box { background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6; }
    .advice-box h4 { color: #1d4ed8; margin-bottom: 8px; }
    .footer { background: #1f2937; color: white; padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; }
    .footer-left p { font-size: 13px; opacity: 0.8; margin: 3px 0; }
    .qr-section { display: flex; align-items: center; gap: 15px; }
    .qr-section img { width: 70px; height: 70px; background: white; border-radius: 8px; padding: 5px; }
    .signature-section { margin-top: 40px; text-align: right; padding-right: 30px; }
    .signature-line { border-top: 2px solid #1f2937; width: 200px; margin-left: auto; padding-top: 8px; }
    .download-bar { max-width: 800px; margin: 0 auto 20px; display: flex; gap: 15px; justify-content: flex-end; }
    .download-btn { padding: 12px 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
    .download-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
    .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .vital-item { background: #f9fafb; padding: 10px; border-radius: 6px; text-align: center; }
    .vital-item .label { font-size: 11px; color: #6b7280; }
    .vital-item .value { font-size: 16px; font-weight: 600; color: #1f2937; }
    @media print {
      body { background: white; padding: 0; }
      .prescription-container { box-shadow: none; }
      .download-bar { display: none !important; }
    }
    @media (max-width: 600px) {
      .patient-section { grid-template-columns: 1fr; }
      .vitals-grid { grid-template-columns: repeat(2, 1fr); }
      .header { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="download-bar">
    <button class="download-btn" onclick="window.print()">📄 Download PDF</button>
    <button class="download-btn" onclick="window.print()">🖨️ Print</button>
  </div>

  <div class="prescription-container">
    <div class="header">
      <div class="clinic-info">
        <h1>🏥 ${clinic.name || 'HealthSync Clinic'}</h1>
        <p>📍 ${clinic.address || 'Bankura, West Bengal'}</p>
        <p>📞 ${clinic.phone || '+91-7001268485'} | ✉️ ${clinic.email || 'desouvik0000@gmail.com'}</p>
      </div>
      <div class="rx-symbol">℞</div>
    </div>

    <div class="doctor-info">
      <h3>Dr. ${doctor.name || 'Doctor'}</h3>
      <p>${doctor.specialization || 'General Physician'} | ${doctor.qualification || 'MBBS'}</p>
      <p>Reg. No: ${doctor.registrationNumber || 'N/A'}</p>
    </div>

    <div class="content">
      <div class="patient-section">
        <div><span class="label">Patient Name</span><div class="value">${patient.name || 'N/A'}</div></div>
        <div><span class="label">Date</span><div class="value">${formatDate(prescription.createdAt)}</div></div>
        <div><span class="label">Age / Gender</span><div class="value">${patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) + ' yrs' : 'N/A'} / ${patient.gender || 'N/A'}</div></div>
        <div><span class="label">Prescription No.</span><div class="value">${prescription.prescriptionNumber}</div></div>
        <div><span class="label">Phone</span><div class="value">${patient.phone || 'N/A'}</div></div>
        <div><span class="label">Valid Until</span><div class="value">${formatDate(prescription.validUntil)}</div></div>
      </div>

      ${prescription.vitals && Object.values(prescription.vitals).some(v => v) ? `
        <h3 class="section-title">📊 Vitals</h3>
        <div class="vitals-grid">
          ${prescription.vitals.bloodPressure ? `<div class="vital-item"><div class="label">Blood Pressure</div><div class="value">${prescription.vitals.bloodPressure}</div></div>` : ''}
          ${prescription.vitals.pulse ? `<div class="vital-item"><div class="label">Pulse</div><div class="value">${prescription.vitals.pulse} bpm</div></div>` : ''}
          ${prescription.vitals.temperature ? `<div class="vital-item"><div class="label">Temperature</div><div class="value">${prescription.vitals.temperature}°F</div></div>` : ''}
          ${prescription.vitals.spo2 ? `<div class="vital-item"><div class="label">SpO2</div><div class="value">${prescription.vitals.spo2}%</div></div>` : ''}
          ${prescription.vitals.weight ? `<div class="vital-item"><div class="label">Weight</div><div class="value">${prescription.vitals.weight} kg</div></div>` : ''}
          ${prescription.vitals.bloodSugar ? `<div class="vital-item"><div class="label">Blood Sugar</div><div class="value">${prescription.vitals.bloodSugar}</div></div>` : ''}
        </div>
      ` : ''}

      ${prescription.diagnosis ? `
        <div class="diagnosis-box">
          <h4>🩺 Diagnosis</h4>
          <p>${prescription.diagnosis}</p>
          ${prescription.symptoms?.length > 0 ? `<p style="margin-top: 8px; color: #6b7280;"><strong>Symptoms:</strong> ${prescription.symptoms.join(', ')}</p>` : ''}
        </div>
      ` : ''}

      ${prescription.allergies?.length > 0 ? `
        <div style="background: #fef2f2; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
          <strong style="color: #dc2626;">⚠️ Allergies:</strong> ${prescription.allergies.join(', ')}
        </div>
      ` : ''}

      <h3 class="section-title">💊 Medicines</h3>
      <table class="medicines-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Timing</th>
          </tr>
        </thead>
        <tbody>
          ${medicinesHTML}
        </tbody>
      </table>

      ${labTestsHTML}

      ${prescription.advice ? `
        <div class="advice-box">
          <h4>📝 Doctor's Advice</h4>
          <p>${prescription.advice}</p>
        </div>
      ` : ''}

      ${prescription.dietaryInstructions ? `
        <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #eab308;">
          <h4 style="color: #a16207; margin-bottom: 8px;">🥗 Dietary Instructions</h4>
          <p>${prescription.dietaryInstructions}</p>
        </div>
      ` : ''}

      ${prescription.followUpDate ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #0ea5e9;">
          <h4 style="color: #0369a1; margin-bottom: 8px;">📅 Follow-up</h4>
          <p><strong>Date:</strong> ${formatDate(prescription.followUpDate)}</p>
          ${prescription.followUpInstructions ? `<p style="margin-top: 5px;">${prescription.followUpInstructions}</p>` : ''}
        </div>
      ` : ''}

      <div class="signature-section">
        <p style="font-size: 12px; color: #6b7280;">Digital Signature: ${prescription.digitalSignature || 'Pending'}</p>
        <div class="signature-line">
          <strong>Dr. ${doctor.name || 'Doctor'}</strong>
          <p style="font-size: 12px; color: #6b7280;">${doctor.specialization || ''}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <p><strong>HealthSync</strong> - Digital Healthcare Platform</p>
        <p>This is a computer-generated prescription</p>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      </div>
      <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${qrData}" alt="QR Code" />
        <div style="font-size: 11px;">
          <strong>Scan to verify</strong><br>
          ${prescription.prescriptionNumber}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = router;
