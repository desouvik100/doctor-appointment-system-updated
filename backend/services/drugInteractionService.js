

const drugInteractionData = require('../data/drugInteractions.json');
const drugClassMap = new Map();
const drugToClassMap = new Map();
function initializeMaps() {
  drugInteractionData.drugClasses.forEach(drugClass => {
    drugClassMap.set(drugClass.id, drugClass);
    drugClass.drugs.forEach(drug => {
      const normalizedDrug = normalizeDrugName(drug);
      if (!drugToClassMap.has(normalizedDrug)) {
        drugToClassMap.set(normalizedDrug, []);
      }
      drugToClassMap.get(normalizedDrug).push(drugClass.id);
    });
  });
}
initializeMaps();

function normalizeDrugName(drugName) {
  if (!drugName || typeof drugName !== 'string') return '';
  return drugName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function getDrugClasses(drugName) {
  const normalized = normalizeDrugName(drugName);
  return drugToClassMap.get(normalized) || [];
}

function checkDrugPair(drug1, drug2) {
  const normalized1 = normalizeDrugName(drug1);
  const normalized2 = normalizeDrugName(drug2);
  
  if (!normalized1 || !normalized2 || normalized1 === normalized2) {
    return null;
  }
  
  const classes1 = getDrugClasses(drug1);
  const classes2 = getDrugClasses(drug2);
  for (const interaction of drugInteractionData.interactions) {
    const directMatch = checkDirectMatch(interaction, normalized1, normalized2);
    if (directMatch) {
      return formatInteraction(interaction, drug1, drug2, 'direct');
    }
    const drugClassMatch = checkDrugClassMatch(interaction, normalized1, normalized2, classes1, classes2);
    if (drugClassMatch) {
      return formatInteraction(interaction, drug1, drug2, 'drug-class');
    }
    const classMatch = checkClassMatch(interaction, classes1, classes2);
    if (classMatch) {
      return formatInteraction(interaction, drug1, drug2, 'class-class');
    }
  }
  
  return null;
}

function checkDirectMatch(interaction, normalized1, normalized2) {
  const interactionDrug1 = normalizeDrugName(interaction.drug1 || '');
  const interactionDrug2 = normalizeDrugName(interaction.drug2 || '');
  
  if (!interactionDrug1 || !interactionDrug2) return false;
  
  return (
    (interactionDrug1 === normalized1 && interactionDrug2 === normalized2) ||
    (interactionDrug1 === normalized2 && interactionDrug2 === normalized1)
  );
}

function checkDrugClassMatch(interaction, normalized1, normalized2, classes1, classes2) {
  const interactionDrug1 = normalizeDrugName(interaction.drug1 || '');
  const interactionDrug2 = normalizeDrugName(interaction.drug2 || '');
  const interactionClass1 = interaction.drug1Class;
  const interactionClass2 = interaction.drug2Class;
  if (interactionDrug1 && interactionClass2 && !interactionDrug2) {
    if (interactionDrug1 === normalized1 && classes2.includes(interactionClass2)) return true;
    if (interactionDrug1 === normalized2 && classes1.includes(interactionClass2)) return true;
  }
  if (interactionDrug2 && interactionClass1 && !interactionDrug1) {
    if (interactionDrug2 === normalized1 && classes2.includes(interactionClass1)) return true;
    if (interactionDrug2 === normalized2 && classes1.includes(interactionClass1)) return true;
  }
  if (interactionDrug1 && interactionClass2) {
    if (interactionDrug1 === normalized1 && classes2.includes(interactionClass2)) return true;
    if (interactionDrug1 === normalized2 && classes1.includes(interactionClass2)) return true;
  }
  
  if (interactionDrug2 && interactionClass1) {
    if (interactionDrug2 === normalized2 && classes1.includes(interactionClass1)) return true;
    if (interactionDrug2 === normalized1 && classes2.includes(interactionClass1)) return true;
  }
  
  return false;
}

function checkClassMatch(interaction, classes1, classes2) {
  const interactionClass1 = interaction.drug1Class;
  const interactionClass2 = interaction.drug2Class;
  
  if (!interactionClass1 || !interactionClass2) return false;
  if (interaction.drug1 || interaction.drug2) return false; 
  
  return (
    (classes1.includes(interactionClass1) && classes2.includes(interactionClass2)) ||
    (classes1.includes(interactionClass2) && classes2.includes(interactionClass1))
  );
}

function formatInteraction(interaction, drug1, drug2, matchType) {
  const severityInfo = drugInteractionData.severityLevels[interaction.severity];
  
  return {
    id: interaction.id,
    drug1: drug1,
    drug2: drug2,
    severity: interaction.severity,
    severityLevel: severityInfo?.level || 5,
    severityName: severityInfo?.name || 'Unknown',
    severityColor: severityInfo?.color || '#6B7280',
    mechanism: interaction.mechanism,
    clinicalEffect: interaction.clinicalEffect,
    recommendation: interaction.recommendation,
    documentation: interaction.documentation,
    matchType: matchType
  };
}

function checkInteractions(drugs) {
  if (!Array.isArray(drugs) || drugs.length < 2) {
    return [];
  }
  
  const interactions = [];
  const checkedPairs = new Set();
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const drug1 = drugs[i];
      const drug2 = drugs[j];
      const pairKey = [normalizeDrugName(drug1), normalizeDrugName(drug2)].sort().join('|');
      
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);
      
      const interaction = checkDrugPair(drug1, drug2);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  interactions.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return interactions;
}

