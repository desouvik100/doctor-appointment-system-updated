// backend/routes/exportRoutes.js
// Export health data for patients

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');
const MedicalRecord = require('../models/MedicalRecord');
const { generatePrescriptionHTML } = require('../services/pdfService');

// Export all health data for a patient
router.get('/health-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;

    // Fetch all patient data
    const [user, appointments, prescriptions, labReports] = await Promise.all([
      User.findById(userId).select('-password'),
      Appointment.find({ userId })
        .populate('doctorId', 'name specialization')
        .populate('clinicId', 'name address')
        .sort({ date: -1 }),
      Prescription.find({ patientId: userId })
        .populate('doctorId', 'name specialization')
        .sort({ createdAt: -1 }),
      LabReport.find({ patientId: userId }).sort({ createdAt: -1 })
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      patient: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        medicalHistory: user.medicalHistory,
        familyMembers: user.familyMembers
      },
      appointments: appointments.map(apt => ({
        date: apt.date,
        time: apt.time,
        doctor: apt.doctorId?.name,
        specialization: apt.doctorId?.specialization,
        clinic: apt.clinicId?.name,
        type: apt.consultationType,
        status: apt.status,
        reason: apt.reason
      })),
      prescriptions: prescriptions.map(rx => ({
        prescriptionNumber: rx.prescriptionNumber,
        date: rx.createdAt,
        doctor: rx.doctorId?.name,
        diagnosis: rx.diagnosis,
        medicines: rx.medicines,
        advice: rx.advice,
        followUpDate: rx.followUpDate
      })),
      labReports: labReports.map(report => ({
        name: report.name,
        date: report.createdAt,
        type: report.type,
        results: report.results
      })),
      statistics: {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        totalPrescriptions: prescriptions.length,
        totalLabReports: labReports.length
      }
    };

    if (format === 'html') {
      // Generate HTML report
      const html = generateHealthReportHTML(exportData);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=health-data-${userId}-${Date.now()}.html`);
      return res.send(html);
    }

    res.json(exportData);
  } catch (error) {
    console.error('Export health data error:', error);
    res.status(500).json({ message: 'Failed to export health data', error: error.message });
  }
});

// Export prescriptions for a patient
router.get('/prescriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const prescriptions = await Prescription.find({ patientId: userId })
      .populate('doctorId', 'name specialization qualification registrationNumber')
      .populate('clinicId', 'name address phone')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json({
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    console.error('Export prescriptions error:', error);
    res.status(500).json({ message: 'Failed to export prescriptions', error: error.message });
  }
});

// Export appointment history
router.get('/appointments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { userId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 });

    res.json({
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Export appointments error:', error);
    res.status(500).json({ message: 'Failed to export appointments', error: error.message });
  }
});

// Generate medical history timeline
router.get('/timeline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all events
    const [appointments, prescriptions, labReports] = await Promise.all([
      Appointment.find({ userId, status: 'completed' })
        .populate('doctorId', 'name specialization')
        .lean(),
      Prescription.find({ patientId: userId })
        .populate('doctorId', 'name')
        .lean(),
      LabReport.find({ patientId: userId }).lean()
    ]);

    // Create timeline events
    const timeline = [];

    appointments.forEach(apt => {
      timeline.push({
        type: 'appointment',
        date: apt.date,
        title: `Consultation with Dr. ${apt.doctorId?.name || 'Doctor'}`,
        subtitle: apt.doctorId?.specialization || '',
        description: apt.reason || 'Medical consultation',
        icon: '👨‍⚕️',
        data: apt
      });
    });

    prescriptions.forEach(rx => {
      timeline.push({
        type: 'prescription',
        date: rx.createdAt,
        title: `Prescription - ${rx.prescriptionNumber}`,
        subtitle: `Dr. ${rx.doctorId?.name || 'Doctor'}`,
        description: rx.diagnosis || `${rx.medicines?.length || 0} medicines prescribed`,
        icon: '💊',
        data: rx
      });
    });

    labReports.forEach(report => {
      timeline.push({
        type: 'lab_report',
        date: report.createdAt,
        title: report.name,
        subtitle: report.type || 'Lab Report',
        description: report.notes || 'Lab test results',
        icon: '🔬',
        data: report
      });
    });

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      count: timeline.length,
      timeline
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ message: 'Failed to generate timeline', error: error.message });
  }
});

// Helper function to generate HTML health report
function generateHealthReportHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Health Data Export - ${data.patient.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
    .header h1 { color: #667eea; font-size: 28px; }
    .header p { color: #6b7280; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #667eea; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
    .card { background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .card h3 { color: #1f2937; font-size: 16px; margin-bottom: 10px; }
    .card p { color: #4b5563; margin: 5px 0; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
    .stat-card .number { font-size: 32px; font-weight: bold; }
    .stat-card .label { font-size: 12px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 HealthSync - Health Data Export</h1>
    <p>Generated on ${new Date(data.exportDate).toLocaleString('en-IN')}</p>
  </div>

  <div class="section">
    <h2>👤 Patient Information</h2>
    <div class="card">
      <p><strong>Name:</strong> ${data.patient.name}</p>
      <p><strong>Email:</strong> ${data.patient.email}</p>
      <p><strong>Phone:</strong> ${data.patient.phone || 'Not provided'}</p>
      ${data.patient.medicalHistory?.bloodGroup ? `<p><strong>Blood Group:</strong> ${data.patient.medicalHistory.bloodGroup}</p>` : ''}
      ${data.patient.medicalHistory?.allergies?.length > 0 ? `<p><strong>Allergies:</strong> ${data.patient.medicalHistory.allergies.join(', ')}</p>` : ''}
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="number">${data.statistics.totalAppointments}</div>
      <div class="label">Total Appointments</div>
    </div>
    <div class="stat-card">
      <div class="number">${data.statistics.completedAppointments}</div>
      <div class="label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="number">${data.statistics.totalPrescriptions}</div>
      <div class="label">Prescriptions</div>
    </div>
    <div class="stat-card">
      <div class="number">${data.statistics.totalLabReports}</div>
      <div class="label">Lab Reports</div>
    </div>
  </div>

  <div class="section">
    <h2>📅 Appointment History</h2>
    ${data.appointments.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Doctor</th>
          <th>Specialization</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.appointments.map(apt => `
        <tr>
          <td>${new Date(apt.date).toLocaleDateString('en-IN')} ${apt.time}</td>
          <td>${apt.doctor || '-'}</td>
          <td>${apt.specialization || '-'}</td>
          <td>${apt.type || 'In-Person'}</td>
          <td>${apt.status}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p>No appointments found.</p>'}
  </div>

  <div class="section">
    <h2>💊 Prescriptions</h2>
    ${data.prescriptions.map(rx => `
    <div class="card">
      <h3>${rx.prescriptionNumber} - ${new Date(rx.date).toLocaleDateString('en-IN')}</h3>
      <p><strong>Doctor:</strong> ${rx.doctor || '-'}</p>
      ${rx.diagnosis ? `<p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>` : ''}
      ${rx.medicines?.length > 0 ? `
      <p><strong>Medicines:</strong></p>
      <ul>
        ${rx.medicines.map(med => `<li>${med.name} - ${med.dosage} - ${med.frequency} for ${med.duration}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
    `).join('') || '<p>No prescriptions found.</p>'}
  </div>

  <div class="footer">
    <p>This document was generated by HealthSync Healthcare Platform</p>
    <p>For any queries, contact: support@healthsync.com | +91-7001268485</p>
  </div>
</body>
</html>
  `;
}

module.exports = router;
