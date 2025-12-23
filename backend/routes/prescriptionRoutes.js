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

module.exports = router;
