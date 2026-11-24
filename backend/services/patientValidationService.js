

const User = require('../models/User');

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizePatientId(id) {
  if (!id) return '';
  return id.toString()
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .trim();
}

function calculateSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function datesMatch(date1, date2) {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function validatePatientMatch(dicomPatient, emrPatient) {
  const result = {
    isMatch: false,
    confidence: 0,
    matchDetails: {
      patientId: { match: false, dicom: null, emr: null },
      name: { match: false, similarity: 0, dicom: null, emr: null },
      birthDate: { match: false, dicom: null, emr: null },
      sex: { match: false, dicom: null, emr: null }
    },
    warnings: [],
    requiresConfirmation: false
  };
  
  if (!dicomPatient || !emrPatient) {
    result.warnings.push('Missing patient information');
    return result;
  }
  const dicomId = normalizePatientId(dicomPatient.patientId);
  const emrId = normalizePatientId(emrPatient._id?.toString() || emrPatient.patientId);
  
  result.matchDetails.patientId.dicom = dicomPatient.patientId;
  result.matchDetails.patientId.emr = emrPatient._id?.toString() || emrPatient.patientId;
  const emrPatientIds = [
    emrId,
    normalizePatientId(emrPatient.patientNumber),
    normalizePatientId(emrPatient.medicalRecordNumber)
  ].filter(Boolean);
  
  result.matchDetails.patientId.match = emrPatientIds.some(id => id === dicomId);
  const dicomName = dicomPatient.patientName;
  const emrName = emrPatient.name || `${emrPatient.firstName || ''} ${emrPatient.lastName || ''}`.trim();
  
  result.matchDetails.name.dicom = dicomName;
  result.matchDetails.name.emr = emrName;
  result.matchDetails.name.similarity = calculateSimilarity(dicomName, emrName);
  result.matchDetails.name.match = result.matchDetails.name.similarity >= 0.8;
  result.matchDetails.birthDate.dicom = dicomPatient.birthDate;
  result.matchDetails.birthDate.emr = emrPatient.dateOfBirth || emrPatient.birthDate;
  result.matchDetails.birthDate.match = datesMatch(
    dicomPatient.birthDate,
    emrPatient.dateOfBirth || emrPatient.birthDate
  );
  const dicomSex = normalizeString(dicomPatient.sex);
  const emrSex = normalizeString(emrPatient.gender || emrPatient.sex);
  
  result.matchDetails.sex.dicom = dicomPatient.sex;
  result.matchDetails.sex.emr = emrPatient.gender || emrPatient.sex;
  result.matchDetails.sex.match = dicomSex === emrSex || 
    (dicomSex === 'm' && emrSex === 'male') ||
    (dicomSex === 'f' && emrSex === 'female');
  let matchScore = 0;
  let totalWeight = 0;
  if (result.matchDetails.patientId.match) {
    matchScore += 40;
  }
  totalWeight += 40;
  matchScore += result.matchDetails.name.similarity * 30;
  totalWeight += 30;
  if (result.matchDetails.birthDate.match) {
    matchScore += 20;
  }
  totalWeight += 20;
  if (result.matchDetails.sex.match) {
    matchScore += 10;
  }
  totalWeight += 10;
  
  result.confidence = matchScore / totalWeight;
  if (result.confidence >= 0.9) {
    result.isMatch = true;
  } else if (result.confidence >= 0.6) {
    result.isMatch = false;
    result.requiresConfirmation = true;
    result.warnings.push('Partial match detected - please verify patient identity');
  } else {
    result.isMatch = false;
    result.requiresConfirmation = true;
    result.warnings.push('Patient information does not match - confirmation required');
  }
  if (!result.matchDetails.patientId.match && dicomPatient.patientId) {
    result.warnings.push(`DICOM Patient ID "${dicomPatient.patientId}" does not match EMR record`);
  }
  
  if (result.matchDetails.name.similarity < 0.5 && dicomName && emrName) {
    result.warnings.push(`Patient name mismatch: DICOM "${dicomName}" vs EMR "${emrName}"`);
  }
  
  if (!result.matchDetails.birthDate.match && dicomPatient.birthDate && result.matchDetails.birthDate.emr) {
    result.warnings.push('Birth date does not match');
  }
  
  return result;
}

async function validatePatientById(dicomPatient, emrPatientId) {
  try {
    const emrPatient = await User.findById(emrPatientId)
      .select('name firstName lastName dateOfBirth gender patientNumber medicalRecordNumber')
      .lean();
    
    if (!emrPatient) {
      return {
        isMatch: false,
        confidence: 0,
        warnings: ['Patient not found in EMR system'],
        requiresConfirmation: true
      };
    }
    
    return validatePatientMatch(dicomPatient, emrPatient);
  } catch (error) {
    return {
      isMatch: false,
      confidence: 0,
      warnings: [`Error validating patient: ${error.message}`],
      requiresConfirmation: true
    };
  }
}

module.exports = {
  validatePatientMatch,
  validatePatientById,
  normalizeString,
  normalizePatientId,
  calculateSimilarity,
  datesMatch
};
