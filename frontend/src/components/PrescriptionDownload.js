// frontend/src/components/PrescriptionDownload.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PrescriptionDownload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const PrescriptionDownload = ({ prescription, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const generatePrescriptionHTML = () => {
    const patient = prescription.patientId || {};
    const doctor = prescription.doctorId || {};
    const clinic = prescription.clinicId || {};
    const date = new Date(prescription.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const medicinesHTML = prescription.medicines?.map((med, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${med.name}</strong></td>
        <td>${med.dosage}</td>
        <td>${med.frequency}</td>
        <td>${med.duration}</td>
        <td>${med.timing?.replace('_', ' ') || '-'}</td>
      </tr>
    `).join('') || '<tr><td colspan="6">No medicines prescribed</td></tr>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${prescription.prescriptionNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .clinic-name { font-size: 24px; font-weight: bold; color: #667eea; }
    .clinic-details { font-size: 11px; color: #6b7280; margin-top: 5px; }
    .rx-symbol { font-size: 48px; color: #667eea; font-weight: bold; }
    .prescription-number { background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 11px; display: inline-block; margin-top: 10px; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
    .info-box h4 { color: #667eea; font-size: 12px; margin-bottom: 8px; }
    .info-box p { margin: 3px 0; }
    .diagnosis { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .diagnosis h3 { color: #92400e; margin-bottom: 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #667eea; color: white; padding: 12px 10px; text-align: left; font-size: 11px; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .advice { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .advice h3 { color: #065f46; margin-bottom: 8px; font-size: 14px; }
    .follow-up { background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .follow-up h3 { color: #1d4ed8; margin-bottom: 8px; font-size: 14px; }
    .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; display: flex; justify-content: space-between; }
    .signature { text-align: right; }
    .signature-line { border-top: 1px solid #1f2937; width: 200px; margin-top: 40px; padding-top: 5px; }
    .disclaimer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e5e7eb; font-size: 10px; color: #9ca3af; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="clinic-name">🏥 ${clinic.name || 'HealthSync Clinic'}</div>
        <div class="clinic-details">
          ${clinic.address || 'Healthcare Services'}<br>
          ${clinic.phone ? `📞 ${clinic.phone}` : ''} ${clinic.email ? `| ✉️ ${clinic.email}` : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="rx-symbol">℞</div>
        <div class="prescription-number">${prescription.prescriptionNumber}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-box">
        <h4>👤 Patient Information</h4>
        <p><strong>${patient.name || 'Patient'}</strong></p>
        <p>📧 ${patient.email || '-'}</p>
        <p>📱 ${patient.phone || '-'}</p>
      </div>
      <div class="info-box" style="text-align: right;">
        <h4>👨‍⚕️ Doctor Information</h4>
        <p><strong>Dr. ${doctor.name || 'Doctor'}</strong></p>
        <p>${doctor.specialization || 'General Physician'}</p>
        <p>${doctor.qualification || 'MBBS'}</p>
      </div>
    </div>

    <p style="margin-bottom: 20px; color: #6b7280;">📅 Date: ${date}</p>

    ${prescription.vitals ? `
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">📊 Vitals</h3>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        ${prescription.vitals.bloodPressure ? `<div><small>BP:</small> <strong>${prescription.vitals.bloodPressure}</strong></div>` : ''}
        ${prescription.vitals.pulse ? `<div><small>Pulse:</small> <strong>${prescription.vitals.pulse}</strong></div>` : ''}
        ${prescription.vitals.temperature ? `<div><small>Temp:</small> <strong>${prescription.vitals.temperature}</strong></div>` : ''}
        ${prescription.vitals.weight ? `<div><small>Weight:</small> <strong>${prescription.vitals.weight}</strong></div>` : ''}
      </div>
    </div>
    ` : ''}

    ${prescription.diagnosis ? `
    <div class="diagnosis">
      <h3>🔍 Diagnosis</h3>
      <p>${prescription.diagnosis}</p>
      ${prescription.symptoms?.length > 0 ? `<p style="margin-top: 8px;"><strong>Symptoms:</strong> ${prescription.symptoms.join(', ')}</p>` : ''}
    </div>
    ` : ''}

    <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">💊 Prescribed Medicines</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medicine Name</th>
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

    ${prescription.labTests?.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">📋 Lab Tests Recommended</h3>
      <ul style="padding-left: 20px;">
        ${prescription.labTests.map(test => `<li>${test.name} ${test.urgent ? '<strong style="color: #ef4444;">(URGENT)</strong>' : ''}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${prescription.advice || prescription.dietaryInstructions ? `
    <div class="advice">
      <h3>📝 Advice & Instructions</h3>
      ${prescription.advice ? `<p>${prescription.advice}</p>` : ''}
      ${prescription.dietaryInstructions ? `<p style="margin-top: 8px;"><strong>Diet:</strong> ${prescription.dietaryInstructions}</p>` : ''}
    </div>
    ` : ''}

    ${prescription.followUpDate ? `
    <div class="follow-up">
      <h3>📆 Follow-up</h3>
      <p><strong>Date:</strong> ${new Date(prescription.followUpDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${prescription.followUpInstructions ? `<p>${prescription.followUpInstructions}</p>` : ''}
    </div>
    ` : ''}

    <div class="footer">
      <div>
        <p style="font-size: 10px; color: #6b7280;">
          Generated on: ${new Date().toLocaleString('en-IN')}<br>
          Valid until: ${prescription.validUntil ? new Date(prescription.validUntil).toLocaleDateString('en-IN') : '30 days from issue'}
        </p>
      </div>
      <div class="signature">
        <div class="signature-line">
          <strong>Dr. ${doctor.name || 'Doctor'}</strong><br>
          <small>${doctor.qualification || ''} | ${doctor.specialization || ''}</small>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <p>This is a computer-generated prescription from HealthSync Healthcare Platform.</p>
      <p>For any queries, contact: support@healthsyncpro.in | +91-7001268485</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const html = generatePrescriptionHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescription.prescriptionNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Prescription downloaded! Open in browser and print as PDF.');
    } catch (error) {
      toast.error('Failed to download prescription');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const html = generatePrescriptionHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="prescription-download-modal">
      <div className="prescription-download-content">
        <div className="prescription-download-header">
          <h3>
            <i className="fas fa-file-prescription"></i>
            Prescription - {prescription.prescriptionNumber}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="prescription-preview">
          <div className="preview-header">
            <div className="clinic-info">
              <h4>🏥 {prescription.clinicId?.name || 'HealthSync Clinic'}</h4>
              <p>{prescription.clinicId?.address || ''}</p>
            </div>
            <div className="rx-badge">℞</div>
          </div>

          <div className="preview-info">
            <div>
              <strong>Patient:</strong> {prescription.patientId?.name || 'Patient'}
            </div>
            <div>
              <strong>Doctor:</strong> Dr. {prescription.doctorId?.name || 'Doctor'}
            </div>
            <div>
              <strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>

          {prescription.diagnosis && (
            <div className="preview-diagnosis">
              <strong>Diagnosis:</strong> {prescription.diagnosis}
            </div>
          )}

          <div className="preview-medicines">
            <strong>Medicines ({prescription.medicines?.length || 0}):</strong>
            <ul>
              {prescription.medicines?.slice(0, 3).map((med, i) => (
                <li key={i}>{med.name} - {med.dosage} - {med.frequency}</li>
              ))}
              {prescription.medicines?.length > 3 && (
                <li className="more">+{prescription.medicines.length - 3} more medicines</li>
              )}
            </ul>
          </div>
        </div>

        <div className="prescription-download-actions">
          <button 
            className="btn-download"
            onClick={handleDownload}
            disabled={downloading}
          >
            <i className="fas fa-download"></i>
            {downloading ? 'Downloading...' : 'Download HTML'}
          </button>
          <button 
            className="btn-print"
            onClick={handlePrint}
          >
            <i className="fas fa-print"></i>
            Print / Save as PDF
          </button>
        </div>

        <p className="download-tip">
          <i className="fas fa-info-circle"></i>
          Tip: Click "Print" and select "Save as PDF" to get a PDF file.
        </p>
      </div>
    </div>
  );
};

export default PrescriptionDownload;