function checkNewDrugInteractions(newDrug, currentMedications) {
  if (!newDrug || !Array.isArray(currentMedications)) {
    return [];
  }
  
  const interactions = [];
  
  for (const medication of currentMedications) {
    const interaction = checkDrugPair(newDrug, medication);
    if (interaction) {
      interactions.push(interaction);
    }
  }
  interactions.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return interactions;
}

function getSeverityInfo(severity) {
  return drugInteractionData.severityLevels[severity] || null;
}

function getAllSeverityLevels() {
  return drugInteractionData.severityLevels;
}

function getDrugClassInfo(classId) {
  return drugClassMap.get(classId) || null;
}

function getAllDrugClasses() {
  return drugInteractionData.drugClasses;
}

function searchDrugs(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [];
  }
  
  const normalized = normalizeDrugName(searchTerm);
  const results = [];
  
  drugInteractionData.drugClasses.forEach(drugClass => {
    drugClass.drugs.forEach(drug => {
      if (normalizeDrugName(drug).includes(normalized)) {
        results.push({
          name: drug,
          className: drugClass.name,
          classId: drugClass.id
        });
      }
    });
  });
  
  return results;
}

function hasKnownInteractions(drugName) {
  const normalized = normalizeDrugName(drugName);
  const classes = getDrugClasses(drugName);
  
  for (const interaction of drugInteractionData.interactions) {
    if (normalizeDrugName(interaction.drug1 || '') === normalized ||
        normalizeDrugName(interaction.drug2 || '') === normalized) {
      return true;
    }
    if (classes.includes(interaction.drug1Class) || classes.includes(interaction.drug2Class)) {
      return true;
    }
  }
  
  return false;
}

function getInteractionStats() {
  const severityCounts = {};
  
  drugInteractionData.interactions.forEach(interaction => {
    severityCounts[interaction.severity] = (severityCounts[interaction.severity] || 0) + 1;
  });
  
  return {
    totalInteractions: drugInteractionData.interactions.length,
    totalDrugClasses: drugInteractionData.drugClasses.length,
    totalDrugs: Array.from(drugToClassMap.keys()).length,
    bySeverity: severityCounts,
    lastUpdated: drugInteractionData.lastUpdated,
    version: drugInteractionData.version
  };
}

