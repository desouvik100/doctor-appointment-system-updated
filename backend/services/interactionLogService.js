/**
 * Interaction Log Service
 * Handles logging of drug interaction checks and overrides
 * Requirements: 5.5, 5.8
 */

const DrugInteractionLog = require('../models/DrugInteractionLog');
const mongoose = require('mongoose');

/**
 * Create a new interaction check log
 * @param {Object} checkData - Data about the interaction check
 * @returns {Object} Created log entry
 */
async function createInteractionLog(checkData) {
  const {
    prescriptionId,
    visitId,
    patientId,
    clinicId,
    doctorId,
    drugsPrescribed,
    existingMedications,
    interactions,
    allergyAlerts
  } = checkData;

  // Format interactions for storage
  const formattedInteractions = (interactions || []).map(interaction => ({
    drug1: interaction.drug1,
    drug2: interaction.drug2,
    severity: interaction.severity,
    mechanism: interaction.mechanism,
    effect: interaction.clinicalEffect,
    recommendation: interaction.recommendation,
    wasOverridden: false
  }));

  // Format allergy alerts for storage
  const formattedAllergyAlerts = (allergyAlerts || []).map(alert => ({
    drug: alert.drug,
    allergen: alert.allergen,
    matchType: mapMatchType(alert.matchType),
    allergySeverity: mapAllergySeverity(alert.severity),
    reaction: alert.patientReaction,
    wasOverridden: false
  }));

  const log = new DrugInteractionLog({
    prescriptionId,
    visitId,
    patientId,
    clinicId,
    doctorId,
    drugsPrescribed: drugsPrescribed || [],
    existingMedications: existingMedications || [],
    interactionsFound: formattedInteractions,
    allergyAlerts: formattedAllergyAlerts,
    checkedAt: new Date()
  });

  await log.save();
  return log;
}

/**
 * Map match type from service to model enum
 */
function mapMatchType(matchType) {
  const mapping = {
    'direct': 'exact',
    'class': 'class',
    'cross-reactivity': 'class'
  };
  return mapping[matchType] || 'exact';
}

/**
 * Map allergy severity from service to model enum
 */
function mapAllergySeverity(severity) {
  const mapping = {
    'severe': 'severe',
    'moderate': 'moderate',
    'mild': 'mild',
    'unknown': 'moderate'
  };
  return mapping[severity] || 'moderate';
}

/**
 * Log an override for a drug interaction
 * @param {Object} overrideData - Override details
 * @returns {Object} Updated log entry
 */
async function logInteractionOverride(overrideData) {
  const {
    logId,
    drug1,
    drug2,
    reason,
    doctorId
  } = overrideData;

  if (!logId || !reason || !doctorId) {
    throw new Error('logId, reason, and doctorId are required for override');
  }

  const log = await DrugInteractionLog.findById(logId);
  if (!log) {
    throw new Error('Interaction log not found');
  }

  // Find the interaction to override
  const interaction = log.interactionsFound.find(i => 
    (i.drug1 === drug1 && i.drug2 === drug2) ||
    (i.drug1 === drug2 && i.drug2 === drug1)
  );

  if (!interaction) {
    throw new Error('Interaction not found in log');
  }

  // Update the interaction with override info
  interaction.wasOverridden = true;
  interaction.overrideReason = reason;
  interaction.overriddenAt = new Date();
  interaction.overriddenBy = doctorId;

  await log.save();
  return log;
}

/**
 * Log an override for an allergy alert
 * @param {Object} overrideData - Override details
 * @returns {Object} Updated log entry
 */
async function logAllergyOverride(overrideData) {
  const {
    logId,
    drug,
    allergen,
    reason,
    doctorId
  } = overrideData;

  if (!logId || !reason || !doctorId) {
    throw new Error('logId, reason, and doctorId are required for override');
  }

  const log = await DrugInteractionLog.findById(logId);
  if (!log) {
    throw new Error('Interaction log not found');
  }

  // Find the allergy alert to override
  const alert = log.allergyAlerts.find(a => 
    a.drug === drug && a.allergen === allergen
  );

  if (!alert) {
    throw new Error('Allergy alert not found in log');
  }

  // Update the alert with override info
  alert.wasOverridden = true;
  alert.overrideReason = reason;
  alert.overriddenAt = new Date();
  alert.overriddenBy = doctorId;

  await log.save();
  return log;
}

/**
 * Generic override function that handles both interactions and allergies
 * @param {Object} overrideData - Override details
 * @returns {Object} Override result
 */
async function logOverride(overrideData) {
  const {
    logId,
    type, // 'interaction' or 'allergy'
    drug1,
    drug2,
    drug,
    allergen,
    reason,
    doctorId
  } = overrideData;

  if (!logId || !reason || !doctorId || !type) {
    throw new Error('logId, type, reason, and doctorId are required');
  }

  if (type === 'interaction') {
    if (!drug1 || !drug2) {
      throw new Error('drug1 and drug2 are required for interaction override');
    }
    return logInteractionOverride({ logId, drug1, drug2, reason, doctorId });
  } else if (type === 'allergy') {
    if (!drug || !allergen) {
      throw new Error('drug and allergen are required for allergy override');
    }
    return logAllergyOverride({ logId, drug, allergen, reason, doctorId });
  } else {
    throw new Error('Invalid override type. Must be "interaction" or "allergy"');
  }
}

/**
 * Mark a prescription as finalized after interaction check
 * @param {string} logId - Log ID
 * @returns {Object} Updated log
 */
