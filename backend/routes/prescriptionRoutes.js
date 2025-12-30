const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Create prescription (doctors, admin, receptionist, clinic staff)
router.post('/', verifyTokenWithRole(['doctor', 'admin', 'receptionist', 'clinic']), async (req, res) => {
  try {
    console.log('📝 Creating prescription, body:', JSON.stringify(req.body, null, 2));
    
    // Transform medicines to match schema (notes -> instructions, ensure required fields)
    const transformedBody = { ...req.body };
    
    // If patientId is missing but appointmentId is present, try to get patientId from appointment
    if (!transformedBody.patientId && transformedBody.appointmentId) {
      try {
        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(transformedBody.appointmentId);
        if (appointment) {
          transformedBody.patientId = appointment.userId || appointment.patientId;
          transformedBody.clinicId = transformedBody.clinicId || appointment.clinicId;
          console.log('📝 Got patientId from appointment:', transformedBody.patientId);
        }
      } catch (e) {
        console.log('📝 Could not fetch appointment:', e.message);
      }
    }
    
    // Validate required fields
    if (!transformedBody.patientId) {
      console.log('❌ Missing patientId');
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }
    if (!transformedBody.doctorId) {
      console.log('❌ Missing doctorId');
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }
    
    // Transform medicines
    if (transformedBody.medicines && Array.isArray(transformedBody.medicines)) {
      transformedBody.medicines = transformedBody.medicines.map(med => ({
        name: med.name || 'Unknown',
        dosage: med.dosage || 'As directed',
        frequency: med.frequency || 'As needed',
        duration: med.duration || 'As prescribed',
        timing: med.timing || 'after_food',
        instructions: med.instructions || med.notes || '',
        quantity: med.quantity || 1
      }));
    }
    
    // Handle symptoms - convert string to array if needed
    if (transformedBody.symptoms && typeof transformedBody.symptoms === 'string') {
      transformedBody.symptoms = transformedBody.symptoms.split(',').map(s => s.trim()).filter(s => s);
    }
    
    // Generate prescription number if not provided
    if (!transformedBody.prescriptionNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      transformedBody.prescriptionNumber = `RX${year}${month}${day}${random}`;
    }
    
    console.log('📝 Transformed body:', JSON.stringify(transformedBody, null, 2));
    
    const prescription = new Prescription(transformedBody);
    await prescription.save();
    console.log('✅ Prescription saved:', prescription._id);
    res.status(201).json({ success: true, prescription });
  } catch (error) {
    console.error('❌ Error creating prescription:', error);
    res.status(500).json({ success: false, message: 'Failed to create prescription', error: error.message });
  }
});

// Get prescriptions by patient (authenticated users - patients, doctors, clinic staff)
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescriptions by clinic (for clinic staff and doctors)
router.get('/clinic/:clinicId', verifyTokenWithRole(['receptionist', 'clinic', 'admin', 'doctor']), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ clinicId: req.params.clinicId })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name phone email age gender address profilePhoto')
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log('📋 Fetched prescriptions for clinic:', req.params.clinicId);
    console.log('📋 First prescription patientId:', prescriptions[0]?.patientId);
    
    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get prescriptions by doctor (doctors/admin only)
