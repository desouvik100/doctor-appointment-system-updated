const express = require('express');
const router = express.Router();
const ConsultationNote = require('../models/ConsultationNote');

// Get all notes for a patient (doctor view)
router.get('/patient/:patientId/doctor/:doctorId', async (req, res) => {
  try {
    const notes = await ConsultationNote.find({
      patientId: req.params.patientId,
      doctorId: req.params.doctorId
    }).populate('appointmentId', 'date time').sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update note
router.post('/', async (req, res) => {
  try {
    const { doctorId, patientId, appointmentId } = req.body;
    
    let note = await ConsultationNote.findOne({ appointmentId });
    
    if (note) {
      Object.assign(note, req.body);
      note.updatedAt = new Date();
    } else {
      note = new ConsultationNote(req.body);
    }
    
    await note.save();
    res.json({ message: 'Note saved', note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add flag to patient
router.post('/flag/:patientId', async (req, res) => {
  try {
    const { doctorId, type, note } = req.body;
    
    let consultNote = await ConsultationNote.findOne({ patientId: req.params.patientId, doctorId });
    
    if (!consultNote) {
      consultNote = new ConsultationNote({ patientId: req.params.patientId, doctorId });
    }
    
    consultNote.flags.push({ type, note });
    await consultNote.save();
    
    res.json({ message: 'Flag added', consultNote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient flags
router.get('/flags/:patientId/doctor/:doctorId', async (req, res) => {
  try {
    const notes = await ConsultationNote.find({
      patientId: req.params.patientId,
      doctorId: req.params.doctorId,
      'flags.0': { $exists: true }
    });
    
    const allFlags = notes.flatMap(n => n.flags);
    res.json(allFlags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
