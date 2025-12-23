/**
 * Drug Interaction Service
 * Checks for drug-drug interactions, allergy cross-checking, and provides severity information
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7
 */

const drugInteractionData = require('../data/drugInteractions.json');

// Build lookup maps for efficient searching
const drugClassMap = new Map();
const drugToClassMap = new Map();

// Initialize lookup maps
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

// Initialize on module load
initializeMaps();

/**
 * Normalize drug name for comparison
 * @param {string} drugName - Drug name to normalize
 * @returns {string} Normalized drug name
 */
function normalizeDrugName(drugName) {
  if (!drugName || typeof drugName !== 'string') return '';
  return drugName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Get drug classes for a given drug
 * @param {string} drugName - Drug name
 * @returns {Array} Array of drug class IDs
 */
function getDrugClasses(drugName) {
  const normalized = normalizeDrugName(drugName);
  return drugToClassMap.get(normalized) || [];
}

/**
 * Check if two drugs interact
 * @param {string} drug1 - First drug name
 * @param {string} drug2 - Second drug name
 * @returns {Object|null} Interaction details or null if no interaction
 */
function checkDrugPair(drug1, drug2) {
  const normalized1 = normalizeDrugName(drug1);
  const normalized2 = normalizeDrugName(drug2);
  
  if (!normalized1 || !normalized2 || normalized1 === normalized2) {
    return null;
  }
  
  const classes1 = getDrugClasses(drug1);
  const classes2 = getDrugClasses(drug2);
  
  // Check all interactions
  for (const interaction of drugInteractionData.interactions) {
    // Check direct drug-to-drug match
    const directMatch = checkDirectMatch(interaction, normalized1, normalized2);
    if (directMatch) {
      return formatInteraction(interaction, drug1, drug2, 'direct');
    }
    
    // Check drug-to-class match
    const drugClassMatch = checkDrugClassMatch(interaction, normalized1, normalized2, classes1, classes2);
    if (drugClassMatch) {
      return formatInteraction(interaction, drug1, drug2, 'drug-class');
    }
    
    // Check class-to-class match
    const classMatch = checkClassMatch(interaction, classes1, classes2);
    if (classMatch) {
      return formatInteraction(interaction, drug1, drug2, 'class-class');
    }
  }
  
  return null;
}

/**
 * Check for direct drug-to-drug match
 */
function checkDirectMatch(interaction, normalized1, normalized2) {
  const interactionDrug1 = normalizeDrugName(interaction.drug1 || '');
  const interactionDrug2 = normalizeDrugName(interaction.drug2 || '');
  
  if (!interactionDrug1 || !interactionDrug2) return false;
  
  return (
    (interactionDrug1 === normalized1 && interactionDrug2 === normalized2) ||
    (interactionDrug1 === normalized2 && interactionDrug2 === normalized1)
  );
}

/**
 * Check for drug-to-class match
 */
function checkDrugClassMatch(interaction, normalized1, normalized2, classes1, classes2) {
  const interactionDrug1 = normalizeDrugName(interaction.drug1 || '');
  const interactionDrug2 = normalizeDrugName(interaction.drug2 || '');
  const interactionClass1 = interaction.drug1Class;
  const interactionClass2 = interaction.drug2Class;
  
  // Drug1 matches specific drug, Drug2 matches class
  if (interactionDrug1 && interactionClass2 && !interactionDrug2) {
    if (interactionDrug1 === normalized1 && classes2.includes(interactionClass2)) return true;
    if (interactionDrug1 === normalized2 && classes1.includes(interactionClass2)) return true;
  }
  
  // Drug2 matches specific drug, Drug1 matches class
  if (interactionDrug2 && interactionClass1 && !interactionDrug1) {
    if (interactionDrug2 === normalized1 && classes2.includes(interactionClass1)) return true;
    if (interactionDrug2 === normalized2 && classes1.includes(interactionClass1)) return true;
  }
  
  // One specific drug, one class
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

/**
 * Check for class-to-class match
 */
function checkClassMatch(interaction, classes1, classes2) {
  const interactionClass1 = interaction.drug1Class;
  const interactionClass2 = interaction.drug2Class;
  
  if (!interactionClass1 || !interactionClass2) return false;
  if (interaction.drug1 || interaction.drug2) return false; // Has specific drugs, not pure class match
  
  return (
    (classes1.includes(interactionClass1) && classes2.includes(interactionClass2)) ||
    (classes1.includes(interactionClass2) && classes2.includes(interactionClass1))
  );
}

/**
 * Format interaction result
 */
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

/**
 * Check interactions for a list of drugs
 * @param {Array} drugs - Array of drug names
 * @returns {Array} Array of interactions found
 */
function checkInteractions(drugs) {
  if (!Array.isArray(drugs) || drugs.length < 2) {
    return [];
  }
  
  const interactions = [];
  const checkedPairs = new Set();
  
  // Check all pairs
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const drug1 = drugs[i];
      const drug2 = drugs[j];
      
      // Create a consistent key for the pair
      const pairKey = [normalizeDrugName(drug1), normalizeDrugName(drug2)].sort().join('|');
      
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);
      
      const interaction = checkDrugPair(drug1, drug2);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  
  // Sort by severity (most severe first)
  interactions.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return interactions;
}

/**
 * Check interactions between new drug and existing medications
 * @param {string} newDrug - New drug being prescribed
 * @param {Array} currentMedications - Array of current medication names
 * @returns {Array} Array of interactions found
 */
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
  
  // Sort by severity
  interactions.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return interactions;
}