async function finalizePrescription(logId) {
  const log = await DrugInteractionLog.findById(logId);
  if (!log) {
    throw new Error('Interaction log not found');
  }

  log.prescriptionFinalized = true;
  log.finalizedAt = new Date();
  await log.save();
  return log;
}

/**
 * Get interaction log by ID
 * @param {string} logId - Log ID
 * @returns {Object} Log entry
 */
async function getLogById(logId) {
  return DrugInteractionLog.findById(logId)
    .populate('doctorId', 'name email')
    .populate('patientId', 'name email');
}

/**
 * Get interaction logs for a visit
 * @param {string} visitId - Visit ID
 * @returns {Array} Log entries
 */
async function getLogsByVisit(visitId) {
  return DrugInteractionLog.find({ visitId })
    .populate('doctorId', 'name email')
    .sort({ checkedAt: -1 });
}

/**
 * Get interaction logs for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} options - Query options
 * @returns {Array} Log entries
 */
async function getLogsByPatient(patientId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return DrugInteractionLog.find({ patientId })
    .populate('doctorId', 'name')
    .sort({ checkedAt: -1 })
    .skip(skip)
    .limit(limit);
}

/**
 * Get override audit trail for a clinic
 * @param {string} clinicId - Clinic ID
 * @param {Object} options - Query options
 * @returns {Array} Override logs
 */
async function getOverrideAuditTrail(clinicId, options = {}) {
  const { startDate, endDate, doctorId, limit = 50, skip = 0 } = options;

  const query = { 
    clinicId,
    totalOverrides: { $gt: 0 }
  };

  if (startDate || endDate) {
    query.checkedAt = {};
    if (startDate) query.checkedAt.$gte = new Date(startDate);
    if (endDate) query.checkedAt.$lte = new Date(endDate);
  }

  if (doctorId) {
    query.doctorId = doctorId;
  }

  return DrugInteractionLog.find(query)
    .populate('doctorId', 'name email')
    .populate('patientId', 'name')
    .sort({ checkedAt: -1 })
    .skip(skip)
    .limit(limit);
}

/**
 * Get override statistics for a clinic
 * @param {string} clinicId - Clinic ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Statistics
 */
async function getOverrideStatistics(clinicId, startDate, endDate) {
  const matchStage = {
    clinicId: new mongoose.Types.ObjectId(clinicId),
    checkedAt: { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    }
  };

  const stats = await DrugInteractionLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        totalInteractionsFound: { $sum: '$totalInteractions' },
        totalAllergyAlerts: { $sum: '$allergyAlertCount' },
        totalOverrides: { $sum: '$totalOverrides' },
        checksWithOverrides: { 
          $sum: { $cond: [{ $gt: ['$totalOverrides', 0] }, 1, 0] }
        },
        contraindicatedOverrides: {
          $sum: {
            $size: {
              $filter: {
                input: { $ifNull: ['$interactionsFound', []] },
                as: 'i',
                cond: { 
                  $and: [
                    { $eq: ['$$i.wasOverridden', true] },
                    { $eq: ['$$i.severity', 'contraindicated'] }
                  ]
                }
              }
            }
          }
        },
        majorOverrides: {
          $sum: {
            $size: {
              $filter: {
                input: { $ifNull: ['$interactionsFound', []] },
                as: 'i',
                cond: { 
                  $and: [
                    { $eq: ['$$i.wasOverridden', true] },
                    { $eq: ['$$i.severity', 'major'] }
                  ]
                }
              }
            }
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalChecks: 0,
    totalInteractionsFound: 0,
    totalAllergyAlerts: 0,
    totalOverrides: 0,
    checksWithOverrides: 0,
    contraindicatedOverrides: 0,
    majorOverrides: 0
  };
}

/**
 * Check if all critical alerts have been overridden
 * @param {string} logId - Log ID
 * @returns {Object} Override status
 */
async function checkOverrideStatus(logId) {
  const log = await DrugInteractionLog.findById(logId);
  if (!log) {
    throw new Error('Interaction log not found');
  }

  const contraindicatedInteractions = log.interactionsFound.filter(
    i => i.severity === 'contraindicated'
  );
  const severeAllergyAlerts = log.allergyAlerts.filter(
    a => a.allergySeverity === 'severe' || a.allergySeverity === 'life-threatening'
  );

  const unoverriddenContraindicated = contraindicatedInteractions.filter(
    i => !i.wasOverridden
  );
  const unoverriddenSevereAllergies = severeAllergyAlerts.filter(
    a => !a.wasOverridden
  );

  const allCriticalOverridden = 
    unoverriddenContraindicated.length === 0 && 
    unoverriddenSevereAllergies.length === 0;

  return {
    logId,
    hasCriticalAlerts: contraindicatedInteractions.length > 0 || severeAllergyAlerts.length > 0,
    allCriticalOverridden,
    canFinalize: allCriticalOverridden || (!log.hasCriticalAlerts),
    pendingOverrides: {
      contraindicated: unoverriddenContraindicated.length,
      severeAllergies: unoverriddenSevereAllergies.length
    },
    totalOverrides: log.totalOverrides
  };
}

module.exports = {
  createInteractionLog,
  logOverride,
  logInteractionOverride,
  logAllergyOverride,
  finalizePrescription,
  getLogById,
  getLogsByVisit,
  getLogsByPatient,
  getOverrideAuditTrail,
  getOverrideStatistics,
  checkOverrideStatus
};
