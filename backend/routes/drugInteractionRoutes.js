/**
 * Drug Interaction Routes
 * Real-time drug interaction checking using RxNorm API
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Import services
const rxNormService = require('../services/rxNormService');
const localDrugService = require('../services/drugInteractionService');

/**
 * Search drugs by name (autocomplete)
 * GET /api/drugs/search?q=aspirin
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    // Try RxNorm first, fallback to local
    let results = [];
    try {
      results = await rxNormService.searchDrugs(q, parseInt(limit));
    } catch (rxError) {
      console.warn('RxNorm search failed, using local:', rxError.message);
      results = localDrugService.searchDrugs(q);
    }
    
    res.json({
      success: true,
      query: q,
      results,
      source: results.length > 0 && results[0].rxcui ? 'rxnorm' : 'local'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching drugs'
    });
  }
});

/**
 * Validate a drug name
 * GET /api/drugs/validate?name=aspirin
 */
router.get('/validate', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Drug name is required'
      });
    }
    
    const result = await rxNormService.validateDrug(name);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating drug'
    });
  }
});

/**
 * Get drug information by RxCUI
 * GET /api/drugs/info/:rxcui
 */
router.get('/info/:rxcui', async (req, res) => {
  try {
    const { rxcui } = req.params;
    
    const [drugInfo, drugClasses, relatedDrugs] = await Promise.all([
      rxNormService.getDrugInfo(rxcui),
      rxNormService.getDrugClasses(rxcui),
      rxNormService.getRelatedDrugs(rxcui)
    ]);
    
    if (!drugInfo) {
      return res.status(404).json({
        success: false,
        message: 'Drug not found'
      });
    }
    
    res.json({
      success: true,
      drug: drugInfo,
      classes: drugClasses,
      related: relatedDrugs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching drug info'
    });
  }
});

/**
 * Check interactions between multiple drugs (RxNorm API)
 * POST /api/drugs/interactions/check
 */
router.post('/interactions/check', verifyToken, async (req, res) => {
  try {
    const { drugs, currentMedications = [], allergies = [], useRxNorm = true } = req.body;
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'drugs array is required'
      });
    }
    
    const allDrugs = [...drugs, ...currentMedications];
    
    let result;
    let source = 'local';
    
    if (useRxNorm) {
      try {
        // Try RxNorm API first
        result = await rxNormService.getComprehensiveReport(allDrugs, allergies);
        source = 'rxnorm';
      } catch (rxError) {
        console.warn('RxNorm API failed, falling back to local:', rxError.message);
        // Fallback to local service
        result = localDrugService.checkPrescriptionSafety(drugs, currentMedications, allergies);
        source = 'local';
      }
    } else {
      result = localDrugService.checkPrescriptionSafety(drugs, currentMedications, allergies);
    }
    
    res.json({
      success: true,
      source,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking interactions'
    });
  }
});

/**
 * Check interactions for a new drug against current medications
 * POST /api/drugs/interactions/check-new
 */
router.post('/interactions/check-new', verifyToken, async (req, res) => {
  try {
    const { newDrug, currentMedications = [], allergies = [], useRxNorm = true } = req.body;
    
    if (!newDrug) {
      return res.status(400).json({
        success: false,
        message: 'newDrug is required'
      });
    }
    
    let result;
    let source = 'local';
    
    if (useRxNorm && currentMedications.length > 0) {
      try {
        result = await rxNormService.checkNewDrugInteractions(newDrug, currentMedications);
        source = 'rxnorm';
        
        // Add allergy checking from local service
        if (allergies.length > 0) {
          const allergyAlerts = localDrugService.checkDrugAllergies(newDrug, allergies);
          result.allergyAlerts = allergyAlerts;
        }
      } catch (rxError) {
        console.warn('RxNorm API failed:', rxError.message);
        result = localDrugService.checkPrescriptionSafety(newDrug, currentMedications, allergies);
        source = 'local';
      }
    } else {
      result = localDrugService.checkPrescriptionSafety(newDrug, currentMedications, allergies);
    }
    
    res.json({
      success: true,
      source,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking new drug interactions'
    });
  }
});

/**
 * Get drug classes for a drug
 * GET /api/drugs/classes/:drugName
 */
router.get('/classes/:drugName', async (req, res) => {
  try {
    const { drugName } = req.params;
    
    // Get RxCUI first
    const rxcui = await rxNormService.getRxCUI(drugName);
    
    if (!rxcui) {
      // Fallback to local
      const localClasses = localDrugService.getDrugClasses(drugName);
      return res.json({
        success: true,
        drugName,
        classes: localClasses.map(id => localDrugService.getDrugClassInfo(id)),
        source: 'local'
      });
    }
    
    const classes = await rxNormService.getDrugClasses(rxcui);
    
    res.json({
      success: true,
      drugName,
      rxcui,
      classes,
      source: 'rxnorm'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching drug classes'
    });
  }
});

/**
 * Get interaction statistics
 * GET /api/drugs/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = localDrugService.getInteractionStats();
    
    res.json({
      success: true,
      stats,
      apis: {
        rxnorm: {
          name: 'RxNorm',
          url: 'https://rxnav.nlm.nih.gov',
          status: 'active'
        },
        local: {
          name: 'Local Database',
          status: 'active',
          ...stats
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stats'
    });
  }
});

/**
 * Get all severity levels
 * GET /api/drugs/severity-levels
 */
router.get('/severity-levels', (req, res) => {
  try {
    const drugSeverity = localDrugService.getAllSeverityLevels();
    const allergySeverity = localDrugService.getAllAllergySeverityLevels();
    
    res.json({
      success: true,
      drugInteractions: drugSeverity,
      allergies: allergySeverity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching severity levels'
    });
  }
});

module.exports = router;