/**
 * Get severity information
 * @param {string} severity - Severity level
 * @returns {Object} Severity details
 */
function getSeverityInfo(severity) {
  return drugInteractionData.severityLevels[severity] || null;
}

/**
 * Get all severity levels
 * @returns {Object} All severity levels
 */
function getAllSeverityLevels() {
  return drugInteractionData.severityLevels;
}

/**
 * Get drug class information
 * @param {string} classId - Drug class ID
 * @returns {Object|null} Drug class details
 */
function getDrugClassInfo(classId) {
  return drugClassMap.get(classId) || null;
}

/**
 * Get all drug classes
 * @returns {Array} All drug classes
 */
function getAllDrugClasses() {
  return drugInteractionData.drugClasses;
}

/**
 * Search for drugs by name
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching drugs with their classes
 */
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

/**
 * Check if a drug has any known interactions
 * @param {string} drugName - Drug name
 * @returns {boolean} True if drug has known interactions
 */
function hasKnownInteractions(drugName) {
  const normalized = normalizeDrugName(drugName);
  const classes = getDrugClasses(drugName);
  
  for (const interaction of drugInteractionData.interactions) {
    // Check direct drug match
    if (normalizeDrugName(interaction.drug1 || '') === normalized ||
        normalizeDrugName(interaction.drug2 || '') === normalized) {
      return true;
    }
    
    // Check class match
    if (classes.includes(interaction.drug1Class) || classes.includes(interaction.drug2Class)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get interaction statistics
 * @returns {Object} Statistics about the interaction database
 */
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

// ============================================
// Allergy Cross-Checking Functions
// Requirements: 5.6, 5.7
// ============================================

/**
 * Allergy severity levels for cross-checking
 */
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

/**
 * Check if a drug matches an allergy (by name or class)
 * @param {string} drugName - Drug being prescribed
 * @param {Object} allergy - Allergy object with allergen and optional severity
 * @returns {Object|null} Allergy alert or null if no match
 */
function checkDrugAllergyMatch(drugName, allergy) {
  if (!drugName || !allergy || !allergy.allergen) {
    return null;
  }
  
  const normalizedDrug = normalizeDrugName(drugName);
  const normalizedAllergen = normalizeDrugName(allergy.allergen);
  
  if (!normalizedDrug || !normalizedAllergen) {
    return null;
  }
  
  // Get drug classes for the prescribed drug
  const drugClasses = getDrugClasses(drugName);
  
  // Check for direct drug name match
  if (normalizedDrug === normalizedAllergen) {
    return formatAllergyAlert(drugName, allergy, 'direct', 'Exact drug match');
  }
  
  // Check if allergen is a drug class
  const allergenAsClass = normalizedAllergen.replace(/s$/, ''); // Remove trailing 's' for class matching
  for (const classId of drugClasses) {
    const drugClass = drugClassMap.get(classId);
    if (drugClass) {
      const normalizedClassName = normalizeDrugName(drugClass.name);
      const normalizedClassId = normalizeDrugName(classId);
      
      // Match class name or ID
      if (normalizedClassName === normalizedAllergen || 
          normalizedClassId === normalizedAllergen ||
          normalizedClassName.includes(allergenAsClass) ||
          normalizedClassId.includes(allergenAsClass)) {
        return formatAllergyAlert(drugName, allergy, 'class', `Drug belongs to ${drugClass.name} class`);
      }
    }
  }
  
  // Check if allergen is a drug in the same class as the prescribed drug
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

/**
 * Format allergy alert result
 */
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

/**
 * Check a single drug against patient allergies
 * @param {string} drugName - Drug being prescribed
 * @param {Array} allergies - Array of patient allergy objects [{allergen, severity, reaction}]
 * @returns {Array} Array of allergy alerts
 */
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
  
  // Sort by severity (most severe first)
  alerts.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return alerts;
}

/**
 * Check multiple drugs against patient allergies
 * @param {Array} drugs - Array of drug names being prescribed
 * @param {Array} allergies - Array of patient allergy objects
 * @returns {Array} Array of allergy alerts for all drugs
 */
function checkMultipleDrugAllergies(drugs, allergies) {
  if (!Array.isArray(drugs) || !Array.isArray(allergies)) {
    return [];
  }
  
  const allAlerts = [];
  
  for (const drug of drugs) {
    const alerts = checkDrugAllergies(drug, allergies);
    allAlerts.push(...alerts);
  }
  
  // Sort by severity
  allAlerts.sort((a, b) => a.severityLevel - b.severityLevel);
  
  return allAlerts;
}

/**
 * Comprehensive prescription safety check
 * Checks both drug interactions and allergies
 * @param {string|Array} newDrugs - New drug(s) being prescribed
 * @param {Array} currentMedications - Current medications
 * @param {Array} allergies - Patient allergies
 * @returns {Object} Combined safety check results
 */
function checkPrescriptionSafety(newDrugs, currentMedications = [], allergies = []) {
  const drugsToCheck = Array.isArray(newDrugs) ? newDrugs : [newDrugs];
  
  // Check drug-drug interactions
  const allDrugs = [...drugsToCheck, ...currentMedications];
  const interactions = checkInteractions(allDrugs);
  
  // Filter to only interactions involving new drugs
  const relevantInteractions = interactions.filter(interaction => {
    const normalized1 = normalizeDrugName(interaction.drug1);
    const normalized2 = normalizeDrugName(interaction.drug2);
    return drugsToCheck.some(drug => {
      const normalizedNew = normalizeDrugName(drug);
      return normalizedNew === normalized1 || normalizedNew === normalized2;
    });
  });
  
  // Check allergies
  const allergyAlerts = checkMultipleDrugAllergies(drugsToCheck, allergies);
  
  // Determine overall safety status
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

/**
 * Generate a human-readable safety summary
 */
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

/**
 * Get allergy severity information
 * @param {string} severity - Severity level
 * @returns {Object} Severity details
 */
function getAllergySeverityInfo(severity) {
  return allergySeverityLevels[severity?.toLowerCase()] || allergySeverityLevels.unknown;
}

/**
 * Get all allergy severity levels
 * @returns {Object} All allergy severity levels
 */
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
  // Allergy cross-checking exports
  checkDrugAllergies,
  checkMultipleDrugAllergies,
  checkDrugAllergyMatch,
  checkPrescriptionSafety,
  getAllergySeverityInfo,
  getAllAllergySeverityLevels
};