const allergySeverityLevels = {
  severe: {
    level: 1,
    name: 'Severe/Anaphylaxis',
    description: 'Life-threatening allergic reaction risk',
    color: '#DC2626',
    action: 'Do not prescribe. Find alternative medication.'
  },
  moderate: {
    level: 2,
    name: 'Moderate',
    description: 'Significant allergic reaction risk',
    color: '#EA580C',
    action: 'Avoid if possible. Use with extreme caution if no alternatives.'
  },
  mild: {
    level: 3,
    name: 'Mild',
    description: 'Minor allergic reaction risk',
    color: '#CA8A04',
    action: 'Use with caution. Monitor for allergic symptoms.'
  },
  unknown: {
    level: 4,
    name: 'Unknown Severity',
    description: 'Allergy severity not specified',
    color: '#6B7280',
    action: 'Treat as potentially severe. Verify with patient.'
  }
};

function checkDrugAllergyMatch(drugName, allergy) {
  if (!drugName || !allergy || !allergy.allergen) {
    return null;
  }
  
  const normalizedDrug = normalizeDrugName(drugName);
  const normalizedAllergen = normalizeDrugName(allergy.allergen);
  
  if (!normalizedDrug || !normalizedAllergen) {
    return null;
  }
  const drugClasses = getDrugClasses(drugName);
  if (normalizedDrug === normalizedAllergen) {
    return formatAllergyAlert(drugName, allergy, 'direct', 'Exact drug match');
  }
  const allergenAsClass = normalizedAllergen.replace(/s$/, ''); 
  for (const classId of drugClasses) {
    const drugClass = drugClassMap.get(classId);
    if (drugClass) {
      const normalizedClassName = normalizeDrugName(drugClass.name);
      const normalizedClassId = normalizeDrugName(classId);
      if (normalizedClassName === normalizedAllergen || 
          normalizedClassId === normalizedAllergen ||
          normalizedClassName.includes(allergenAsClass) ||
          normalizedClassId.includes(allergenAsClass)) {
        return formatAllergyAlert(drugName, allergy, 'class', `Drug belongs to ${drugClass.name} class`);
      }
    }
  }
  const allergenClasses = getDrugClasses(allergy.allergen);
  for (const drugClassId of drugClasses) {
    if (allergenClasses.includes(drugClassId)) {
      const drugClass = drugClassMap.get(drugClassId);
      return formatAllergyAlert(drugName, allergy, 'cross-reactivity', 
        `Cross-reactivity risk: both drugs in ${drugClass?.name || drugClassId} class`);
    }
  }
  
  return null;
}

function formatAllergyAlert(drugName, allergy, matchType, matchReason) {
  const severity = allergy.severity?.toLowerCase() || 'unknown';
  const severityInfo = allergySeverityLevels[severity] || allergySeverityLevels.unknown;
  
  return {
    type: 'allergy',
    drug: drugName,
    allergen: allergy.allergen,
    patientReaction: allergy.reaction || 'Not specified',
    severity: severity,
    severityLevel: severityInfo.level,
    severityName: severityInfo.name,
    severityColor: severityInfo.color,
    action: severityInfo.action,
    matchType: matchType,
    matchReason: matchReason,
    alert: `ALLERGY ALERT: Patient has documented ${severity} allergy to ${allergy.allergen}. ${matchReason}.`
  };
}

function checkDrugAllergies(drugName, allergies) {
  if (!drugName || !Array.isArray(allergies) || allergies.length === 0) {
    return [];
  }
  
  const alerts = [];
  
  for (const allergy of allergies) {
    const alert = checkDrugAllergyMatch(drugName, allergy);
    if (alert) {
      alerts.push(alert);
    }
  }
  alerts.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return alerts;
}

function checkMultipleDrugAllergies(drugs, allergies) {
  if (!Array.isArray(drugs) || !Array.isArray(allergies)) {
    return [];
  }
  
  const allAlerts = [];
  
  for (const drug of drugs) {
    const alerts = checkDrugAllergies(drug, allergies);
    allAlerts.push(...alerts);
  }
  allAlerts.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return allAlerts;
}

