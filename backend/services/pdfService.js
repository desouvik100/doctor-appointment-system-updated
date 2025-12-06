// backend/services/pdfService.js
// PDF generation service for prescriptions, invoices, and health reports

// Generate prescription HTML for PDF
function generatePrescriptionHTML(prescription, patient, doctor, clinic, appointment) {
  const date = new Date(prescription.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const appointmentDate = appointment ? new Date(appointment.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : date;

  const medicinesHTML = prescription.medicines?.map((med, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${med.name}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.dosage}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.frequency}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.duration}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.timing?.replace('_', ' ') || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="padding: 10px; text-align: center;">No medicines prescribed</td></tr>';

  const labTestsHTML = prescription.labTests?.length > 0 ? `
    <div style="margin-top: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">📋 Lab Tests Recommended</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${prescription.labTests.map(test => `
          <li style="margin-bottom: 5px;">
            ${test.name} ${test.urgent ? '<span style="color: #ef4444; font-weight: bold;">(URGENT)</span>' : ''}
            ${test.instructions ? `<br><small style="color: #6b7280;">${test.instructions}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  const vitalsHTML = prescription.vitals ? `
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">📊 Vitals</h3>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        ${prescription.vitals.bloodPressure ? `<div><small style="color: #6b7280;">BP</small><br><strong>${prescription.vitals.bloodPressure}</strong></div>` : ''}
        ${prescription.vitals.pulse ? `<div><small style="color: #6b7280;">Pulse</small><br><strong>${prescription.vitals.pulse}</strong></div>` : ''}
        ${prescription.vitals.temperature ? `<div><small style="color: #6b7280;">Temp</small><br><strong>${prescription.vitals.temperature}</strong></div>` : ''}
        ${prescription.vitals.weight ? `<div><small style="color: #6b7280;">Weight</small><br><strong>${prescription.vitals.weight}</strong></div>` : ''}
        ${prescription.vitals.spo2 ? `<div><small style="color: #6b7280;">SpO2</small><br><strong>${prescription.vitals.spo2}</strong></div>` : ''}
        ${prescription.vitals.bloodSugar ? `<div><small style="color: #6b7280;">Blood Sugar</small><br><strong>${prescription.vitals.bloodSugar}</strong></div>` : ''}
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${prescription.prescriptionNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
    .clinic-info { display: flex; justify-content: space-between; align-items: flex-start; }
    .clinic-name { font-size: 24px; font-weight: bold; color: #667eea; }
    .clinic-details { font-size: 11px; color: #6b7280; margin-top: 5px; }
    .rx-symbol { font-size: 48px; color: #667eea; font-weight: bold; }
    .prescription-number { background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 11px; }
    .patient-doctor-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
    .info-section h4 { color: #667eea; font-size: 12px; margin-bottom: 8px; }
    .info-section p { margin: 3px 0; }
    .diagnosis-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .medicines-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .medicines-table th { background: #667eea; color: white; padding: 12px 10px; text-align: left; font-size: 11px; }
    .advice-section { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .follow-up { background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; display: flex; justify-content: space-between; }
    .signature { text-align: right; }
    .signature-line { border-top: 1px solid #1f2937; width: 200px; margin-top: 40px; padding-top: 5px; }
    .watermark { position: fixed; bottom: 20px; right: 20px; opacity: 0.1; font-size: 60px; color: #667eea; transform: rotate(-15deg); }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="clinic-info">
        <div>
          <div class="clinic-name">🏥 ${clinic?.name || 'HealthSync Clinic'}</div>
          <div class="clinic-details">
            ${clinic?.address || 'Healthcare Services'}<br>
            ${clinic?.phone ? `📞 ${clinic.phone}` : ''} ${clinic?.email ? `| ✉️ ${clinic.email}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="rx-symbol">℞</div>
          <div class="prescription-number">${prescription.prescriptionNumber}</div>
        </div>
      </div>
    </div>

    <div class="patient-doctor-info">
      <div class="info-section">
        <h4>👤 Patient Information</h4>
        <p><strong>${patient?.name || 'Patient'}</strong></p>
        <p>📧 ${patient?.email || '-'}</p>
        <p>📱 ${patient?.phone || '-'}</p>
        ${patient?.dateOfBirth ? `<p>🎂 DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')}</p>` : ''}
        ${patient?.gender ? `<p>Gender: ${patient.gender}</p>` : ''}
      </div>
      <div class="info-section" style="text-align: right;">
        <h4>👨‍⚕️ Doctor Information</h4>
        <p><strong>Dr. ${doctor?.name || 'Doctor'}</strong></p>
        <p>${doctor?.specialization || 'General Physician'}</p>
        <p>${doctor?.qualification || 'MBBS'}</p>
        ${doctor?.registrationNumber ? `<p>Reg. No: ${doctor.registrationNumber}</p>` : ''}
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; color: #6b7280;">
      <span>📅 Date: ${appointmentDate}</span>
      <span>⏰ Time: ${appointment?.time || new Date(prescription.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>

    ${vitalsHTML}

    ${prescription.diagnosis ? `
    <div class="diagnosis-section">
      <h3 style="color: #92400e; margin-bottom: 8px; font-size: 14px;">🔍 Diagnosis</h3>
      <p style="font-weight: 500;">${prescription.diagnosis}</p>
      ${prescription.symptoms?.length > 0 ? `<p style="margin-top: 8px; color: #78350f;"><strong>Symptoms:</strong> ${prescription.symptoms.join(', ')}</p>` : ''}
    </div>
    ` : ''}

    <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">💊 Prescribed Medicines</h3>
    <table class="medicines-table">
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
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

    ${labTestsHTML}

    ${prescription.advice || prescription.dietaryInstructions ? `
    <div class="advice-section">
      <h3 style="color: #065f46; margin-bottom: 8px; font-size: 14px;">📝 Advice & Instructions</h3>
      ${prescription.advice ? `<p style="margin-bottom: 8px;">${prescription.advice}</p>` : ''}
      ${prescription.dietaryInstructions ? `<p><strong>Diet:</strong> ${prescription.dietaryInstructions}</p>` : ''}
    </div>
    ` : ''}

    ${prescription.followUpDate ? `
    <div class="follow-up">
      <h3 style="color: #1d4ed8; margin-bottom: 8px; font-size: 14px;">📆 Follow-up</h3>
      <p><strong>Date:</strong> ${new Date(prescription.followUpDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      ${prescription.followUpInstructions ? `<p style="margin-top: 5px;">${prescription.followUpInstructions}</p>` : ''}
    </div>
    ` : ''}

    ${prescription.allergies?.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
      <strong style="color: #dc2626;">⚠️ Known Allergies:</strong> ${prescription.allergies.join(', ')}
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
          <strong>Dr. ${doctor?.name || 'Doctor'}</strong><br>
          <small>${doctor?.qualification || ''} | ${doctor?.specialization || ''}</small>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e5e7eb;">
      <p style="font-size: 10px; color: #9ca3af;">
        This is a computer-generated prescription from HealthSync Healthcare Platform.<br>
        For any queries, contact: support@healthsync.com | +91-7001268485
      </p>
    </div>
  </div>
  <div class="watermark">HealthSync</div>
</body>
</html>
  `;
}

// Generate Invoice HTML
function generateInvoiceHTML(payment, appointment, patient, doctor, clinic) {
  const date = new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const invoiceNumber = payment.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; }
    .container { max-width: 800px; margin: 0 auto; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #667eea; }
    .invoice-title { font-size: 32px; color: #667eea; text-align: right; }
    .invoice-number { font-size: 14px; color: #6b7280; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box h4 { color: #667eea; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; }
    .info-box p { margin: 5px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-section { text-align: right; }
    .total-row { display: flex; justify-content: flex-end; margin: 5px 0; }
    .total-label { width: 150px; text-align: right; padding-right: 20px; }
    .total-value { width: 100px; text-align: right; }
    .grand-total { font-size: 18px; font-weight: bold; color: #667eea; border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 10px; }
    .paid-stamp { position: absolute; top: 50%; right: 50px; transform: rotate(-15deg); font-size: 48px; color: rgba(16, 185, 129, 0.3); font-weight: bold; border: 5px solid rgba(16, 185, 129, 0.3); padding: 10px 30px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container" style="position: relative;">
    ${payment.status === 'completed' || payment.status === 'success' ? '<div class="paid-stamp">PAID</div>' : ''}
    
    <div class="header">
      <div>
        <div class="logo">🏥 HealthSync</div>
        <p style="color: #6b7280; margin-top: 5px;">Healthcare Management Platform</p>
      </div>
      <div style="text-align: right;">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoiceNumber}</div>
        <p style="margin-top: 10px;">Date: ${date}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Bill To</h4>
        <p><strong>${patient?.name || 'Patient'}</strong></p>
        <p>${patient?.email || ''}</p>
        <p>${patient?.phone || ''}</p>
      </div>
      <div class="info-box" style="text-align: right;">
        <h4>Service Provider</h4>
        <p><strong>${clinic?.name || 'HealthSync Clinic'}</strong></p>
        <p>Dr. ${doctor?.name || 'Doctor'}</p>
        <p>${doctor?.specialization || ''}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Date</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Medical Consultation</strong><br>
            <small style="color: #6b7280;">${appointment?.consultationType === 'online' ? 'Online Video Consultation' : 'In-Person Consultation'}</small>
          </td>
          <td>${appointment?.date ? new Date(appointment.date).toLocaleDateString('en-IN') : date}</td>
          <td style="text-align: right;">₹${payment.consultationFee || payment.amount || 0}</td>
        </tr>
        ${payment.platformFee ? `
        <tr>
          <td>Platform Fee</td>
          <td>-</td>
          <td style="text-align: right;">₹${payment.platformFee}</td>
        </tr>
        ` : ''}
        ${payment.tax ? `
        <tr>
          <td>GST (18%)</td>
          <td>-</td>
          <td style="text-align: right;">₹${payment.tax}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">₹${payment.consultationFee || payment.amount || 0}</span>
      </div>
      ${payment.discount ? `
      <div class="total-row" style="color: #10b981;">
        <span class="total-label">Discount:</span>
        <span class="total-value">-₹${payment.discount}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span class="total-label">Total:</span>
        <span class="total-value">₹${payment.totalAmount || payment.amount || 0}</span>
      </div>
    </div>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 30px;">
      <h4 style="margin-bottom: 10px;">Payment Details</h4>
      <p><strong>Status:</strong> ${payment.status === 'completed' || payment.status === 'success' ? '✅ Paid' : '⏳ Pending'}</p>
      <p><strong>Method:</strong> ${payment.paymentMethod || 'Online Payment'}</p>
      ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
    </div>

    <div class="footer">
      <p>Thank you for choosing HealthSync!</p>
      <p style="margin-top: 10px;">
        For queries: support@healthsync.com | +91-7001268485<br>
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  generatePrescriptionHTML,
  generateInvoiceHTML
};
