/**
 * RxNorm API Service
 * Real-time drug interaction checking using NIH's RxNorm and OpenFDA APIs
 * 
 * APIs Used:
 * - RxNorm: https://rxnav.nlm.nih.gov/REST/
 * - OpenFDA Drug Interactions: https://api.fda.gov/drug/
 */

const axios = require('axios');

// API Base URLs
const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';
const RXCLASS_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/rxclass';
const INTERACTION_BASE_URL = 'https://rxnav.nlm.nih.gov/REST/interaction';

// Cache for drug lookups (TTL: 24 hours)
const drugCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Clear expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of drugCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      drugCache.delete(key);
    }
  }
}

// Clean cache every hour
setInterval(cleanCache, 60 * 60 * 1000);

/**
 * Get RxCUI (RxNorm Concept Unique Identifier) for a drug name
 * @param {string} drugName - Drug name to look up
 * @returns {Promise<string|null>} RxCUI or null if not found
 */
async function getRxCUI(drugName) {
  if (!drugName || typeof drugName !== 'string') return null;
  
  const normalizedName = drugName.toLowerCase().trim();
  const cacheKey = `rxcui:${normalizedName}`;
  
  // Check cache
  if (drugCache.has(cacheKey)) {
    const cached = drugCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  try {
    // Try approximate match first for better results
    const response = await axios.get(`${RXNORM_BASE_URL}/approximateTerm.json`, {
      params: { term: drugName, maxEntries: 1 },
      timeout: 10000
    });
    
    let rxcui = null;
    
    if (response.data?.approximateGroup?.candidate?.[0]?.rxcui) {
      rxcui = response.data.approximateGroup.candidate[0].rxcui;
    } else {
      // Fallback to exact match
      const exactResponse = await axios.get(`${RXNORM_BASE_URL}/rxcui.json`, {
        params: { name: drugName },
        timeout: 10000
      });
      
      if (exactResponse.data?.idGroup?.rxnormId?.[0]) {
        rxcui = exactResponse.data.idGroup.rxnormId[0];
      }
    }
    
    // Cache result
    drugCache.set(cacheKey, { data: rxcui, timestamp: Date.now() });
    return rxcui;
  } catch (error) {
    console.error(`Error getting RxCUI for ${drugName}:`, error.message);
    return null;
  }
}

/**
 * Get drug information from RxNorm
 * @param {string} rxcui - RxCUI to look up
 * @returns {Promise<Object|null>} Drug information
 */
async function getDrugInfo(rxcui) {
  if (!rxcui) return null;
  
  const cacheKey = `druginfo:${rxcui}`;
  
  if (drugCache.has(cacheKey)) {
    const cached = drugCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  try {
    const response = await axios.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`, {
      timeout: 10000
    });
    
    const properties = response.data?.properties;
    if (!properties) return null;
    
    const drugInfo = {
      rxcui,
      name: properties.name,
      synonym: properties.synonym,
      tty: properties.tty, // Term type
      language: properties.language
    };
    
    drugCache.set(cacheKey, { data: drugInfo, timestamp: Date.now() });
    return drugInfo;
  } catch (error) {
    console.error(`Error getting drug info for ${rxcui}:`, error.message);
    return null;
  }
}

/**
 * Search for drugs by name (autocomplete)
 * @param {string} searchTerm - Search term
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of drug suggestions
 */
async function searchDrugs(searchTerm, maxResults = 10) {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const response = await axios.get(`${RXNORM_BASE_URL}/spellingsuggestions.json`, {
      params: { name: searchTerm },
      timeout: 8000
    });
    
    const suggestions = response.data?.suggestionGroup?.suggestionList?.suggestion || [];
    
    // Get RxCUIs for top suggestions
    const results = await Promise.all(
      suggestions.slice(0, maxResults).map(async (name) => {
        const rxcui = await getRxCUI(name);
        return { name, rxcui };
      })
    );
    
    return results.filter(r => r.rxcui);
  } catch (error) {
    console.error('Error searching drugs:', error.message);
    return [];
  }
}

/**
 * Get drug class information
 * @param {string} rxcui - RxCUI to look up
 * @returns {Promise<Array>} Array of drug classes
 */
async function getDrugClasses(rxcui) {
  if (!rxcui) return [];
  
  const cacheKey = `classes:${rxcui}`;
  
  if (drugCache.has(cacheKey)) {
    const cached = drugCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  try {
    const response = await axios.get(`${RXCLASS_BASE_URL}/class/byRxcui.json`, {
      params: { rxcui },
      timeout: 10000
    });
    
    const classes = response.data?.rxclassDrugInfoList?.rxclassDrugInfo || [];
    
    const drugClasses = classes.map(c => ({
      classId: c.rxclassMinConceptItem?.classId,
      className: c.rxclassMinConceptItem?.className,
      classType: c.rxclassMinConceptItem?.classType
    })).filter(c => c.classId);
    
    drugCache.set(cacheKey, { data: drugClasses, timestamp: Date.now() });
    return drugClasses;
  } catch (error) {
    console.error(`Error getting drug classes for ${rxcui}:`, error.message);
    return [];
  }
}

/**
 * Check interactions between two drugs using RxNorm Interaction API
 * @param {string} rxcui1 - First drug RxCUI
 * @param {string} rxcui2 - Second drug RxCUI
 * @returns {Promise<Array>} Array of interactions
 */
async function checkPairInteraction(rxcui1, rxcui2) {
  if (!rxcui1 || !rxcui2) return [];
  
  try {
    const response = await axios.get(`${INTERACTION_BASE_URL}/interaction.json`, {
      params: { rxcui: rxcui1 },
      timeout: 15000
    });
    
    const interactionGroups = response.data?.interactionTypeGroup || [];
    const interactions = [];
    
    for (const group of interactionGroups) {
      for (const type of group.interactionType || []) {
        for (const pair of type.interactionPair || []) {
          // Check if this interaction involves the second drug
          const concepts = pair.interactionConcept || [];
          const involvesSecondDrug = concepts.some(c => 
            c.minConceptItem?.rxcui === rxcui2
          );
          
          if (involvesSecondDrug) {
            interactions.push({
              source: group.sourceName,
              severity: mapSeverity(pair.severity),
              description: pair.description,
              drug1: concepts[0]?.minConceptItem?.name,
              drug2: concepts[1]?.minConceptItem?.name,
              rxcui1: concepts[0]?.minConceptItem?.rxcui,
              rxcui2: concepts[1]?.minConceptItem?.rxcui
            });
          }
        }
      }
    }
    
    return interactions;
  } catch (error) {
    console.error('Error checking pair interaction:', error.message);
    return [];
  }
}

/**
 * Check interactions for a list of drugs
 * @param {Array<string>} drugNames - Array of drug names
 * @returns {Promise<Object>} Interaction check results
 */
async function checkInteractions(drugNames) {
  if (!Array.isArray(drugNames) || drugNames.length < 2) {
    return { interactions: [], drugs: [] };
  }
  
  try {
    // Get RxCUIs for all drugs
    const drugsWithRxcui = await Promise.all(
      drugNames.map(async (name) => {
        const rxcui = await getRxCUI(name);
        return { name, rxcui };
      })
    );
    
    const validDrugs = drugsWithRxcui.filter(d => d.rxcui);
    
    if (validDrugs.length < 2) {
      return {
        interactions: [],
        drugs: drugsWithRxcui,
        warning: 'Could not find RxCUI for some drugs'
      };
    }
    
    // Use RxNorm interaction list API for multiple drugs
    const rxcuiList = validDrugs.map(d => d.rxcui).join('+');
    
    const response = await axios.get(`${INTERACTION_BASE_URL}/list.json`, {
      params: { rxcuis: rxcuiList },
      timeout: 20000
    });
    
    const interactionGroups = response.data?.fullInteractionTypeGroup || [];
    const interactions = [];
    
    for (const group of interactionGroups) {
      for (const type of group.fullInteractionType || []) {
        for (const pair of type.interactionPair || []) {
          const concepts = pair.interactionConcept || [];
          
          interactions.push({
            id: `${concepts[0]?.minConceptItem?.rxcui}-${concepts[1]?.minConceptItem?.rxcui}`,
            source: group.sourceName,
            severity: mapSeverity(pair.severity),
            severityLevel: getSeverityLevel(pair.severity),
            description: pair.description,
            drug1: concepts[0]?.minConceptItem?.name || 'Unknown',
            drug2: concepts[1]?.minConceptItem?.name || 'Unknown',
            rxcui1: concepts[0]?.minConceptItem?.rxcui,
            rxcui2: concepts[1]?.minConceptItem?.rxcui
          });
        }
      }
    }
    
    // Sort by severity
    interactions.sort((a, b) => a.severityLevel - b.severityLevel);
    
    return {
      interactions,
      drugs: drugsWithRxcui,
      totalFound: interactions.length,
      hasContraindicated: interactions.some(i => i.severity === 'contraindicated'),
      hasMajor: interactions.some(i => i.severity === 'major' || i.severity === 'severe')
    };
  } catch (error) {
    console.error('Error checking interactions:', error.message);
    throw new Error('Failed to check drug interactions via RxNorm API');
  }
}

/**
 * Check interactions for a new drug against existing medications
 * @param {string} newDrug - New drug name
 * @param {Array<string>} currentMedications - Current medication names
 * @returns {Promise<Object>} Interaction results
 */
async function checkNewDrugInteractions(newDrug, currentMedications) {
  if (!newDrug || !Array.isArray(currentMedications) || currentMedications.length === 0) {
    return { interactions: [], newDrugRxcui: null };
  }
  
  const allDrugs = [newDrug, ...currentMedications];
  const result = await checkInteractions(allDrugs);
  
  // Filter to only interactions involving the new drug
  const newDrugRxcui = result.drugs.find(d => 
    d.name.toLowerCase() === newDrug.toLowerCase()
  )?.rxcui;
  
  const relevantInteractions = result.interactions.filter(i =>
    i.rxcui1 === newDrugRxcui || i.rxcui2 === newDrugRxcui
  );
  
  return {
    ...result,
    interactions: relevantInteractions,
    newDrugRxcui,
    totalFound: relevantInteractions.length
  };
}

/**
 * Map RxNorm severity to standard severity levels
 */
function mapSeverity(rxnormSeverity) {
  if (!rxnormSeverity) return 'unknown';
  
  const severity = rxnormSeverity.toLowerCase();
  
  if (severity.includes('contraindicated') || severity.includes('avoid')) {
    return 'contraindicated';
  }
  if (severity.includes('high') || severity.includes('severe') || severity.includes('serious')) {
    return 'major';
  }
  if (severity.includes('moderate') || severity.includes('significant')) {
    return 'moderate';
  }
  if (severity.includes('minor') || severity.includes('low')) {
    return 'minor';
  }
  
  return 'unknown';
}

/**
 * Get numeric severity level for sorting
 */
function getSeverityLevel(severity) {
  const mapped = mapSeverity(severity);
  const levels = {
    contraindicated: 1,
    major: 2,
    moderate: 3,
    minor: 4,
    unknown: 5
  };
  return levels[mapped] || 5;
}

/**
 * Get NDC (National Drug Code) for a drug
 * @param {string} rxcui - RxCUI
 * @returns {Promise<Array>} Array of NDC codes
 */
async function getNDCCodes(rxcui) {
  if (!rxcui) return [];
  
  try {
    const response = await axios.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/ndcs.json`, {
      timeout: 10000
    });
    
    return response.data?.ndcGroup?.ndcList?.ndc || [];
  } catch (error) {
    console.error(`Error getting NDC codes for ${rxcui}:`, error.message);
    return [];
  }
}

/**
 * Get related drugs (brand names, generics, etc.)
 * @param {string} rxcui - RxCUI
 * @returns {Promise<Object>} Related drugs
 */
async function getRelatedDrugs(rxcui) {
  if (!rxcui) return {};
  
  try {
    const response = await axios.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json`, {
      params: { tty: 'BN+IN+MIN+PIN+SBD+SCD' },
      timeout: 10000
    });
    
    const groups = response.data?.relatedGroup?.conceptGroup || [];
    const related = {};
    
    for (const group of groups) {
      const concepts = group.conceptProperties || [];
      related[group.tty] = concepts.map(c => ({
        rxcui: c.rxcui,
        name: c.name,
        synonym: c.synonym
      }));
    }
    
    return related;
  } catch (error) {
    console.error(`Error getting related drugs for ${rxcui}:`, error.message);
    return {};
  }
}

/**
 * Validate drug name exists in RxNorm
 * @param {string} drugName - Drug name to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateDrug(drugName) {
  const rxcui = await getRxCUI(drugName);
  
  if (!rxcui) {
    return {
      valid: false,
      drugName,
      message: 'Drug not found in RxNorm database'
    };
  }
  
  const drugInfo = await getDrugInfo(rxcui);
  
  return {
    valid: true,
    drugName,
    rxcui,
    standardName: drugInfo?.name,
    termType: drugInfo?.tty
  };
}

/**
 * Get comprehensive drug interaction report
 * @param {Array<string>} drugs - Array of drug names
 * @param {Array<Object>} allergies - Patient allergies
 * @returns {Promise<Object>} Comprehensive report
 */
async function getComprehensiveReport(drugs, allergies = []) {
  const result = await checkInteractions(drugs);
  
  // Get drug classes for each drug
  const drugDetails = await Promise.all(
    result.drugs.filter(d => d.rxcui).map(async (drug) => {
      const classes = await getDrugClasses(drug.rxcui);
      const info = await getDrugInfo(drug.rxcui);
      return {
        ...drug,
        info,
        classes
      };
    })
  );
  
  // Check for allergy cross-reactivity based on drug classes
  const allergyAlerts = [];
  
  for (const drug of drugDetails) {
    for (const allergy of allergies) {
      const allergenNormalized = allergy.allergen?.toLowerCase() || '';
      
      // Check direct name match
      if (drug.name.toLowerCase().includes(allergenNormalized) ||
          allergenNormalized.includes(drug.name.toLowerCase())) {
        allergyAlerts.push({
          type: 'direct',
          drug: drug.name,
          allergen: allergy.allergen,
          severity: allergy.severity || 'unknown',
          reaction: allergy.reaction
        });
        continue;
      }
      
      // Check class match
      for (const drugClass of drug.classes) {
        if (drugClass.className?.toLowerCase().includes(allergenNormalized)) {
          allergyAlerts.push({
            type: 'class',
            drug: drug.name,
            allergen: allergy.allergen,
            drugClass: drugClass.className,
            severity: allergy.severity || 'unknown',
            reaction: allergy.reaction
          });
        }
      }
    }
  }
  
  return {
    ...result,
    drugDetails,
    allergyAlerts,
    summary: generateSummary(result.interactions, allergyAlerts)
  };
}

/**
 * Generate summary text
 */
function generateSummary(interactions, allergyAlerts) {
  const parts = [];
  
  if (interactions.length === 0 && allergyAlerts.length === 0) {
    return 'No drug interactions or allergy concerns identified.';
  }
  
  if (interactions.length > 0) {
    const contraindicated = interactions.filter(i => i.severity === 'contraindicated').length;
    const major = interactions.filter(i => i.severity === 'major').length;
    
    if (contraindicated > 0) {
      parts.push(`${contraindicated} CONTRAINDICATED interaction(s)`);
    }
    if (major > 0) {
      parts.push(`${major} major interaction(s)`);
    }
    const other = interactions.length - contraindicated - major;
    if (other > 0) {
      parts.push(`${other} other interaction(s)`);
    }
  }
  
  if (allergyAlerts.length > 0) {
    parts.push(`${allergyAlerts.length} allergy alert(s)`);
  }
  
  return parts.join(', ') + '.';
}

module.exports = {
  getRxCUI,
  getDrugInfo,
  searchDrugs,
  getDrugClasses,
  checkInteractions,
  checkNewDrugInteractions,
  checkPairInteraction,
  getNDCCodes,
  getRelatedDrugs,
  validateDrug,
  getComprehensiveReport,
  mapSeverity,
  getSeverityLevel
};
