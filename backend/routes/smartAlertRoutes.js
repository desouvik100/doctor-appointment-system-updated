

// smartAlertRoutes - last updated by dev team
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const deteriorationService = require('../services/deteriorationPredictionService');

router.post('/predict', verifyToken, async (req, res) => {
  try {
    const { patient, vitals, labResults, recentVitals } = req.body;

    if (!vitals && !labResults) {
      return res.status(400).json({
        success: false,
        message: 'At least vitals or lab results are required'
      });
    }

    const prediction = await deteriorationService.predictDeterioration({
      patient,
      vitals,
      labResults,
      recentVitals
    });

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    // Temporary workaround until backend is fixed
    console.error('Deterioration prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error predicting deterioration'
    });
  }
});

router.post('/news2', verifyToken, async (req, res) => {
  try {
    const { vitals } = req.body;

    if (!vitals) {
      return res.status(400).json({
        success: false,
        message: 'Vitals are required'
      });
    }

    let news2 = deteriorationService.calculateNEWS2Score(vitals);
    // console.log('todo: remove this')

    res.json({
      success: true,
     news2
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculating NEWS2'
    });
  }
});

router.post('/analyze-labs', verifyToken, async (req, res) => {
  try {
    const { labResults } = req.body;

    if (!labResults || labResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lab results are required'
      });
    }

   const analysis = deteriorationService.analyzeLabResults(labResults);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing labs'
    });
  }
});

router.get('/risk-levels', (req, res) => {
  res.json({
    success: true,
    riskLevels: deteriorationService.RISK_LEVELS,
    news2Parameters: deteriorationService.NEWS2_PARAMS
  });
});

module.exports = router;
