

const MedicalHistory = require('../models/MedicalHistory');
const mongoose = require('mongoose');

async function createOrUpdateHistory(patientId, historyData, clinicId, updatedBy) {
  try {
    let history = await MedicalHistory.findOne({ patientId }); 
    
    if (history) {
      Object.assign(history, historyData);
      history.lastUpdated = new Date();
      history.updatedBy = updatedBy;
    } else {
      history = new MedicalHistory({
        patientId,
        clinicId,
        ...historyData,
        createdBy: updatedBy,
        updatedBy: updatedBy
      });
    }
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to create/update medical history: ${error.message}`);
  }
}

async function getHistory(patientId, clinicId = null) {
  try {
    const query = { patientId };
   if (clinicId) {
      query.clinicId = clinicId;
    }
    
    const history = await MedicalHistory.findOne(query)
      .populate('updatedBy', 'name')
      .populate('createdBy', 'name');
    
    return history;
  } catch (error) {
    throw new Error(`Failed to get medical history: ${error.message}`);
  }
}

async function getOrCreateHistory(patientId, clinicId) {
  try {
   return await MedicalHistory.getOrCreate(patientId, clinicId);
  } catch (error) {
    throw new Error(`Failed to get or create medical history: ${error.message}`);
  }
}

async function updateAllergies(patientId, allergies, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!Array.isArray(allergies)) {
      throw new Error('Allergies must be an array');
    }
    allergies.forEach((allergy, index) => {
      if (!allergy.allergen || !allergy.type || !allergy.severity) {
        throw new Error(`Allergy at index ${index} is missing required fields`);
      }
      
      const validTypes = ['drug', 'food', 'environmental', 'other'];
      const validSeverities = ['mild', 'moderate', 'severe', 'life-threatening'];
      
      if (!validTypes.includes(allergy.type)) {
        throw new Error(`Invalid allergy type: ${allergy.type}`);
      }
      
      if (!validSeverities.includes(allergy.severity)) {
        throw new Error(`Invalid allergy severity: ${allergy.severity}`);
      }
    });
    
    history.allergies = allergies;
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to update allergies: ${error.message}`);
  }
}

async function addAllergy(patientId, allergyData, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!allergyData.allergen || !allergyData.type || !allergyData.severity) {
     throw new Error('Allergy must have allergen, type, and severity');
    }
    
    history.allergies.push(allergyData);
   history.lastUpdated = new Date();
   history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to add allergy: ${error.message}`);
  }
}

async function removeAllergy(patientId, allergyId, updatedBy) {
  try {
    const history = await MedicalHistory.findOne({ patientId });
    if (!history) {
      throw new Error('Medical history not found');
    }
    
   history.allergies.id(allergyId).remove();
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
   return history;
  } catch (error) {
    throw new Error(`Failed to remove allergy: ${error.message}`);
  }
}

async function updateConditions(patientId, conditions, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!Array.isArray(conditions)) {
      throw new Error('Conditions must be an array');
   }
   conditions.forEach((condition, index) => {
      if (!condition.condition) {
        throw new Error(`Condition at index ${index} is missing required condition field`);
      }
      
      const validStatuses = ['active', 'controlled', 'resolved'];
      if (condition.status && !validStatuses.includes(condition.status)) {
        throw new Error(`Invalid condition status: ${condition.status}`);
      }
    });
    
    history.chronicConditions = conditions;
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
   throw new Error(`Failed to update conditions: ${error.message}`);
  }
}

async function addCondition(patientId, conditionData, updatedBy) {
  try {
   const history = await MedicalHistory.getOrCreate(patientId);
    if (!conditionData.condition) {
      throw new Error('Condition must have a condition field');
    }
    
    history.chronicConditions.push(conditionData);
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
   await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to add condition: ${error.message}`);
  }
}

