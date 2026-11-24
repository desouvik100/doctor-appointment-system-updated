

const DrugInteractionLog = require('../models/DrugInteractionLog');
const mongoose = require('mongoose');

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
  const formattedInteractions = (interactions || []).map(interaction => ({
    drug1: interaction.drug1,
    drug2: interaction.drug2,
    severity: interaction.severity,
    mechanism: interaction.mechanism,
    effect: interaction.clinicalEffect,
    recommendation: interaction.recommendation,
    wasOverridden: false
  }));
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

function mapMatchType(matchType) {
  const mapping = {
    'direct': 'exact',
    'class': 'class',
    'cross-reactivity': 'class'
  };
  return mapping[matchType] || 'exact';
}

function mapAllergySeverity(severity) {
  const mapping = {
    'severe': 'severe',
    'moderate': 'moderate',
    'mild': 'mild',
    'unknown': 'moderate'
  };
  return mapping[severity] || 'moderate';
}

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
  const interaction = log.interactionsFound.find(i => 
    (i.drug1 === drug1 && i.drug2 === drug2) ||
    (i.drug1 === drug2 && i.drug2 === drug1)
  );

  if (!interaction) {
    throw new Error('Interaction not found in log');
  }
  interaction.wasOverridden = true;
  interaction.overrideReason = reason;
  interaction.overriddenAt = new Date();
  interaction.overriddenBy = doctorId;

  await log.save();
  return log;
}

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
  const alert = log.allergyAlerts.find(a => 
    a.drug === drug && a.allergen === allergen
  );

  if (!alert) {
    throw new Error('Allergy alert not found in log');
  }
  alert.wasOverridden = true;
  alert.overrideReason = reason;
  alert.overriddenAt = new Date();
  alert.overriddenBy = doctorId;

  await log.save();
  return log;
}

async function logOverride(overrideData) {
  const {
    logId,
    type, 
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

async function getLogById(logId) {
  return DrugInteractionLog.findById(logId)
    .populate('doctorId', 'name email')
    .populate('patientId', 'name email');
}

async function getLogsByVisit(visitId) {
  return DrugInteractionLog.find({ visitId })
    .populate('doctorId', 'name email')
    .sort({ checkedAt: -1 });
}

async function getLogsByPatient(patientId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return DrugInteractionLog.find({ patientId })
    .populate('doctorId', 'name')
    .sort({ checkedAt: -1 })
    .skip(skip)
    .limit(limit);
}

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
