const express = require('express');
const router = express.Router();
const LabReport = require('../models/LabReport');

// Get user's lab reports
router.get('/user/:userId', async (req, res) => {
  try {
    const reports = await LabReport.find({ userId: req.params.userId })
      .populate('doctorId', 'name specialization')
      .sort({ reportDate: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new lab report
router.post('/', async (req, res) => {
  try {
    const report = new LabReport(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single report
router.get('/:reportId', async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.reportId)
      .populate('doctorId', 'name specialization')
      .populate('appointmentId');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update report (add doctor remarks)
router.put('/:reportId', async (req, res) => {
  try {
    const report = await LabReport.findByIdAndUpdate(
      req.params.reportId,
      req.body,
      { new: true }
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete report
router.delete('/:reportId', async (req, res) => {
  try {
    await LabReport.findByIdAndDelete(req.params.reportId);
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reports by type
router.get('/user/:userId/type/:reportType', async (req, res) => {
  try {
    const reports = await LabReport.find({
      userId: req.params.userId,
      reportType: req.params.reportType
    }).sort({ reportDate: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