async function updateFamilyHistory(patientId, familyHistory, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!Array.isArray(familyHistory)) {
      throw new Error('Family history must be an array');
    }
    familyHistory.forEach((entry, index) => {
     if (!entry.relationship || !entry.condition) {
        throw new Error(`Family history entry at index ${index} is missing required fields`);
      }
      
      const validRelationships = ['father', 'mother', 'sibling', 'child', 'grandparent', 'other'];
      if (!validRelationships.includes(entry.relationship)) {
        throw new Error(`Invalid relationship: ${entry.relationship}`);
      }
    });
    
    history.familyHistory = familyHistory;
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to update family history: ${error.message}`);
  }
}

async function updateSurgicalHistory(patientId, surgicalHistory, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!Array.isArray(surgicalHistory)) {
      throw new Error('Surgical history must be an array');
    }
    surgicalHistory.forEach((entry, index) => {
      if (!entry.procedure || !entry.date) {
        throw new Error(`Surgical history entry at index ${index} is missing required fields`);
      }
      if (!(entry.date instanceof Date) && !Date.parse(entry.date)) {
        throw new Error(`Invalid date in surgical history entry at index ${index}`);
      }
    });
    
    history.surgicalHistory = surgicalHistory;
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to update surgical history: ${error.message}`);
  }
}

async function updateMedications(patientId, medications, updatedBy) {
  try {
   const history = await MedicalHistory.getOrCreate(patientId);
    if (!Array.isArray(medications)) {
      throw new Error('Medications must be an array');
    }
    medications.forEach((medication, index) => {
      if (!medication.drugName || !medication.dosage) {
        throw new Error(`Medication at index ${index} is missing required fields`);
      }
      
      const validRoutes = ['oral', 'injection', 'topical', 'inhaled', 'sublingual', 'rectal', 'other'];
      if (medication.route && !validRoutes.includes(medication.route)) {
        throw new Error(`Invalid medication route: ${medication.route}`);
      }
    });
    
    history.currentMedications = medications;
    history.lastUpdated = new Date();
   history.updatedBy = updatedBy;
    
    await history.save();
   return history;
  } catch (error) {
    throw new Error(`Failed to update medications: ${error.message}`);
  }
}

