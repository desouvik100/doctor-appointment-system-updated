const express = require('express');
const MedicalHistory = require('../models/MedicalHistory');
const User = require('../models/User');
const router = express.Router();

// Get medical history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      // Create empty medical history if doesn't exist
      medicalHistory = new MedicalHistory({
        userId: req.params.userId,
        diseases: [],
        allergies: [],
        prescriptions: [],
        reports: []
      });
      await medicalHistory.save();
    }

    res.json(medicalHistory);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add disease to medical history
router.post('/user/:userId/diseases', async (req, res) => {
  try {
    const { disease, since, status, diagnosedDate, notes } = req.body;

    if (!disease) {
      return res.status(400).json({ message: 'Disease name is required' });
    }

    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      medicalHistory = new MedicalHistory({ userId: req.params.userId });
    }

    medicalHistory.diseases.push({
      disease,
      since,
      status: status || 'Active',
      diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : new Date(),
      notes
    });

    await medicalHistory.save();
    res.status(201).json(medicalHistory);
  } catch (error) {
    console.error('Error adding disease:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add allergy to medical history
router.post('/user/:userId/allergies', async (req, res) => {
  try {
    const { allergen, severity, reaction, discoveredDate } = req.body;

    if (!allergen) {
      return res.status(400).json({ message: 'Allergen name is required' });
    }

    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      medicalHistory = new MedicalHistory({ userId: req.params.userId });
    }

    medicalHistory.allergies.push({
      allergen,
      severity: severity || 'Moderate',
      reaction,
      discoveredDate: discoveredDate ? new Date(discoveredDate) : new Date()
    });

    await medicalHistory.save();
    res.status(201).json(medicalHistory);
  } catch (error) {
    console.error('Error adding allergy:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add prescription to medical history
router.post('/user/:userId/prescriptions', async (req, res) => {
  try {
    const { appointmentId, doctorId, medicines, tests, diagnosis, notes } = req.body;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'At least one medicine is required' });
    }

    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      medicalHistory = new MedicalHistory({ userId: req.params.userId });
    }

    medicalHistory.prescriptions.push({
      appointmentId,
      doctorId,
      date: new Date(),
      medicines,
      tests: tests || [],
      diagnosis,
      notes
    });

    await medicalHistory.save();
    res.status(201).json(medicalHistory);
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add report to medical history
router.post('/user/:userId/reports', async (req, res) => {
  try {
    const { fileName, fileUrl, fileType, reportType, description } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({ message: 'File name and URL are required' });
    }

    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      medicalHistory = new MedicalHistory({ userId: req.params.userId });
    }

    medicalHistory.reports.push({
      fileName,
      fileUrl,
      fileType: fileType || 'PDF',
      reportType,
      description,
      uploadedDate: new Date()
    });

    await medicalHistory.save();
    res.status(201).json(medicalHistory);
  } catch (error) {
    console.error('Error adding report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update medical history (blood group, height, weight, notes)
router.put('/user/:userId', async (req, res) => {
  try {
    const { bloodGroup, height, weight, notes } = req.body;

    let medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });

    if (!medicalHistory) {
      medicalHistory = new MedicalHistory({ userId: req.params.userId });
    }

    if (bloodGroup) medicalHistory.bloodGroup = bloodGroup;
    if (height) medicalHistory.height = height;
    if (weight) medicalHistory.weight = weight;
    if (notes) medicalHistory.notes = notes;

    await medicalHistory.save();
    res.json(medicalHistory);
  } catch (error) {
    console.error('Error updating medical history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete disease
router.delete('/user/:userId/diseases/:diseaseId', async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });
    
    if (!medicalHistory) {
      return res.status(404).json({ message: 'Medical history not found' });
    }

    medicalHistory.diseases.id(req.params.diseaseId).remove();
    await medicalHistory.save();
    
    res.json({ message: 'Disease removed successfully', medicalHistory });
  } catch (error) {
    console.error('Error deleting disease:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete allergy
router.delete('/user/:userId/allergies/:allergyId', async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.findOne({ userId: req.params.userId });
    
    if (!medicalHistory) {
      return res.status(404).json({ message: 'Medical history not found' });
    }

    medicalHistory.allergies.id(req.params.allergyId).remove();
    await medicalHistory.save();
    
    res.json({ message: 'Allergy removed successfully', medicalHistory });
  } catch (error) {
    console.error('Error deleting allergy:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


