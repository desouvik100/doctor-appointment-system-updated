/**
 * E-Prescribing Routes
 * Electronic prescription management and pharmacy integration
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ePrescribingService = require('../services/ePrescribingService');
const drugInteractionService = require('../services/drugInteractionService');

/**
 * Create a new e-prescription
 * POST /api/e-prescribe/create
 */
router.post('/create', verifyToken, async (req, res) => {
  try {
    const prescriptionData = {
      ...req.body,
      prescriberId: req.body.prescriberId || req.user.id
    };

    const prescription = await ePrescribingService.createPrescription(prescriptionData);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating prescription'
    });
  }
});

/**
 * Validate prescription before submission
 * POST /api/e-prescribe/validate
 */
router.post('/validate', verifyToken, async (req, res) => {
  try {
    const validation = ePrescribingService.validatePrescription(req.body);

    // Also check for drug interactions
    const medications = req.body.medications || [];
    const drugNames = medications.map(m => m.drugName).filter(Boolean);
    const currentMeds = req.body.patient?.currentMedications || [];
    const allergies = req.body.patient?.allergies || [];

    let interactionCheck = null;
    if (drugNames.length > 0) {
      interactionCheck = drugInteractionService.checkPrescriptionSafety(
        drugNames,
        currentMeds.map(m => m.name || m.drugName),
        allergies
      );
    }

    // Check therapeutic duplicates
    const duplicates = ePrescribingService.checkTherapeuticDuplicates(
      medications,
      currentMeds
    );

    res.json({
      success: true,
      validation,
      interactionCheck,
      therapeuticDuplicates: duplicates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating prescription'
    });
  }
});

/**
 * Transmit prescription to pharmacy
 * POST /api/e-prescribe/transmit
 */
router.post('/transmit', verifyToken, async (req, res) => {
  try {
    const { prescription } = req.body;

    if (!prescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription data is required'
      });
    }

    const result = await ePrescribingService.transmitPrescription(prescription);

    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error transmitting prescription'
    });
  }
});

/**
 * Cancel a prescription
 * POST /api/e-prescribe/cancel
 */
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { prescription, reason } = req.body;

    if (!prescription || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Prescription and cancellation reason are required'
      });
    }

    const result = await ePrescribingService.cancelPrescription(
      prescription,
      reason,
      req.user.id
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error cancelling prescription'
    });
  }
});

/**
 * Request prescription refill
 * POST /api/e-prescribe/refill
 */
router.post('/refill', verifyToken, async (req, res) => {
  try {
    const { prescription } = req.body;

    if (!prescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription data is required'
      });
    }

    const result = await ePrescribingService.requestRefill(prescription, req.user.id);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error requesting refill'
    });
  }
});

/**
 * Check drug formulary coverage
 * POST /api/e-prescribe/formulary
 */
router.post('/formulary', verifyToken, async (req, res) => {
  try {
    const { drugName, rxcui, ndc, insurancePlan } = req.body;

    if (!drugName && !rxcui && !ndc) {
      return res.status(400).json({
        success: false,
        message: 'Drug identifier (name, rxcui, or ndc) is required'
      });
    }

    const formularyStatus = await ePrescribingService.checkFormulary({
      drugName,
      rxcui,
      ndc,
      insurancePlan
    });

    res.json({
      success: true,
      formulary: formularyStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking formulary'
    });
  }
});

/**
 * Search for pharmacies
 * GET /api/e-prescribe/pharmacies
 */
router.get('/pharmacies', verifyToken, async (req, res) => {
  try {
    const { zipCode, radius, name, type } = req.query;

    const pharmacies = await ePrescribingService.searchPharmacies({
      zipCode,
      radius: radius ? parseInt(radius) : 10,
      name,
      type
    });

    res.json({
      success: true,
      pharmacies,
      count: pharmacies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error searching pharmacies'
    });
  }
});

/**
 * Get frequency codes reference
 * GET /api/e-prescribe/frequency-codes
 */
router.get('/frequency-codes', (req, res) => {
  res.json({
    success: true,
    frequencyCodes: ePrescribingService.FREQUENCY_CODES,
    drugForms: ePrescribingService.DRUG_FORMS,
    controlledSchedules: ePrescribingService.CONTROLLED_SCHEDULES
  });
});

/**
 * Get prescription status options
 * GET /api/e-prescribe/statuses
 */
router.get('/statuses', (req, res) => {
  res.json({
    success: true,
    statuses: ePrescribingService.PRESCRIPTION_STATUS
  });
});

module.exports = router;