function checkPrescriptionSafety(newDrugs, currentMedications = [], allergies = []) {
  const drugsToCheck = Array.isArray(newDrugs) ? newDrugs : [newDrugs];
  const allDrugs = [...drugsToCheck, ...currentMedications];
  const interactions = checkInteractions(allDrugs);
  const relevantInteractions = interactions.filter(interaction => {
    const normalized1 = normalizeDrugName(interaction.drug1);
    const normalized2 = normalizeDrugName(interaction.drug2);
    return drugsToCheck.some(drug => {
      const normalizedNew = normalizeDrugName(drug);
      return normalizedNew === normalized1 || normalizedNew === normalized2;
    });
  });
  const allergyAlerts = checkMultipleDrugAllergies(drugsToCheck, allergies);
  const hasContraindicated = relevantInteractions.some(i => i.severity === 'contraindicated');
  const hasSevereAllergy = allergyAlerts.some(a => a.severity === 'severe');
  const hasMajorIssue = relevantInteractions.some(i => i.severity === 'major') || 
                        allergyAlerts.some(a => a.severity === 'moderate');
  
  let overallStatus = 'safe';
  if (hasContraindicated || hasSevereAllergy) {
    overallStatus = 'contraindicated';
  } else if (hasMajorIssue) {
    overallStatus = 'caution';
  } else if (relevantInteractions.length > 0 || allergyAlerts.length > 0) {
    overallStatus = 'monitor';
  }
  
  return {
    status: overallStatus,
    interactions: relevantInteractions,
    allergyAlerts: allergyAlerts,
    totalAlerts: relevantInteractions.length + allergyAlerts.length,
    requiresOverride: hasContraindicated || hasSevereAllergy,
    summary: generateSafetySummary(overallStatus, relevantInteractions, allergyAlerts)
  };
}

function generateSafetySummary(status, interactions, allergyAlerts) {
  const parts = [];
  
  if (status === 'safe') {
    return 'No drug interactions or allergy concerns identified.';
  }
  
  if (allergyAlerts.length > 0) {
    const severeCount = allergyAlerts.filter(a => a.severity === 'severe').length;
    if (severeCount > 0) {
      parts.push(`${severeCount} SEVERE ALLERGY ALERT(S)`);
    }
    const otherCount = allergyAlerts.length - severeCount;
    if (otherCount > 0) {
      parts.push(`${otherCount} allergy concern(s)`);
    }
  }
  
  if (interactions.length > 0) {
    const contraCount = interactions.filter(i => i.severity === 'contraindicated').length;
    const majorCount = interactions.filter(i => i.severity === 'major').length;
    
    if (contraCount > 0) {
      parts.push(`${contraCount} CONTRAINDICATED interaction(s)`);
    }
    if (majorCount > 0) {
      parts.push(`${majorCount} major interaction(s)`);
    }
    const otherCount = interactions.length - contraCount - majorCount;
    if (otherCount > 0) {
      parts.push(`${otherCount} other interaction(s)`);
    }
  }
  
  return parts.join(', ') + '.';
}

function getAllergySeverityInfo(severity) {
  return allergySeverityLevels[severity?.toLowerCase()] || allergySeverityLevels.unknown;
}

function getAllAllergySeverityLevels() {
  return allergySeverityLevels;
}

module.exports = {
  checkInteractions,
  checkNewDrugInteractions,
  checkDrugPair,
  getDrugClasses,
  getSeverityInfo,
  getAllSeverityLevels,
  getDrugClassInfo,
  getAllDrugClasses,
  searchDrugs,
  hasKnownInteractions,
  getInteractionStats,
  normalizeDrugName,
  checkDrugAllergies,
  checkMultipleDrugAllergies,
  checkDrugAllergyMatch,
  checkPrescriptionSafety,
  getAllergySeverityInfo,
  getAllAllergySeverityLevels
};