router.get('/doctor/:doctorId', verifyTokenWithRole(['doctor', 'admin']), async (req, res) => {
  try {
    // Doctors can only view their own prescriptions
    if (req.user.role === 'doctor' && req.user.id !== req.params.doctorId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name email phone age gender address')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// Get single prescription
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email phone age gender address');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// Send prescription via Email
router.post('/:id/send-email', verifyToken, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization phone')
      .populate('patientId', 'name email phone age gender')
      .populate('clinicId', 'name address phone');
    
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    
    const patientEmail = req.body.email || prescription.patientId?.email;
    if (!patientEmail) {
      return res.status(400).json({ success: false, message: 'Patient email not found' });
    }
    
    const { sendEmail } = require('../services/emailService');
    
    // Generate prescription HTML
    const prescriptionHtml = generatePrescriptionEmailHtml(prescription);
    
    await sendEmail({
      to: patientEmail,
      subject: `Your Prescription from Dr. ${prescription.doctorId?.name || 'Doctor'} - ${prescription.prescriptionNumber}`,
      html: prescriptionHtml,
      text: `Prescription ${prescription.prescriptionNumber} from Dr. ${prescription.doctorId?.name}`
    });
    
    res.json({ success: true, message: 'Prescription sent to email successfully' });
  } catch (error) {
    console.error('Error sending prescription email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send prescription via WhatsApp
router.post('/:id/send-whatsapp', verifyToken, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'name specialization phone')
      .populate('patientId', 'name email phone age gender')
      .populate('clinicId', 'name address phone');
    
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    
    const patientPhone = req.body.phone || prescription.patientId?.phone;
    if (!patientPhone) {
      return res.status(400).json({ success: false, message: 'Patient phone not found' });
    }
    
    // Generate WhatsApp message
    const message = generatePrescriptionWhatsAppMessage(prescription);
    
    // Generate WhatsApp URL (opens WhatsApp with pre-filled message)
    const cleanPhone = patientPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    
    res.json({ 
      success: true, 
      message: 'WhatsApp link generated',
      whatsappUrl,
      whatsappMessage: message
    });
  } catch (error) {
    console.error('Error generating WhatsApp message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to detect Bengali text
function containsBengali(text) {
  return /[\u0980-\u09FF]/.test(text || '');
}

// Detect language from prescription content
function detectPrescriptionLanguage(prescription) {
  const allText = [
    prescription.diagnosis,
    prescription.symptoms,
    prescription.advice,
    ...(prescription.medicines || []).map(m => (m.name || '') + (m.instructions || '')),
  ].join(' ');
  return containsBengali(allText) ? 'bn' : 'en';
}

// Helper function to generate prescription email HTML
function generatePrescriptionEmailHtml(prescription) {
  const lang = detectPrescriptionLanguage(prescription);
  const isBengali = lang === 'bn';
  
  // Labels in both languages
  const labels = {
    prescriptionNo: isBengali ? 'প্রেসক্রিপশন নং' : 'PRESCRIPTION NO.',
    date: isBengali ? 'তারিখ' : 'DATE',
    patientDetails: isBengali ? 'রোগীর তথ্য' : 'Patient Details',
    doctorDetails: isBengali ? 'ডাক্তারের তথ্য' : 'Doctor Details',
    diagnosis: isBengali ? 'রোগ নির্ণয়' : 'Diagnosis',
    medicines: isBengali ? 'ওষুধ' : 'Prescribed Medicines',
    medicine: isBengali ? 'ওষুধ' : 'Medicine',
    frequency: isBengali ? 'কতবার' : 'Frequency',
    duration: isBengali ? 'সময়কাল' : 'Duration',
    timing: isBengali ? 'সময়' : 'Timing',
    instructions: isBengali ? 'নির্দেশনা' : 'Instructions / Advice',
    followUp: isBengali ? 'ফলো-আপ তারিখ' : 'Follow-up Date',
    years: isBengali ? 'বছর' : 'years',
    languageBadge: isBengali ? 'বাংলায় লেখা' : '',
  };

  const medicines = prescription.medicines || [];
  const medicineRows = medicines.map((med, i) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${med.name}</strong><br><span style="color: #6b7280; font-size: 12px;">${med.dosage || ''}</span></td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.frequency || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.duration || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${med.timing || '-'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - ${prescription.prescriptionNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: ${isBengali ? "'Noto Sans Bengali', " : ''}-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0 0 5px 0; font-size: 28px;">${prescription.clinicId?.name || 'HealthSync Clinic'}</h1>
      <p style="margin: 0; opacity: 0.9;">${prescription.clinicId?.address || ''}</p>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${prescription.clinicId?.phone || ''}</p>
      ${isBengali ? `<span style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px;">${labels.languageBadge}</span>` : ''}
    </div>
    
    <!-- Prescription Header -->
    <div style="padding: 20px 30px; border-bottom: 2px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
        <div>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">${labels.prescriptionNo}</p>
          <p style="margin: 5px 0 0 0; font-weight: 600; color: #1f2937; font-size: 18px;">${prescription.prescriptionNumber}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">${labels.date}</p>
          <p style="margin: 5px 0 0 0; font-weight: 600; color: #1f2937;">${new Date(prescription.createdAt).toLocaleDateString(isBengali ? 'bn-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
    
    <!-- Patient & Doctor Info -->
    <div style="padding: 20px 30px; display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="flex: 1; min-width: 200px; background: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">${labels.patientDetails}</p>
        <p style="margin: 0; font-weight: 600; color: #1f2937;">${prescription.patientId?.name || 'Patient'}</p>
        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">${prescription.patientId?.age ? prescription.patientId.age + ' ' + labels.years : ''} ${prescription.patientId?.gender || ''}</p>
        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">${prescription.patientId?.phone || ''}</p>
      </div>
      <div style="flex: 1; min-width: 200px; background: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">${labels.doctorDetails}</p>
        <p style="margin: 0; font-weight: 600; color: #1f2937;">Dr. ${prescription.doctorId?.name || 'Doctor'}</p>
        <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;">${prescription.doctorId?.specialization || ''}</p>
      </div>
    </div>
    
    <!-- Diagnosis -->
    ${prescription.diagnosis ? `
    <div style="padding: 0 30px 20px 30px;">
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 5px 0; color: #92400e; font-size: 12px; text-transform: uppercase; font-weight: 600;">${labels.diagnosis}</p>
        <p style="margin: 0; color: #78350f;">${prescription.diagnosis}</p>
      </div>
    </div>
    ` : ''}
    
    <!-- Medicines -->
    <div style="padding: 0 30px 20px 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">℞ ${labels.medicines}</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; color: #4b5563; font-weight: 600;">#</th>
            <th style="padding: 12px; text-align: left; color: #4b5563; font-weight: 600;">${labels.medicine}</th>
            <th style="padding: 12px; text-align: left; color: #4b5563; font-weight: 600;">${labels.frequency}</th>
            <th style="padding: 12px; text-align: left; color: #4b5563; font-weight: 600;">${labels.duration}</th>
            <th style="padding: 12px; text-align: left; color: #4b5563; font-weight: 600;">${labels.timing}</th>
          </tr>
        </thead>
        <tbody>
          ${medicineRows}
        </tbody>
      </table>
    </div>
    
    <!-- Instructions -->
    ${prescription.advice ? `
    <div style="padding: 0 30px 20px 30px;">
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 5px 0; color: #065f46; font-size: 12px; text-transform: uppercase; font-weight: 600;">Instructions / Advice</p>
        <p style="margin: 0; color: #047857;">${prescription.advice}</p>
      </div>
    </div>
    ` : ''}
    
    <!-- Follow-up -->
    ${prescription.followUpDate ? `
    <div style="padding: 0 30px 20px 30px;">
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 5px 0; color: #1e40af; font-size: 12px; text-transform: uppercase; font-weight: 600;">${labels.followUp}</p>
        <p style="margin: 0; color: #1d4ed8; font-weight: 600;">${new Date(prescription.followUpDate).toLocaleDateString(isBengali ? 'bn-IN' : 'en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        ${prescription.followUpInstructions ? `<p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 14px;">${prescription.followUpInstructions}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div style="background: #1f2937; color: #9ca3af; padding: 20px 30px; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 12px;">${isBengali ? 'এটি HealthSync থেকে ডিজিটালভাবে তৈরি প্রেসক্রিপশন' : 'This is a digitally generated prescription from HealthSync'}</p>
      <p style="margin: 0; font-size: 11px;">${isBengali ? 'যোগাযোগ:' : 'For any queries, contact:'} support@healthsyncpro.in | +91-7001268485</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #6b7280;">Powered by <span style="color: #818cf8;">HealthSync</span></p>
    </div>
    
  </div>
</body>
</html>
  `;
}

// Helper function to generate WhatsApp message
function generatePrescriptionWhatsAppMessage(prescription) {
  const lang = detectPrescriptionLanguage(prescription);
  const isBengali = lang === 'bn';
  
  const medicines = prescription.medicines || [];
  const medicineList = medicines.map((med, i) => 
    `${i + 1}. *${med.name}* ${med.dosage || ''}\n   📋 ${med.frequency || (isBengali ? 'নির্দেশ অনুযায়ী' : 'As directed')} | ${med.duration || (isBengali ? 'নির্ধারিত সময়' : 'As prescribed')} | ${med.timing || ''}`
  ).join('\n\n');

  if (isBengali) {
    return `🏥 *প্রেসক্রিপশন*
━━━━━━━━━━━━━━━━━━
*${prescription.clinicId?.name || 'HealthSync Clinic'}*
প্রেসক্রিপশন নং: ${prescription.prescriptionNumber}
তারিখ: ${new Date(prescription.createdAt).toLocaleDateString('bn-IN')}

👤 *রোগী:* ${prescription.patientId?.name || 'Patient'}
👨‍⚕️ *ডাক্তার:* Dr. ${prescription.doctorId?.name || 'Doctor'}
${prescription.doctorId?.specialization ? `   ${prescription.doctorId.specialization}` : ''}

${prescription.diagnosis ? `🔍 *রোগ নির্ণয়:* ${prescription.diagnosis}\n` : ''}
━━━━━━━━━━━━━━━━━━
💊 *ওষুধ*
━━━━━━━━━━━━━━━━━━

${medicineList}

${prescription.advice ? `\n📝 *পরামর্শ:*\n${prescription.advice}` : ''}
${prescription.followUpDate ? `\n📅 *ফলো-আপ:* ${new Date(prescription.followUpDate).toLocaleDateString('bn-IN')}` : ''}

━━━━━━━━━━━━━━━━━━
_বাংলায় লেখা_
_Powered by HealthSync_
🌐 healthsyncpro.in`;
  }

  return `🏥 *PRESCRIPTION*
━━━━━━━━━━━━━━━━━━
*${prescription.clinicId?.name || 'HealthSync Clinic'}*
Rx No: ${prescription.prescriptionNumber}
Date: ${new Date(prescription.createdAt).toLocaleDateString('en-IN')}

👤 *Patient:* ${prescription.patientId?.name || 'Patient'}
👨‍⚕️ *Doctor:* Dr. ${prescription.doctorId?.name || 'Doctor'}
${prescription.doctorId?.specialization ? `   ${prescription.doctorId.specialization}` : ''}

${prescription.diagnosis ? `🔍 *Diagnosis:* ${prescription.diagnosis}\n` : ''}
━━━━━━━━━━━━━━━━━━
💊 *MEDICINES*
━━━━━━━━━━━━━━━━━━

${medicineList}

${prescription.advice ? `\n📝 *Instructions:*\n${prescription.advice}` : ''}
${prescription.followUpDate ? `\n📅 *Follow-up:* ${new Date(prescription.followUpDate).toLocaleDateString('en-IN')}` : ''}

━━━━━━━━━━━━━━━━━━
_Powered by HealthSync_
🌐 healthsyncpro.in`;
}

module.exports = router;
