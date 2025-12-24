/**
 * Lab PDF Service
 * PDF generation for lab requisitions and clinical summaries
 */

/**
 * Generate Lab Requisition HTML
 * @param {Object} labOrder - Lab order details
 * @param {Object} patient - Patient information
 * @param {Object} doctor - Ordering physician
 * @param {Object} clinic - Clinic information
 * @returns {string} HTML content for PDF
 */
function generateLabRequisitionHTML(labOrder, patient, doctor, clinic) {
  const orderDate = new Date(labOrder.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const requisitionNumber = labOrder.requisitionNumber || `LAB-${Date.now().toString().slice(-8)}`;
  
  const testsHTML = (labOrder.tests || []).map((test, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${test.name}</strong>
        ${test.code ? `<br><small style="color: #6b7280;">Code: ${test.code}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${test.specimen || 'Blood'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${test.urgent ? '<span style="color: #dc2626; font-weight: bold;">🔴 URGENT</span>' : 
          test.fasting ? '<span style="color: #f59e0b;">⚡ Fasting</span>' : '—'}
      </td>
    </tr>
  `).join('');

  const specialInstructions = [];
  if (labOrder.tests?.some(t => t.fasting)) {
    specialInstructions.push('🍽️ Fasting required for some tests (8-12 hours)');
  }
  if (labOrder.tests?.some(t => t.urgent)) {
    specialInstructions.push('🚨 URGENT tests - Priority processing required');
  }
  if (labOrder.specialInstructions) {
    specialInstructions.push(labOrder.specialInstructions);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lab Requisition - ${requisitionNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 20px; }
    .header-grid { display: flex; justify-content: space-between; align-items: flex-start; }
    .clinic-name { font-size: 24px; font-weight: bold; color: #059669; }
    .clinic-details { font-size: 11px; color: #6b7280; margin-top: 5px; }
    .requisition-badge { background: #059669; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; }
    .info-box h4 { color: #059669; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; }
    .info-box p { margin: 4px 0; }
    .tests-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .tests-table th { background: #059669; color: white; padding: 12px; text-align: left; font-size: 11px; }
    .diagnosis-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
    .instructions-box { background: #ecfdf5; border: 1px solid #059669; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .barcode-section { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin-bottom: 20px; }
    .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .signature-box { text-align: center; }
    .signature-line { border-top: 1px solid #1f2937; margin-top: 50px; padding-top: 8px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-grid">
        <div>
          <div class="clinic-name">🔬 ${clinic?.name || 'HealthSync Laboratory'}</div>
          <div class="clinic-details">
            ${clinic?.address || 'Healthcare Services'}<br>
            ${clinic?.phone ? `📞 ${clinic.phone}` : ''} ${clinic?.email ? `| ✉️ ${clinic.email}` : ''}
            ${clinic?.labLicense ? `<br>Lab License: ${clinic.labLicense}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="requisition-badge">LAB REQUISITION</div>
          <p style="margin-top: 10px; font-size: 14px; font-weight: bold;">${requisitionNumber}</p>
          <p style="color: #6b7280; font-size: 11px;">Date: ${orderDate}</p>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>👤 Patient Information</h4>
        <p><strong>${patient?.name || 'Patient'}</strong></p>
        <p>📧 ${patient?.email || '—'}</p>
        <p>📱 ${patient?.phone || '—'}</p>
        ${patient?.dateOfBirth ? `<p>🎂 DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')} (Age: ${calculateAge(patient.dateOfBirth)})</p>` : ''}
        ${patient?.gender ? `<p>Gender: ${patient.gender}</p>` : ''}
        ${patient?.patientId ? `<p>Patient ID: ${patient.patientId}</p>` : ''}
      </div>
      <div class="info-box">
        <h4>👨‍⚕️ Ordering Physician</h4>
        <p><strong>Dr. ${doctor?.name || 'Doctor'}</strong></p>
        <p>${doctor?.specialization || 'General Physician'}</p>
        <p>${doctor?.qualification || ''}</p>
        ${doctor?.registrationNumber ? `<p>Reg. No: ${doctor.registrationNumber}</p>` : ''}
        ${doctor?.phone ? `<p>📱 ${doctor.phone}</p>` : ''}
      </div>
    </div>

    ${labOrder.diagnosis ? `
    <div class="diagnosis-box">
      <h4 style="color: #92400e; margin-bottom: 8px;">🔍 Clinical Indication / Diagnosis</h4>
      <p style="font-weight: 500;">${labOrder.diagnosis}</p>
      ${labOrder.icdCode ? `<p style="margin-top: 5px; color: #78350f;"><strong>ICD-10:</strong> ${labOrder.icdCode}</p>` : ''}
    </div>
    ` : ''}

    <h3 style="color: #1f2937; margin-bottom: 10px; font-size: 14px;">🧪 Tests Ordered</h3>
    <table class="tests-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Test Name</th>
          <th>Specimen</th>
          <th style="width: 100px; text-align: center;">Priority</th>
        </tr>
      </thead>
      <tbody>
        ${testsHTML || '<tr><td colspan="4" style="padding: 12px; text-align: center;">No tests specified</td></tr>'}
      </tbody>
    </table>

    ${specialInstructions.length > 0 ? `
    <div class="instructions-box">
      <h4 style="color: #059669; margin-bottom: 10px;">📋 Special Instructions</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${specialInstructions.map(inst => `<li style="margin-bottom: 5px;">${inst}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${labOrder.clinicalNotes ? `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin-bottom: 8px;">📝 Clinical Notes</h4>
      <p>${labOrder.clinicalNotes}</p>
    </div>
    ` : ''}

    <div class="barcode-section">
      <p style="font-size: 24px; font-family: monospace; letter-spacing: 4px;">${requisitionNumber}</p>
      <p style="color: #6b7280; font-size: 10px; margin-top: 5px;">Scan barcode for electronic processing</p>
    </div>

    <div class="footer">
      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-line">
            <strong>Ordering Physician</strong><br>
            <small>Dr. ${doctor?.name || 'Doctor'}</small>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <strong>Lab Technician</strong><br>
            <small>Specimen Received By</small>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 30px; text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px;">
        <p style="color: #dc2626; font-weight: bold;">⚠️ Important Notice</p>
        <p style="font-size: 10px; color: #6b7280; margin-top: 5px;">
          This requisition is valid for 30 days from the date of issue.<br>
          Please bring this form along with a valid ID when visiting the laboratory.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb;">
      <p style="font-size: 10px; color: #9ca3af;">
        Generated on: ${new Date().toLocaleString('en-IN')}<br>
        HealthSync Healthcare Platform | support@healthsyncpro.in | +91-7001268485
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Clinical Summary HTML
 * @param {Object} visit - Visit/encounter details
 * @param {Object} patient - Patient information
 * @param {Object} doctor - Treating physician
 * @param {Object} clinic - Clinic information
 * @param {Object} options - Additional options
 * @returns {string} HTML content for PDF
 */
function generateClinicalSummaryHTML(visit, patient, doctor, clinic, options = {}) {
  const visitDate = new Date(visit.visitDate || visit.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const summaryNumber = visit.summaryNumber || `CS-${Date.now().toString().slice(-8)}`;
  
  // Vitals section
  const vitalsHTML = visit.vitals ? `
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #166534; margin-bottom: 12px;">📊 Vital Signs</h4>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        ${visit.vitals.bloodPressure ? `<div><small style="color: #6b7280;">Blood Pressure</small><br><strong>${visit.vitals.bloodPressure} mmHg</strong></div>` : ''}
        ${visit.vitals.pulse ? `<div><small style="color: #6b7280;">Pulse Rate</small><br><strong>${visit.vitals.pulse} bpm</strong></div>` : ''}
        ${visit.vitals.temperature ? `<div><small style="color: #6b7280;">Temperature</small><br><strong>${visit.vitals.temperature}°F</strong></div>` : ''}
        ${visit.vitals.respiratoryRate ? `<div><small style="color: #6b7280;">Respiratory Rate</small><br><strong>${visit.vitals.respiratoryRate}/min</strong></div>` : ''}
        ${visit.vitals.spo2 ? `<div><small style="color: #6b7280;">SpO2</small><br><strong>${visit.vitals.spo2}%</strong></div>` : ''}
        ${visit.vitals.weight ? `<div><small style="color: #6b7280;">Weight</small><br><strong>${visit.vitals.weight} kg</strong></div>` : ''}
        ${visit.vitals.height ? `<div><small style="color: #6b7280;">Height</small><br><strong>${visit.vitals.height} cm</strong></div>` : ''}
        ${visit.vitals.bmi ? `<div><small style="color: #6b7280;">BMI</small><br><strong>${visit.vitals.bmi}</strong></div>` : ''}
        ${visit.vitals.bloodSugar ? `<div><small style="color: #6b7280;">Blood Sugar</small><br><strong>${visit.vitals.bloodSugar} mg/dL</strong></div>` : ''}
      </div>
    </div>
  ` : '';

  // Diagnoses section
  const diagnosesHTML = visit.diagnoses?.length > 0 ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <h4 style="color: #92400e; margin-bottom: 10px;">🔍 Diagnoses</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${visit.diagnoses.map(d => `
          <li style="margin-bottom: 8px;">
            <strong>${d.name || d.description}</strong>
            ${d.icdCode ? `<span style="color: #6b7280;"> (${d.icdCode})</span>` : ''}
            ${d.type ? `<br><small style="color: #78350f;">${d.type === 'primary' ? '★ Primary' : 'Secondary'}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  // Medications section
  const medicationsHTML = visit.medications?.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 10px;">💊 Medications Prescribed</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #667eea; color: white;">
            <th style="padding: 10px; text-align: left;">Medication</th>
            <th style="padding: 10px; text-align: left;">Dosage</th>
            <th style="padding: 10px; text-align: left;">Frequency</th>
            <th style="padding: 10px; text-align: left;">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${visit.medications.map(med => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${med.name}</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.dosage || '—'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.frequency || '—'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${med.duration || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Lab results section
  const labResultsHTML = visit.labResults?.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 10px;">🧪 Laboratory Results</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #059669; color: white;">
            <th style="padding: 10px; text-align: left;">Test</th>
            <th style="padding: 10px; text-align: left;">Result</th>
            <th style="padding: 10px; text-align: left;">Reference Range</th>
            <th style="padding: 10px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${visit.labResults.map(lab => {
            const isAbnormal = lab.status === 'abnormal' || lab.flag === 'H' || lab.flag === 'L';
            return `
              <tr style="${isAbnormal ? 'background: #fef2f2;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${lab.testName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; ${isAbnormal ? 'color: #dc2626;' : ''}">${lab.value} ${lab.unit || ''}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${lab.referenceRange || '—'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                  ${isAbnormal ? '<span style="color: #dc2626;">⚠️ Abnormal</span>' : '<span style="color: #059669;">✓ Normal</span>'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Procedures section
  const proceduresHTML = visit.procedures?.length > 0 ? `
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #1d4ed8; margin-bottom: 10px;">🏥 Procedures Performed</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${visit.procedures.map(proc => `
          <li style="margin-bottom: 5px;">
            <strong>${proc.name}</strong>
            ${proc.cptCode ? `<span style="color: #6b7280;"> (CPT: ${proc.cptCode})</span>` : ''}
            ${proc.notes ? `<br><small style="color: #4b5563;">${proc.notes}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  // Allergies section
  const allergiesHTML = patient.allergies?.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #dc2626; margin-bottom: 10px;">⚠️ Known Allergies</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${patient.allergies.map(allergy => `
          <span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 11px;">
            ${typeof allergy === 'string' ? allergy : allergy.allergen}
            ${allergy.severity ? ` (${allergy.severity})` : ''}
          </span>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Medical history section
  const historyHTML = options.includeMedicalHistory && patient.medicalHistory ? `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #374151; margin-bottom: 10px;">📋 Relevant Medical History</h4>
      ${patient.medicalHistory.conditions?.length > 0 ? `
        <p><strong>Chronic Conditions:</strong> ${patient.medicalHistory.conditions.join(', ')}</p>
      ` : ''}
      ${patient.medicalHistory.surgeries?.length > 0 ? `
        <p><strong>Past Surgeries:</strong> ${patient.medicalHistory.surgeries.join(', ')}</p>
      ` : ''}
      ${patient.medicalHistory.familyHistory ? `
        <p><strong>Family History:</strong> ${patient.medicalHistory.familyHistory}</p>
      ` : ''}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Clinical Summary - ${summaryNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #667eea;">📋 ${clinic?.name || 'HealthSync Clinic'}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">
            ${clinic?.address || 'Healthcare Services'}<br>
            ${clinic?.phone ? `📞 ${clinic.phone}` : ''} ${clinic?.email ? `| ✉️ ${clinic.email}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #667eea; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;">CLINICAL SUMMARY</div>
          <p style="margin-top: 10px; font-size: 14px; font-weight: bold;">${summaryNumber}</p>
          <p style="color: #6b7280; font-size: 11px;">Visit Date: ${visitDate}</p>
        </div>
      </div>
    </div>

    <!-- Patient & Provider Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
        <h4 style="color: #667eea; font-size: 12px; margin-bottom: 10px; text-transform: uppercase;">👤 Patient Information</h4>
        <p><strong>${patient?.name || 'Patient'}</strong></p>
        ${patient?.dateOfBirth ? `<p>DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-IN')} (Age: ${calculateAge(patient.dateOfBirth)})</p>` : ''}
        ${patient?.gender ? `<p>Gender: ${patient.gender}</p>` : ''}
        <p>📱 ${patient?.phone || '—'}</p>
        ${patient?.patientId ? `<p>MRN: ${patient.patientId}</p>` : ''}
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
        <h4 style="color: #667eea; font-size: 12px; margin-bottom: 10px; text-transform: uppercase;">👨‍⚕️ Attending Physician</h4>
        <p><strong>Dr. ${doctor?.name || 'Doctor'}</strong></p>
        <p>${doctor?.specialization || 'General Physician'}</p>
        <p>${doctor?.qualification || ''}</p>
        ${doctor?.registrationNumber ? `<p>Reg. No: ${doctor.registrationNumber}</p>` : ''}
      </div>
    </div>

    <!-- Chief Complaint -->
    ${visit.chiefComplaint ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <h4 style="color: #92400e; margin-bottom: 8px;">🎯 Chief Complaint</h4>
      <p style="font-weight: 500;">${visit.chiefComplaint}</p>
    </div>
    ` : ''}

    <!-- History of Present Illness -->
    ${visit.historyOfPresentIllness ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 8px;">📝 History of Present Illness</h4>
      <p style="background: #f9fafb; padding: 15px; border-radius: 8px;">${visit.historyOfPresentIllness}</p>
    </div>
    ` : ''}

    ${allergiesHTML}
    ${vitalsHTML}

    <!-- Physical Examination -->
    ${visit.physicalExamination ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 8px;">🩺 Physical Examination</h4>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        ${typeof visit.physicalExamination === 'string' ? 
          `<p>${visit.physicalExamination}</p>` :
          Object.entries(visit.physicalExamination).map(([system, findings]) => `
            <p><strong>${system}:</strong> ${findings}</p>
          `).join('')
        }
      </div>
    </div>
    ` : ''}

    ${diagnosesHTML}
    ${labResultsHTML}
    ${proceduresHTML}
    ${medicationsHTML}
    ${historyHTML}

    <!-- Treatment Plan -->
    ${visit.treatmentPlan ? `
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <h4 style="color: #065f46; margin-bottom: 8px;">📋 Treatment Plan</h4>
      <p>${visit.treatmentPlan}</p>
    </div>
    ` : ''}

    <!-- Patient Instructions -->
    ${visit.patientInstructions ? `
    <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #1d4ed8; margin-bottom: 8px;">📌 Patient Instructions</h4>
      <p>${visit.patientInstructions}</p>
    </div>
    ` : ''}

    <!-- Follow-up -->
    ${visit.followUp ? `
    <div style="background: #faf5ff; border: 1px solid #a855f7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #7c3aed; margin-bottom: 8px;">📆 Follow-up</h4>
      ${visit.followUp.date ? `<p><strong>Date:</strong> ${new Date(visit.followUp.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
      ${visit.followUp.instructions ? `<p><strong>Instructions:</strong> ${visit.followUp.instructions}</p>` : ''}
      ${visit.followUp.reason ? `<p><strong>Reason:</strong> ${visit.followUp.reason}</p>` : ''}
    </div>
    ` : ''}

    <!-- Referrals -->
    ${visit.referrals?.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 10px;">🔗 Referrals</h4>
      ${visit.referrals.map(ref => `
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
          <p><strong>${ref.specialty || ref.type}</strong></p>
          ${ref.reason ? `<p style="color: #6b7280; font-size: 11px;">${ref.reason}</p>` : ''}
          ${ref.urgency ? `<p style="color: ${ref.urgency === 'urgent' ? '#dc2626' : '#6b7280'}; font-size: 11px;">Priority: ${ref.urgency}</p>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <p style="font-size: 10px; color: #6b7280;">
            Generated on: ${new Date().toLocaleString('en-IN')}<br>
            Document ID: ${summaryNumber}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="border-top: 1px solid #1f2937; margin-top: 40px; padding-top: 8px; display: inline-block; min-width: 200px;">
            <strong>Dr. ${doctor?.name || 'Doctor'}</strong><br>
            <small>${doctor?.qualification || ''} | ${doctor?.specialization || ''}</small>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb;">
      <p style="font-size: 10px; color: #9ca3af;">
        This clinical summary is confidential and intended for healthcare providers only.<br>
        HealthSync Healthcare Platform | support@healthsyncpro.in | +91-7001268485
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Discharge Summary HTML
 * @param {Object} admission - Admission/discharge details
 * @param {Object} patient - Patient information
 * @param {Object} doctor - Attending physician
 * @param {Object} clinic - Hospital/clinic information
 * @returns {string} HTML content for PDF
 */
function generateDischargeSummaryHTML(admission, patient, doctor, clinic) {
  const admissionDate = new Date(admission.admissionDate || admission.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const dischargeDate = new Date(admission.dischargeDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  
  const summaryNumber = admission.summaryNumber || `DS-${Date.now().toString().slice(-8)}`;
  const lengthOfStay = admission.dischargeDate && admission.admissionDate ? 
    Math.ceil((new Date(admission.dischargeDate) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) : '—';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Discharge Summary - ${summaryNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .section-title { color: #1f2937; font-size: 14px; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #dc2626;">🏥 ${clinic?.name || 'HealthSync Hospital'}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">
            ${clinic?.address || 'Healthcare Services'}<br>
            ${clinic?.phone ? `📞 ${clinic.phone}` : ''} ${clinic?.email ? `| ✉️ ${clinic.email}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #dc2626; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;">DISCHARGE SUMMARY</div>
          <p style="margin-top: 10px; font-size: 14px; font-weight: bold;">${summaryNumber}</p>
        </div>
      </div>
    </div>

    <!-- Admission Details -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #fef2f2; padding: 15px; border-radius: 8px;">
      <div>
        <small style="color: #6b7280;">Admission Date</small><br>
        <strong>${admissionDate}</strong>
      </div>
      <div>
        <small style="color: #6b7280;">Discharge Date</small><br>
        <strong>${dischargeDate}</strong>
      </div>
      <div>
        <small style="color: #6b7280;">Length of Stay</small><br>
        <strong>${lengthOfStay} days</strong>
      </div>
    </div>

    <!-- Patient Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        <h4 style="color: #dc2626; font-size: 12px; margin-bottom: 10px;">👤 PATIENT</h4>
        <p><strong>${patient?.name || 'Patient'}</strong></p>
        ${patient?.dateOfBirth ? `<p>Age: ${calculateAge(patient.dateOfBirth)} years</p>` : ''}
        ${patient?.gender ? `<p>Gender: ${patient.gender}</p>` : ''}
        ${patient?.patientId ? `<p>MRN: ${patient.patientId}</p>` : ''}
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        <h4 style="color: #dc2626; font-size: 12px; margin-bottom: 10px;">👨‍⚕️ ATTENDING PHYSICIAN</h4>
        <p><strong>Dr. ${doctor?.name || 'Doctor'}</strong></p>
        <p>${doctor?.specialization || ''}</p>
        ${doctor?.registrationNumber ? `<p>Reg: ${doctor.registrationNumber}</p>` : ''}
      </div>
    </div>

    <!-- Admission Diagnosis -->
    ${admission.admissionDiagnosis ? `
    <div class="section">
      <div class="section-title">🔍 Admission Diagnosis</div>
      <p>${admission.admissionDiagnosis}</p>
    </div>
    ` : ''}

    <!-- Final Diagnosis -->
    ${admission.finalDiagnosis ? `
    <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px;">
      <div class="section-title" style="border-bottom: none;">📋 Final Diagnosis</div>
      <p style="font-weight: 500;">${admission.finalDiagnosis}</p>
      ${admission.icdCodes?.length > 0 ? `<p style="color: #6b7280; margin-top: 5px;">ICD-10: ${admission.icdCodes.join(', ')}</p>` : ''}
    </div>
    ` : ''}

    <!-- Hospital Course -->
    ${admission.hospitalCourse ? `
    <div class="section">
      <div class="section-title">📝 Hospital Course</div>
      <p style="white-space: pre-line;">${admission.hospitalCourse}</p>
    </div>
    ` : ''}

    <!-- Procedures -->
    ${admission.procedures?.length > 0 ? `
    <div class="section">
      <div class="section-title">🏥 Procedures Performed</div>
      <ul style="padding-left: 20px;">
        ${admission.procedures.map(proc => `
          <li style="margin-bottom: 5px;">
            <strong>${proc.name}</strong>
            ${proc.date ? ` - ${new Date(proc.date).toLocaleDateString('en-IN')}` : ''}
            ${proc.notes ? `<br><small style="color: #6b7280;">${proc.notes}</small>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Discharge Medications -->
    ${admission.dischargeMedications?.length > 0 ? `
    <div class="section">
      <div class="section-title">💊 Discharge Medications</div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #dc2626; color: white;">
            <th style="padding: 8px; text-align: left;">Medication</th>
            <th style="padding: 8px; text-align: left;">Dosage</th>
            <th style="padding: 8px; text-align: left;">Frequency</th>
            <th style="padding: 8px; text-align: left;">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${admission.dischargeMedications.map(med => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${med.name}</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.dosage || '—'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.frequency || '—'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.duration || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Discharge Instructions -->
    ${admission.dischargeInstructions ? `
    <div class="section" style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px;">
      <div class="section-title" style="color: #065f46; border-bottom: none;">📌 Discharge Instructions</div>
      <p style="white-space: pre-line;">${admission.dischargeInstructions}</p>
    </div>
    ` : ''}

    <!-- Follow-up -->
    ${admission.followUp ? `
    <div class="section" style="background: #eff6ff; padding: 15px; border-radius: 8px;">
      <div class="section-title" style="color: #1d4ed8; border-bottom: none;">📆 Follow-up Appointments</div>
      ${admission.followUp.date ? `<p><strong>Date:</strong> ${new Date(admission.followUp.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
      ${admission.followUp.department ? `<p><strong>Department:</strong> ${admission.followUp.department}</p>` : ''}
      ${admission.followUp.instructions ? `<p><strong>Instructions:</strong> ${admission.followUp.instructions}</p>` : ''}
    </div>
    ` : ''}

    <!-- Condition at Discharge -->
    <div class="section">
      <div class="section-title">🏃 Condition at Discharge</div>
      <p><strong>${admission.conditionAtDischarge || 'Stable'}</strong></p>
    </div>

    <!-- Signature -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: right;">
      <div style="border-top: 1px solid #1f2937; margin-top: 50px; padding-top: 8px; display: inline-block; min-width: 200px;">
        <strong>Dr. ${doctor?.name || 'Doctor'}</strong><br>
        <small>${doctor?.qualification || ''} | ${doctor?.specialization || ''}</small>
      </div>
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb;">
      <p style="font-size: 10px; color: #9ca3af;">
        Generated: ${new Date().toLocaleString('en-IN')} | HealthSync Healthcare Platform
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate Referral Letter HTML
 * @param {Object} referral - Referral details
 * @param {Object} patient - Patient information
 * @param {Object} referringDoctor - Referring physician
 * @param {Object} clinic - Clinic information
 * @returns {string} HTML content for PDF
 */
function generateReferralLetterHTML(referral, patient, referringDoctor, clinic) {
  const referralDate = new Date(referral.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const referralNumber = referral.referralNumber || `REF-${Date.now().toString().slice(-8)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Referral Letter - ${referralNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 30px; }
    .letterhead { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="letterhead">
      <div style="font-size: 22px; font-weight: bold; color: #667eea;">${clinic?.name || 'HealthSync Clinic'}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">
        ${clinic?.address || ''}<br>
        ${clinic?.phone ? `Tel: ${clinic.phone}` : ''} ${clinic?.email ? `| Email: ${clinic.email}` : ''}
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <p style="text-align: right; color: #6b7280;">Date: ${referralDate}</p>
      <p style="text-align: right; color: #6b7280;">Ref: ${referralNumber}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <p><strong>To:</strong></p>
      <p>${referral.toDoctor ? `Dr. ${referral.toDoctor}` : 'The Consulting Physician'}</p>
      <p>${referral.toSpecialty || referral.specialty || ''}</p>
      ${referral.toClinic ? `<p>${referral.toClinic}</p>` : ''}
    </div>

    <p style="margin-bottom: 20px;"><strong>Subject: Referral for ${patient?.name || 'Patient'}</strong></p>

    <p>Dear ${referral.toDoctor ? `Dr. ${referral.toDoctor}` : 'Colleague'},</p>

    <p style="margin: 20px 0;">
      I am referring the above-named patient for your expert opinion and management.
    </p>

    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #667eea; margin-bottom: 10px;">Patient Details</h4>
      <p><strong>Name:</strong> ${patient?.name || '—'}</p>
      ${patient?.dateOfBirth ? `<p><strong>Age:</strong> ${calculateAge(patient.dateOfBirth)} years</p>` : ''}
      ${patient?.gender ? `<p><strong>Gender:</strong> ${patient.gender}</p>` : ''}
      <p><strong>Contact:</strong> ${patient?.phone || '—'}</p>
    </div>

    ${referral.diagnosis ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 8px;">Clinical Diagnosis</h4>
      <p>${referral.diagnosis}</p>
    </div>
    ` : ''}

    ${referral.clinicalHistory ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 8px;">Clinical History</h4>
      <p style="white-space: pre-line;">${referral.clinicalHistory}</p>
    </div>
    ` : ''}

    ${referral.reasonForReferral ? `
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="color: #92400e; margin-bottom: 8px;">Reason for Referral</h4>
      <p>${referral.reasonForReferral}</p>
    </div>
    ` : ''}

    ${referral.currentMedications?.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="color: #1f2937; margin-bottom: 8px;">Current Medications</h4>
      <ul style="padding-left: 20px;">
        ${referral.currentMedications.map(med => `<li>${med.name} ${med.dosage || ''}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${referral.urgency === 'urgent' ? `
    <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="color: #dc2626; font-weight: bold;">🚨 URGENT REFERRAL - Please see at earliest convenience</p>
    </div>
    ` : ''}

    <p style="margin: 20px 0;">
      I would appreciate your assessment and recommendations. Please do not hesitate to contact me if you require any additional information.
    </p>

    <p>Thank you for your kind attention.</p>

    <div style="margin-top: 50px;">
      <p>Yours sincerely,</p>
      <div style="margin-top: 40px;">
        <p><strong>Dr. ${referringDoctor?.name || 'Doctor'}</strong></p>
        <p>${referringDoctor?.qualification || ''}</p>
        <p>${referringDoctor?.specialization || ''}</p>
        ${referringDoctor?.registrationNumber ? `<p>Reg. No: ${referringDoctor.registrationNumber}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  generateLabRequisitionHTML,
  generateClinicalSummaryHTML,
  generateDischargeSummaryHTML,
  generateReferralLetterHTML,
  calculateAge
};
