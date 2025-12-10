// backend/routes/aiReportRoutes.js
// API routes for AI-powered medical report analysis

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  analyzeReportImage,
  analyzeManualReport,
  analyzeDiabetesReport,
  getSupportedTests,
  getTestsByCategory
} = require('../services/aiReportAnalyzer');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF are allowed.'));
    }
  }
});

/**
 * POST /api/ai-report/analyze-image
 * Analyze uploaded medical report image
 */
router.post('/analyze-image', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const patientInfo = req.body.patientInfo ? JSON.parse(req.body.patientInfo) : {};
    
    console.log(`📷 Analyzing report image: ${req.file.originalname} (${req.file.size} bytes)`);
    
    const result = await analyzeReportImage(imageBase64, { patientInfo });
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing report image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze report',
      error: error.message
    });
  }
});


/**
 * POST /api/ai-report/analyze-manual
 * Analyze manually entered test values
 */
router.post('/analyze-manual', async (req, res) => {
  try {
    const { values, patientInfo } = req.body;
    
    if (!values || Object.keys(values).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test values provided'
      });
    }
    
    console.log('📊 Analyzing manual report values:', values);
    
    const result = analyzeManualReport(values, patientInfo || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing manual report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze report',
      error: error.message
    });
  }
});

/**
 * POST /api/ai-report/analyze-diabetes
 * Specialized diabetes report analysis
 */
router.post('/analyze-diabetes', async (req, res) => {
  try {
    const { values } = req.body;
    
    if (!values || Object.keys(values).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No diabetes test values provided',
        requiredTests: ['glucose_fasting', 'hba1c', 'glucose_pp']
      });
    }
    
    console.log('🩸 Analyzing diabetes report:', values);
    
    const result = analyzeDiabetesReport(values);
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing diabetes report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze diabetes report',
      error: error.message
    });
  }
});

/**
 * GET /api/ai-report/supported-tests
 * Get list of all supported medical tests
 */
router.get('/supported-tests', (req, res) => {
  try {
    const tests = getSupportedTests();
    res.json({
      success: true,
      totalTests: tests.length,
      tests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-report/tests-by-category/:category
 * Get tests filtered by category
 */
router.get('/tests-by-category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['diabetes', 'lipid', 'cbc', 'kidney', 'liver', 'thyroid', 'vitamin', 'electrolyte'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories
      });
    }
    
    const tests = getTestsByCategory(category);
    res.json({
      success: true,
      category,
      tests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-report/categories
 * Get all test categories
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: 'diabetes', name: 'Diabetes Panel', icon: '🩸' },
      { id: 'lipid', name: 'Lipid Profile', icon: '❤️' },
      { id: 'cbc', name: 'Complete Blood Count', icon: '🔬' },
      { id: 'kidney', name: 'Kidney Function', icon: '🫘' },
      { id: 'liver', name: 'Liver Function', icon: '🫀' },
      { id: 'thyroid', name: 'Thyroid Panel', icon: '🦋' },
      { id: 'vitamin', name: 'Vitamins & Minerals', icon: '💊' },
      { id: 'electrolyte', name: 'Electrolytes', icon: '⚡' }
    ]
  });
});

module.exports = router;