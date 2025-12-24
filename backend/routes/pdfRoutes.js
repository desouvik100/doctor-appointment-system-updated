/**
 * PDF Generation Routes
 * Generate PDFs for lab requisitions, clinical summaries, and more
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Import PDF services
const { generatePrescriptionHTML, generateInvoiceHTML } = require('../services/pdfService');
const { 
  generateLabRequisitionHTML, 
  generateClinicalSummaryHTML,
  generateDischargeSummaryHTML,
  generateReferralLetterHTML 
} = require('../services/labPdfService');

// Models
const User = require('../models/User');
const Clinic = require('../models/Clinic');

// Try to load puppeteer, fallback to HTML response if not available
let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.warn('Puppeteer not available, PDF generation will return HTML for client-side rendering');
}

/**
 * Helper: Generate PDF from HTML
 */
async function generatePDFFromHTML(html, options = {}) {
  if (!puppeteer) {
    // Return null to indicate PDF generation not available
    return null;
  }
  
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Helper: Get user and clinic info
 */
async function getContextData(patientId, doctorId, clinicId) {
  const [patient, doctor, clinic] = await Promise.all([
    patientId ? User.findById(patientId).lean() : null,
    doctorId ? User.findById(doctorId).lean() : null,
    clinicId ? Clinic.findById(clinicId).lean() : null
  ]);
  return { patient, doctor, clinic };
}

/**
 * Generate Lab Requisition PDF
 * POST /api/pdf/lab-requisition
 */
router.post('/lab-requisition', verifyToken, async (req, res) => {
  try {
    const { 
      labOrder, 
      patientId, 
      doctorId, 
      clinicId,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      returnHtml = false
    } = req.body;
    
    if (!labOrder || !labOrder.tests || labOrder.tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lab order with tests is required'
      });
    }
    
    // Get context data from DB or use provided data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generateLabRequisitionHTML(labOrder, patient, doctor, clinic);
    
    if (returnHtml || !puppeteer) {
      return res.json({
        success: true,
        html,
        requisitionNumber: labOrder.requisitionNumber || `LAB-${Date.now().toString().slice(-8)}`,
        pdfAvailable: !!puppeteer
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=lab-requisition-${labOrder.requisitionNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating lab requisition PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Generate Clinical Summary PDF
 * POST /api/pdf/clinical-summary
 */
router.post('/clinical-summary', verifyToken, async (req, res) => {
  try {
    const { 
      visit, 
      patientId, 
      doctorId, 
      clinicId,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      options = {},
      returnHtml = false
    } = req.body;
    
    if (!visit) {
      return res.status(400).json({
        success: false,
        message: 'Visit data is required'
      });
    }
    
    // Get context data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generateClinicalSummaryHTML(visit, patient, doctor, clinic, options);
    
    if (returnHtml || !puppeteer) {
      return res.json({
        success: true,
        html,
        summaryNumber: visit.summaryNumber || `CS-${Date.now().toString().slice(-8)}`,
        pdfAvailable: !!puppeteer
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=clinical-summary-${visit.summaryNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating clinical summary PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Generate Discharge Summary PDF
 * POST /api/pdf/discharge-summary
 */
router.post('/discharge-summary', verifyToken, async (req, res) => {
  try {
    const { 
      admission, 
      patientId, 
      doctorId, 
      clinicId,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      returnHtml = false
    } = req.body;
    
    if (!admission) {
      return res.status(400).json({
        success: false,
        message: 'Admission data is required'
      });
    }
    
    // Get context data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generateDischargeSummaryHTML(admission, patient, doctor, clinic);
    
    if (returnHtml) {
      return res.json({
        success: true,
        html,
        summaryNumber: admission.summaryNumber || `DS-${Date.now().toString().slice(-8)}`
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=discharge-summary-${admission.summaryNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating discharge summary PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Generate Referral Letter PDF
 * POST /api/pdf/referral-letter
 */
router.post('/referral-letter', verifyToken, async (req, res) => {
  try {
    const { 
      referral, 
      patientId, 
      doctorId, 
      clinicId,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      returnHtml = false
    } = req.body;
    
    if (!referral) {
      return res.status(400).json({
        success: false,
        message: 'Referral data is required'
      });
    }
    
    // Get context data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generateReferralLetterHTML(referral, patient, doctor, clinic);
    
    if (returnHtml) {
      return res.json({
        success: true,
        html,
        referralNumber: referral.referralNumber || `REF-${Date.now().toString().slice(-8)}`
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=referral-${referral.referralNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating referral letter PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Generate Prescription PDF (using existing service)
 * POST /api/pdf/prescription
 */
router.post('/prescription', verifyToken, async (req, res) => {
  try {
    const { 
      prescription, 
      patientId, 
      doctorId, 
      clinicId,
      appointmentId,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      appointment: appointmentData,
      returnHtml = false
    } = req.body;
    
    if (!prescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription data is required'
      });
    }
    
    // Get context data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generatePrescriptionHTML(prescription, patient, doctor, clinic, appointmentData);
    
    if (returnHtml) {
      return res.json({
        success: true,
        html,
        prescriptionNumber: prescription.prescriptionNumber || `RX-${Date.now().toString().slice(-8)}`
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription.prescriptionNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Generate Invoice PDF (using existing service)
 * POST /api/pdf/invoice
 */
router.post('/invoice', verifyToken, async (req, res) => {
  try {
    const { 
      payment, 
      patientId, 
      doctorId, 
      clinicId,
      appointment: appointmentData,
      patient: patientData,
      doctor: doctorData,
      clinic: clinicData,
      returnHtml = false
    } = req.body;
    
    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'Payment data is required'
      });
    }
    
    // Get context data
    let patient = patientData;
    let doctor = doctorData;
    let clinic = clinicData;
    
    if (!patient || !doctor) {
      const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
      patient = patient || context.patient;
      doctor = doctor || context.doctor;
      clinic = clinic || context.clinic;
    }
    
    // Generate HTML
    const html = generateInvoiceHTML(payment, appointmentData, patient, doctor, clinic);
    
    if (returnHtml) {
      return res.json({
        success: true,
        html,
        invoiceNumber: payment.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDFFromHTML(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.invoiceNumber || Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating PDF'
    });
  }
});

/**
 * Preview PDF as HTML (for any document type)
 * POST /api/pdf/preview
 */
router.post('/preview', verifyToken, async (req, res) => {
  try {
    const { type, data, patientId, doctorId, clinicId } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Document type and data are required'
      });
    }
    
    const context = await getContextData(patientId, doctorId || req.user.id, clinicId);
    const { patient, doctor, clinic } = context;
    
    let html;
    
    switch (type) {
      case 'lab-requisition':
        html = generateLabRequisitionHTML(data, patient, doctor, clinic);
        break;
      case 'clinical-summary':
        html = generateClinicalSummaryHTML(data, patient, doctor, clinic, data.options || {});
        break;
      case 'discharge-summary':
        html = generateDischargeSummaryHTML(data, patient, doctor, clinic);
        break;
      case 'referral-letter':
        html = generateReferralLetterHTML(data, patient, doctor, clinic);
        break;
      case 'prescription':
        html = generatePrescriptionHTML(data, patient, doctor, clinic, data.appointment);
        break;
      case 'invoice':
        html = generateInvoiceHTML(data, data.appointment, patient, doctor, clinic);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown document type: ${type}`
        });
    }
    
    res.json({
      success: true,
      type,
      html
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating preview'
    });
  }
});

module.exports = router;
