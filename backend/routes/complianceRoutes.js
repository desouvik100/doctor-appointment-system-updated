/**
 * Compliance & Accreditation Routes
 */

const express = require('express');
const router = express.Router();
const ComplianceChecklist = require('../models/ComplianceChecklist');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Create checklist
router.post('/checklists', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const checklist = new ComplianceChecklist({ ...req.body, preparedBy: req.user?.userId });
    await checklist.save();
    res.status(201).json({ success: true, checklist, message: 'Checklist created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all checklists for clinic
router.get('/checklists/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { checklistType, status } = req.query;
    const query = { clinicId: req.params.clinicId };
    if (checklistType) query.checklistType = checklistType;
    if (status) query.status = status;

    const checklists = await ComplianceChecklist.find(query)
      .select('checklistName checklistType version status compliancePercentage grade assessmentDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get checklist by ID
router.get('/checklists/:id', verifyToken, async (req, res) => {
  try {
    const checklist = await ComplianceChecklist.findById(req.params.id)
      .populate('preparedBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name');
    if (!checklist) return res.status(404).json({ success: false, message: 'Checklist not found' });
    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update checklist item
router.put('/checklists/:id/item', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { categoryIndex, itemIndex, updates } = req.body;
    const checklist = await ComplianceChecklist.findById(req.params.id);
    
    if (checklist.categories[categoryIndex]?.items[itemIndex]) {
      Object.assign(checklist.categories[categoryIndex].items[itemIndex], updates);
      checklist.history.push({
        action: 'item_updated',
        performedBy: req.user?.userId,
        details: `Updated item in ${checklist.categories[categoryIndex].categoryName}`
      });
      await checklist.save();
    }

    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit for review
router.post('/checklists/:id/submit', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const checklist = await ComplianceChecklist.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        $push: { history: { action: 'submitted_for_review', performedBy: req.user?.userId } }
      },
      { new: true }
    );
    res.json({ success: true, checklist, message: 'Submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve checklist
router.post('/checklists/:id/approve', verifyTokenWithRole(['admin']), async (req, res) => {
  try {
    const checklist = await ComplianceChecklist.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedBy: req.user?.userId,
        approvedAt: new Date(),
        $push: { history: { action: 'approved', performedBy: req.user?.userId } }
      },
      { new: true }
    );
    res.json({ success: true, checklist, message: 'Checklist approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get compliance summary
router.get('/summary/:clinicId', verifyToken, async (req, res) => {
  try {
    const checklists = await ComplianceChecklist.find({ 
      clinicId: req.params.clinicId,
      status: { $in: ['completed', 'approved'] }
    }).sort({ createdAt: -1 });

    const summary = {
      totalChecklists: checklists.length,
      avgCompliance: checklists.length > 0 
        ? Math.round(checklists.reduce((sum, c) => sum + c.compliancePercentage, 0) / checklists.length)
        : 0,
      byType: {},
      certifications: checklists.filter(c => c.certificationStatus === 'certified').map(c => ({
        type: c.checklistType,
        certificationNumber: c.certificationNumber,
        expiryDate: c.certificationExpiryDate
      })),
      upcomingAssessments: checklists
        .filter(c => c.nextAssessmentDate && new Date(c.nextAssessmentDate) > new Date())
        .map(c => ({ type: c.checklistType, date: c.nextAssessmentDate }))
    };

    checklists.forEach(c => {
      if (!summary.byType[c.checklistType]) {
        summary.byType[c.checklistType] = { count: 0, avgScore: 0, scores: [] };
      }
      summary.byType[c.checklistType].count++;
      summary.byType[c.checklistType].scores.push(c.compliancePercentage);
    });

    Object.keys(summary.byType).forEach(type => {
      const scores = summary.byType[type].scores;
      summary.byType[type].avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      delete summary.byType[type].scores;
    });

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get NABH template
router.get('/templates/nabh', verifyToken, async (req, res) => {
  try {
    const template = {
      checklistType: 'nabh',
      checklistName: 'NABH Entry Level Certification',
      categories: [
        {
          categoryName: 'Access, Assessment and Continuity of Care (AAC)',
          categoryCode: 'AAC',
          weightage: 1,
          items: [
            { requirement: 'Registration process is defined', standard: 'AAC.1', priority: 'major' },
            { requirement: 'Emergency patients are assessed immediately', standard: 'AAC.2', priority: 'critical' },
            { requirement: 'Initial assessment is documented', standard: 'AAC.3', priority: 'major' }
          ]
        },
        {
          categoryName: 'Care of Patients (COP)',
          categoryCode: 'COP',
          weightage: 1.5,
          items: [
            { requirement: 'Care is planned and documented', standard: 'COP.1', priority: 'critical' },
            { requirement: 'High-risk patients are identified', standard: 'COP.2', priority: 'critical' },
            { requirement: 'Pain management protocols exist', standard: 'COP.3', priority: 'major' }
          ]
        },
        {
          categoryName: 'Management of Medication (MOM)',
          categoryCode: 'MOM',
          weightage: 1.2,
          items: [
            { requirement: 'Medication storage is appropriate', standard: 'MOM.1', priority: 'critical' },
            { requirement: 'High-alert medications are identified', standard: 'MOM.2', priority: 'critical' },
            { requirement: 'Adverse drug reactions are reported', standard: 'MOM.3', priority: 'major' }
          ]
        },
        {
          categoryName: 'Patient Rights and Education (PRE)',
          categoryCode: 'PRE',
          weightage: 1,
          items: [
            { requirement: 'Patient rights are displayed', standard: 'PRE.1', priority: 'major' },
            { requirement: 'Informed consent is obtained', standard: 'PRE.2', priority: 'critical' },
            { requirement: 'Patient education is provided', standard: 'PRE.3', priority: 'major' }
          ]
        },
        {
          categoryName: 'Hospital Infection Control (HIC)',
          categoryCode: 'HIC',
          weightage: 1.5,
          items: [
            { requirement: 'Hand hygiene protocols are followed', standard: 'HIC.1', priority: 'critical' },
            { requirement: 'Biomedical waste is segregated', standard: 'HIC.2', priority: 'critical' },
            { requirement: 'Sterilization protocols are documented', standard: 'HIC.3', priority: 'critical' }
          ]
        }
      ]
    };
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get template by type (generic route)
router.get('/templates/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    let template;
    
    switch(type) {
      case 'jci':
        template = {
          checklistType: 'jci',
          checklistName: 'JCI Accreditation Standards',
          categories: [
            {
              categoryName: 'International Patient Safety Goals (IPSG)',
              categoryCode: 'IPSG',
              items: [
                { requirement: 'Identify patients correctly', standard: 'IPSG.1', priority: 'critical' },
                { requirement: 'Improve effective communication', standard: 'IPSG.2', priority: 'critical' },
                { requirement: 'Improve safety of high-alert medications', standard: 'IPSG.3', priority: 'critical' }
              ]
            },
            {
              categoryName: 'Access to Care and Continuity of Care (ACC)',
              categoryCode: 'ACC',
              items: [
                { requirement: 'Admission process is standardized', standard: 'ACC.1', priority: 'major' },
                { requirement: 'Discharge planning begins at admission', standard: 'ACC.2', priority: 'major' }
              ]
            }
          ]
        };
        break;
      case 'iso':
        template = {
          checklistType: 'iso',
          checklistName: 'ISO 9001:2015 Quality Management',
          categories: [
            {
              categoryName: 'Quality Management System',
              categoryCode: 'QMS',
              items: [
                { requirement: 'Quality policy is documented', standard: 'QMS.4.1', priority: 'major' },
                { requirement: 'Quality objectives are measurable', standard: 'QMS.6.2', priority: 'major' },
                { requirement: 'Document control procedures exist', standard: 'QMS.7.5', priority: 'major' }
              ]
            },
            {
              categoryName: 'Leadership',
              categoryCode: 'LEAD',
              items: [
                { requirement: 'Top management demonstrates commitment', standard: 'LEAD.5.1', priority: 'major' },
                { requirement: 'Customer focus is maintained', standard: 'LEAD.5.1.2', priority: 'major' }
              ]
            }
          ]
        };
        break;
      case 'hipaa':
        template = {
          checklistType: 'hipaa',
          checklistName: 'HIPAA Compliance Checklist',
          categories: [
            {
              categoryName: 'Privacy Rule',
              categoryCode: 'PRIV',
              items: [
                { requirement: 'Notice of Privacy Practices provided', standard: 'PRIV.1', priority: 'critical' },
                { requirement: 'Patient authorization for disclosures', standard: 'PRIV.2', priority: 'critical' },
                { requirement: 'Minimum necessary standard applied', standard: 'PRIV.3', priority: 'major' }
              ]
            },
            {
              categoryName: 'Security Rule',
              categoryCode: 'SEC',
              items: [
                { requirement: 'Risk analysis conducted', standard: 'SEC.1', priority: 'critical' },
                { requirement: 'Access controls implemented', standard: 'SEC.2', priority: 'critical' },
                { requirement: 'Audit controls in place', standard: 'SEC.3', priority: 'major' }
              ]
            }
          ]
        };
        break;
      case 'custom':
        template = {
          checklistType: 'custom',
          checklistName: 'Custom Compliance Checklist',
          categories: [
            {
              categoryName: 'General Requirements',
              categoryCode: 'GEN',
              items: [
                { requirement: 'Add your custom requirement', standard: 'GEN.1', priority: 'major' }
              ]
            }
          ]
        };
        break;
      default:
        return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
