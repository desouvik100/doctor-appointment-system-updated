const express = require('express');
const router = express.Router();
const HealthCheckup = require('../models/HealthCheckup');
const Clinic = require('../models/Clinic');

// Health checkup packages with tests
const CHECKUP_PACKAGES = {
  basic: {
    name: 'Basic Health Checkup',
    price: 999,
    discountedPrice: 799,
    duration: '2-3 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Urine Routine', category: 'Urine' }
    ],
    fastingRequired: true
  },
  standard: {
    name: 'Standard Health Checkup',
    price: 1999,
    discountedPrice: 1499,
    duration: '3-4 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting & PP', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Thyroid' },
      { name: 'Urine Routine', category: 'Urine' },
      { name: 'Chest X-Ray', category: 'Radiology' },
      { name: 'ECG', category: 'Heart' }
    ],
    fastingRequired: true
  },
  comprehensive: {
    name: 'Comprehensive Health Checkup',
    price: 3999,
    discountedPrice: 2999,
    duration: '4-5 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting & PP', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Thyroid' },
      { name: 'Vitamin D', category: 'Vitamins' },
      { name: 'Vitamin B12', category: 'Vitamins' },
      { name: 'Iron Studies', category: 'Blood' },
      { name: 'Urine Routine', category: 'Urine' },
      { name: 'Chest X-Ray', category: 'Radiology' },
      { name: 'ECG', category: 'Heart' },
      { name: 'Ultrasound Abdomen', category: 'Radiology' },
      { name: 'Doctor Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  },
  executive: {
    name: 'Executive Health Checkup',
    price: 7999,
    discountedPrice: 5999,
    duration: '5-6 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting & PP', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Thyroid' },
      { name: 'Vitamin D', category: 'Vitamins' },
      { name: 'Vitamin B12', category: 'Vitamins' },
      { name: 'Iron Studies', category: 'Blood' },
      { name: 'PSA (for men) / CA-125 (for women)', category: 'Cancer Markers' },
      { name: 'Urine Routine', category: 'Urine' },
      { name: 'Stool Routine', category: 'Stool' },
      { name: 'Chest X-Ray', category: 'Radiology' },
      { name: 'ECG', category: 'Heart' },
      { name: 'Echo', category: 'Heart' },
      { name: 'TMT (Treadmill Test)', category: 'Heart' },
      { name: 'Ultrasound Abdomen', category: 'Radiology' },
      { name: 'Pulmonary Function Test', category: 'Lungs' },
      { name: 'Eye Checkup', category: 'Eye' },
      { name: 'Dental Checkup', category: 'Dental' },
      { name: 'Doctor Consultation', category: 'Consultation' },
      { name: 'Diet Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  },
  cardiac: {
    name: 'Cardiac Health Checkup',
    price: 4999,
    discountedPrice: 3999,
    duration: '4-5 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Apolipoprotein A & B', category: 'Heart' },
      { name: 'Lipoprotein (a)', category: 'Heart' },
      { name: 'hs-CRP', category: 'Heart' },
      { name: 'Homocysteine', category: 'Heart' },
      { name: 'Blood Sugar Fasting', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'ECG', category: 'Heart' },
      { name: 'Echo', category: 'Heart' },
      { name: 'TMT (Treadmill Test)', category: 'Heart' },
      { name: 'Chest X-Ray', category: 'Radiology' },
      { name: 'Cardiologist Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  },
  diabetic: {
    name: 'Diabetic Health Checkup',
    price: 2999,
    discountedPrice: 2499,
    duration: '3-4 hours',
    tests: [
      { name: 'Blood Sugar Fasting & PP', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'Fructosamine', category: 'Diabetes' },
      { name: 'Insulin Fasting', category: 'Diabetes' },
      { name: 'C-Peptide', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Microalbumin', category: 'Kidney' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Urine Routine', category: 'Urine' },
      { name: 'ECG', category: 'Heart' },
      { name: 'Eye Checkup (Fundoscopy)', category: 'Eye' },
      { name: 'Diabetologist Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  },
  women_wellness: {
    name: 'Women Wellness Checkup',
    price: 4499,
    discountedPrice: 3499,
    duration: '4-5 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Thyroid' },
      { name: 'Vitamin D', category: 'Vitamins' },
      { name: 'Vitamin B12', category: 'Vitamins' },
      { name: 'Iron Studies', category: 'Blood' },
      { name: 'Calcium', category: 'Bone' },
      { name: 'FSH, LH', category: 'Hormones' },
      { name: 'Prolactin', category: 'Hormones' },
      { name: 'CA-125', category: 'Cancer Markers' },
      { name: 'Pap Smear', category: 'Gynecology' },
      { name: 'Mammography', category: 'Radiology' },
      { name: 'Ultrasound Pelvis', category: 'Radiology' },
      { name: 'Bone Density (DEXA)', category: 'Bone' },
      { name: 'Gynecologist Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  },
  senior_citizen: {
    name: 'Senior Citizen Health Checkup',
    price: 5999,
    discountedPrice: 4499,
    duration: '5-6 hours',
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'Blood' },
      { name: 'Blood Sugar Fasting & PP', category: 'Diabetes' },
      { name: 'HbA1c', category: 'Diabetes' },
      { name: 'Lipid Profile', category: 'Heart' },
      { name: 'Liver Function Test', category: 'Liver' },
      { name: 'Kidney Function Test', category: 'Kidney' },
      { name: 'Thyroid Profile', category: 'Thyroid' },
      { name: 'Vitamin D', category: 'Vitamins' },
      { name: 'Vitamin B12', category: 'Vitamins' },
      { name: 'Calcium', category: 'Bone' },
      { name: 'PSA (men) / CA-125 (women)', category: 'Cancer Markers' },
      { name: 'Urine Routine', category: 'Urine' },
      { name: 'ECG', category: 'Heart' },
      { name: 'Echo', category: 'Heart' },
      { name: 'Chest X-Ray', category: 'Radiology' },
      { name: 'Ultrasound Abdomen', category: 'Radiology' },
      { name: 'Bone Density (DEXA)', category: 'Bone' },
      { name: 'Eye Checkup', category: 'Eye' },
      { name: 'Hearing Test', category: 'ENT' },
      { name: 'Doctor Consultation', category: 'Consultation' }
    ],
    fastingRequired: true
  }
};

// Get all packages
router.get('/packages', (req, res) => {
  const packages = Object.entries(CHECKUP_PACKAGES).map(([key, pkg]) => ({
    id: key,
    ...pkg,
    discount: Math.round(((pkg.price - pkg.discountedPrice) / pkg.price) * 100)
  }));
  res.json(packages);
});

// Get package details
router.get('/packages/:packageId', (req, res) => {
  const pkg = CHECKUP_PACKAGES[req.params.packageId];
  if (!pkg) {
    return res.status(404).json({ message: 'Package not found' });
  }
  res.json({
    id: req.params.packageId,
    ...pkg,
    discount: Math.round(((pkg.price - pkg.discountedPrice) / pkg.price) * 100)
  });
});

// Get available slots for a clinic
router.get('/slots/:clinicId/:date', async (req, res) => {
  try {
    const { clinicId, date } = req.params;
    const selectedDate = new Date(date);
    
    // Get existing bookings for the date
    const existingBookings = await HealthCheckup.find({
      clinicId,
      scheduledDate: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      },
      status: { $nin: ['cancelled'] }
    }).select('scheduledTime');

    const bookedSlots = existingBookings.map(b => b.scheduledTime);
    
    // Available slots (assuming clinic operates 7 AM to 12 PM for checkups)
    const allSlots = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ availableSlots, bookedSlots });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Book a health checkup
router.post('/book', async (req, res) => {
  try {
    const { userId, clinicId, packageType, scheduledDate, scheduledTime, patientDetails, reportDelivery } = req.body;

    const pkg = CHECKUP_PACKAGES[packageType];
    if (!pkg) {
      return res.status(400).json({ message: 'Invalid package type' });
    }

    // Check if slot is available
    const existingBooking = await HealthCheckup.findOne({
      clinicId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: { $nin: ['cancelled'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    const checkup = new HealthCheckup({
      userId,
      clinicId,
      packageType,
      packageName: pkg.name,
      tests: pkg.tests.map(t => ({ ...t, included: true })),
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      price: {
        original: pkg.price,
        discounted: pkg.discountedPrice,
        discount: Math.round(((pkg.price - pkg.discountedPrice) / pkg.price) * 100)
      },
      patientDetails,
      fastingRequired: pkg.fastingRequired,
      reportDelivery: reportDelivery || 'email'
    });

    await checkup.save();

    // Populate clinic details
    await checkup.populate('clinicId', 'name address phone');

    res.status(201).json({
      message: 'Health checkup booked successfully',
      checkup
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's checkup bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const checkups = await HealthCheckup.find({ userId: req.params.userId })
      .populate('clinicId', 'name address phone')
      .sort({ scheduledDate: -1 });
    res.json(checkups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get checkup details
router.get('/:id', async (req, res) => {
  try {
    const checkup = await HealthCheckup.findById(req.params.id)
      .populate('clinicId', 'name address phone city');
    if (!checkup) {
      return res.status(404).json({ message: 'Checkup not found' });
    }
    res.json(checkup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel checkup
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const checkup = await HealthCheckup.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      },
      { new: true }
    );
    if (!checkup) {
      return res.status(404).json({ message: 'Checkup not found' });
    }
    res.json({ message: 'Checkup cancelled', checkup });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update checkup status (for clinic)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const checkup = await HealthCheckup.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!checkup) {
      return res.status(404).json({ message: 'Checkup not found' });
    }
    res.json({ message: 'Status updated', checkup });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
