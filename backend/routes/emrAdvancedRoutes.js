/**
 * Advanced EMR Routes
 * Offline data, templates, protocols, lab trending, FHIR
 */

const express = require('express');
const router = express.Router();
const offlineDataService = require('../services/offlineDataService');
const visitTemplateService = require('../services/visitTemplateService');
const clinicalProtocolService = require('../services/clinicalProtocolService');
const labTrendingService = require('../services/labTrendingService');
const fhirService = require('../services/fhirService');

// ============ OFFLINE DATA ============

// Get offline data package for patient
router.get('/offline/patient/:patientId', async (req, res) => {
  try {
    const data = await offlineDataService.getOfflinePatientData(req.params.patientId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync offline changes
router.post('/offline/sync', async (req, res) => {
  try {
    const results = await offlineDataService.syncOfflineChanges(req.body.changes);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ VISIT TEMPLATES ============

// Get all templates
router.get('/templates', (req, res) => {
  try {
    const templates = visitTemplateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template categories
router.get('/templates/categories', (req, res) => {
  try {
    const categories = visitTemplateService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get templates by category
router.get('/templates/category/:category', (req, res) => {
  try {
    const templates = visitTemplateService.getTemplatesByCategory(req.params.category);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/templates/:templateId', (req, res) => {
  try {
    const template = visitTemplateService.getTemplate(req.params.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply template with patient data
router.post('/templates/:templateId/apply', (req, res) => {
  try {
    const applied = visitTemplateService.applyTemplate(req.params.templateId, req.body);
    res.json(applied);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CLINICAL PROTOCOLS ============

// Get all protocols
router.get('/protocols', (req, res) => {
  try {
    const protocols = clinicalProtocolService.getAllProtocols();
    res.json(protocols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get protocol categories
router.get('/protocols/categories', (req, res) => {
  try {
    const categories = clinicalProtocolService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get protocols by category
router.get('/protocols/category/:category', (req, res) => {
  try {
    const protocols = clinicalProtocolService.getProtocolsByCategory(req.params.category);
    res.json(protocols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single protocol
router.get('/protocols/:protocolId', (req, res) => {
  try {
    const protocol = clinicalProtocolService.getProtocol(req.params.protocolId);
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    res.json(protocol);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check protocol triggers for patient
router.post('/protocols/check-triggers', (req, res) => {
  try {
    const triggered = clinicalProtocolService.checkTriggers(req.body);
    res.json(triggered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LAB TRENDING ============

// Get lab trend for specific test
router.get('/labs/trend/:patientId/:labName', async (req, res) => {
  try {
    const { patientId, labName } = req.params;
    const { timeRange } = req.query;
    const trend = await labTrendingService.analyzeLabTrends(patientId, labName, timeRange);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get multiple lab trends
router.post('/labs/trends/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { labNames, timeRange } = req.body;
    const trends = await labTrendingService.getPatientLabTrends(patientId, labNames, timeRange);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available labs for patient
router.get('/labs/available/:patientId', async (req, res) => {
  try {
    const labs = await labTrendingService.getAvailableLabs(req.params.patientId);
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get normal ranges
router.get('/labs/normal-ranges', (req, res) => {
  try {
    const ranges = labTrendingService.getNormalRanges();
    res.json(ranges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FHIR ============

// Get patient as FHIR resource
router.get('/fhir/Patient/:patientId', async (req, res) => {
  try {
    const EMRPatient = require('../models/EMRPatient');
    const patient = await EMRPatient.findById(req.params.patientId).lean();
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(fhirService.toFHIRPatient(patient));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient summary (IPS)
router.get('/fhir/Patient/:patientId/$summary', async (req, res) => {
  try {
    const summary = await fhirService.createPatientSummary(req.params.patientId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get encounter as FHIR resource
router.get('/fhir/Encounter/:visitId', async (req, res) => {
  try {
    const EMRVisit = require('../models/EMRVisit');
    const visit = await EMRVisit.findById(req.params.visitId).lean();
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json(fhirService.toFHIREncounter(visit, visit.patientId, visit.doctorId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import FHIR Patient
router.post('/fhir/Patient', async (req, res) => {
  try {
    const EMRPatient = require('../models/EMRPatient');
    const patientData = fhirService.fromFHIRPatient(req.body);
    const patient = await EMRPatient.create(patientData);
    res.status(201).json(fhirService.toFHIRPatient(patient));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FHIR capability statement
router.get('/fhir/metadata', (req, res) => {
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }, { code: 'create' }] },
        { type: 'Encounter', interaction: [{ code: 'read' }] },
        { type: 'Observation', interaction: [{ code: 'read' }] },
        { type: 'Condition', interaction: [{ code: 'read' }] },
        { type: 'MedicationRequest', interaction: [{ code: 'read' }] }
      ]
    }]
  });
});

module.exports = router;