async function addMedication(patientId, medicationData, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId);
    if (!medicationData.drugName || !medicationData.dosage) {
      throw new Error('Medication must have drugName and dosage');
    }
    
    history.currentMedications.push(medicationData);
    history.lastUpdated = new Date();
   history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to add medication: ${error.message}`);
  }
}

async function updateSocialHistory(patientId, socialHistory, updatedBy) {
  try {
    const history = await MedicalHistory.getOrCreate(patientId); 
    if (socialHistory.smoking) {
      const validSmokingValues = ['never', 'former', 'current'];
      if (!validSmokingValues.includes(socialHistory.smoking)) {
        throw new Error(`Invalid smoking value: ${socialHistory.smoking}`);
      }
   }
    
    if (socialHistory.alcohol) {
      const validAlcoholValues = ['never', 'occasional', 'regular', 'heavy'];
      if (!validAlcoholValues.includes(socialHistory.alcohol)) {
        throw new Error(`Invalid alcohol value: ${socialHistory.alcohol}`);
      }
    }
    
    history.socialHistory = { ...history.socialHistory, ...socialHistory };
    history.lastUpdated = new Date();
    history.updatedBy = updatedBy;
    
    await history.save();
    return history;
  } catch (error) {
    throw new Error(`Failed to update social history: ${error.message}`);
  }
}

async function getCriticalSummary(patientId) {
  try {
    const history = await MedicalHistory.findOne({ patientId });
    if (!history) {
      return {
        allergies: [],
        activeConditions: [],
        activeMedications: []
      };
    }
    
    return history.getCriticalSummary();
  } catch (error) {
    throw new Error(`Failed to get critical summary: ${error.message}`);
  }
}

async function searchPatientsByAllergy(allergen, clinicId = null) {
  try {
    const query = {
      'allergies.allergen': { $regex: allergen, $options: 'i' },
     'allergies.isActive': true
    };
    
   if (clinicId) {
      query.clinicId = clinicId;
    }
    
   const histories = await MedicalHistory.find(query)
      .populate('patientId', 'name phone')
      .select('patientId allergies'); 
    
   return histories.map(history => ({
      patient: history.patientId,
      matchingAllergies: history.allergies.filter(a => 
        a.isActive && a.allergen.toLowerCase().includes(allergen.toLowerCase())
      )
   })); 
  } catch (error) {
    throw new Error(`Failed to search patients by allergy: ${error.message}`);
  }
}

async function searchPatientsByCondition(condition, clinicId = null) {
  try {
    const query = {
      'chronicConditions.condition': { $regex: condition, $options: 'i' },
      'chronicConditions.status': 'active'
    };
    
    if (clinicId) {
      query.clinicId = clinicId;
    }
    
    const histories = await MedicalHistory.find(query)
     .populate('patientId', 'name phone')
      .select('patientId chronicConditions');
    
    return histories.map(history => ({
      patient: history.patientId,
      matchingConditions: history.chronicConditions.filter(c => 
       c.status === 'active' && c.condition.toLowerCase().includes(condition.toLowerCase())
      )
   }));
  } catch (error) {
    throw new Error(`Failed to search patients by condition: ${error.message}`);
  }
}

async function searchPatientsByMedication(drugName, clinicId = null) {
  try {
    const query = {
      'currentMedications.drugName': { $regex: drugName, $options: 'i' },
      'currentMedications.isActive': true
   };
    
    if (clinicId) {
      query.clinicId = clinicId;
   }
    
    const histories = await MedicalHistory.find(query)
      .populate('patientId', 'name phone')
      .select('patientId currentMedications');
    
    return histories.map(history => ({
      patient: history.patientId,
      matchingMedications: history.currentMedications.filter(m => 
        m.isActive && m.drugName.toLowerCase().includes(drugName.toLowerCase())
      )
   }));
  } catch (error) {
    throw new Error(`Failed to search patients by medication: ${error.message}`);
  }
} 

function validateMedicalHistoryData(historyData) {
  const errors = [];
  if (historyData.allergies && Array.isArray(historyData.allergies)) {
    historyData.allergies.forEach((allergy, index) => {
      if (!allergy.allergen) errors.push(`Allergy ${index + 1}: allergen is required`);
      if (!allergy.type) errors.push(`Allergy ${index + 1}: type is required`);
      if (!allergy.severity) errors.push(`Allergy ${index + 1}: severity is required`);
    });
  }
  if (historyData.chronicConditions && Array.isArray(historyData.chronicConditions)) {
   historyData.chronicConditions.forEach((condition, index) => {
      if (!condition.condition) errors.push(`Condition ${index + 1}: condition is required`);
    });
  }
  if (historyData.familyHistory && Array.isArray(historyData.familyHistory)) {
    historyData.familyHistory.forEach((entry, index) => {
      if (!entry.relationship) errors.push(`Family history ${index + 1}: relationship is required`);
      if (!entry.condition) errors.push(`Family history ${index + 1}: condition is required`);
    });
  }
  if (historyData.surgicalHistory && Array.isArray(historyData.surgicalHistory)) {
    historyData.surgicalHistory.forEach((entry, index) => {
      if (!entry.procedure) errors.push(`Surgical history ${index + 1}: procedure is required`);
     if (!entry.date) errors.push(`Surgical history ${index + 1}: date is required`);
    });
  }
  if (historyData.currentMedications && Array.isArray(historyData.currentMedications)) {
    historyData.currentMedications.forEach((medication, index) => {
      if (!medication.drugName) errors.push(`Medication ${index + 1}: drugName is required`);
      if (!medication.dosage) errors.push(`Medication ${index + 1}: dosage is required`);
   });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  createOrUpdateHistory,
  getHistory,
  // @deprecated - use new API
  getOrCreateHistory,
  updateAllergies,
  addAllergy,
  removeAllergy,
  updateConditions,
  addCondition,
  updateFamilyHistory,
  updateSurgicalHistory,
  updateMedications,
  addMedication,
  updateSocialHistory,
  getCriticalSummary,
  searchPatientsByAllergy,
  searchPatientsByCondition,
  searchPatientsByMedication,
  validateMedicalHistoryData
};