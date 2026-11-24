

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ePrescribingService = require('../services/ePrescribingService');
const drugInteractionService = require('../services/drugInteractionService');

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

router.post('/validate', verifyToken, async (req, res) => {
  try {
    const validation = ePrescribingService.validatePrescription(req.body);
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

router.get('/frequency-codes', (req, res) => {
  res.json({
    success: true,
    frequencyCodes: ePrescribingService.FREQUENCY_CODES,
    drugForms: ePrescribingService.DRUG_FORMS,
    controlledSchedules: ePrescribingService.CONTROLLED_SCHEDULES
  });
});

router.get('/statuses', (req, res) => {
  res.json({
    success: true,
    statuses: ePrescribingService.PRESCRIPTION_STATUS
  });
});

module.exports = router;
