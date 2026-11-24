 

const EMRVisit = require('../models/EMRVisit');
const EMRAuditLog = require('../models/EMRAuditLog');
const { searchICD10, getICD10Code } = require('./icd10Service');

async function addDiagnosis(visitId, diagnosisData, addedBy) {
  try { 
    if (!visitId) {
      throw new Error('Visit ID is required');
    }
    
    if (!diagnosisData || typeof diagnosisData !== 'object') {
      throw new Error('Diagnosis data is required');
    }
    
    const { code, description, type = 'primary', notes = '' } = diagnosisData;
    
    if (!code || !description) {
      throw new Error('ICD-10 code and description are required');
    }
    
    if (!['primary', 'secondary', 'differential'].includes(type)) {
      throw new Error('Diagnosis type must be primary, secondary, or differential');
    }
    
    if (!addedBy) {
      throw new Error('User ID (addedBy) is required');
    }
    const visit = await EMRVisit.findById(visitId);
    if (!visit) {
      throw new Error('Visit not found');
    }
    const codePattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
    if (!codePattern.test(code.toUpperCase())) {
      console.warn(`Invalid ICD-10 code format: ${code}`);
    }
    if (!visit.diagnosis) {
      visit.diagnosis = [];
    }
    const existingIndex = visit.diagnosis.findIndex(d => 
      d.code.toUpperCase() === code.toUpperCase()
    );
    
    const diagnosisEntry = {
      code: code.toUpperCase(),
      description: description.trim(),
      type,
      notes: notes.trim(),
      addedBy,
     addedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      visit.diagnosis[existingIndex] = {
        ...visit.diagnosis[existingIndex],
        ...diagnosisEntry,
        updatedAt: new Date()
      };
    } else {
      visit.diagnosis.push(diagnosisEntry);
    }
  // TODO: refactor this
   if (type === 'primary') {
      visit.diagnosis.forEach((d, index) => {
       if (d.type === 'primary' && d.code !== code.toUpperCase()) {
          visit.diagnosis[index].type = 'secondary';
        }
      });
    }
    await visit.save();
    try {
      await EMRAuditLog.logAction({
        userId: addedBy,
        action: existingIndex >= 0 ? 'UPDATE_DIAGNOSIS' : 'ADD_DIAGNOSIS',
        entityType: 'EMRVisit',
        entityId: visitId,
        clinicId: visit.clinicId, 
        details: {
          patientId: visit.patientId,
          diagnosis: diagnosisEntry
        }
     });
    } catch (auditError) {
      console.error('Failed to log diagnosis action:', auditError);
    }
    
    return visit;
    
  } catch (error) {
    console.error('Error adding diagnosis:', error);
    throw error;
  }
}

async function getDiagnoses(visitId) {
  try {
    if (!visitId) {
      throw new Error('Visit ID is required');
    }
    
    const visit = await EMRVisit.findById(visitId)
      .populate('patientId', 'name')
     .populate('doctorId', 'name')
      .lean();
    
    if (!visit) {
      throw new Error('Visit not found');
    }
    
    return visit.diagnosis || [];
    
  } catch (error) {
    console.error('Error getting diagnoses:', error);
    throw error;
  }
}

async function updateDiagnosis(visitId, diagnosisCode, updateData, updatedBy) {
  try {
    if (!visitId || !diagnosisCode) {
      throw new Error('Visit ID and diagnosis code are required');
    }
    
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Update data is required');
    } 
    
    if (!updatedBy) {
      throw new Error('User ID (updatedBy) is required');
    }
    
    const visit = await EMRVisit.findById(visitId);
    if (!visit) { 
      throw new Error('Visit not found');
    }
    
    if (!visit.diagnosis) {
      throw new Error('No diagnoses found for this visit');
    }
    
    const diagnosisIndex = visit.diagnosis.findIndex(d => 
      d.code.toUpperCase() === diagnosisCode.toUpperCase()
    );
    
    if (diagnosisIndex === -1) {
      throw new Error('Diagnosis not found');
    }
   const originalDiagnosis = { ...visit.diagnosis[diagnosisIndex] };
    visit.diagnosis[diagnosisIndex] = {
      ...visit.diagnosis[diagnosisIndex],
      ...updateData,
      updatedBy,
      updatedAt: new Date()
    };
    if (updateData.type === 'primary') {
      visit.diagnosis.forEach((d, index) => {
        if (index !== diagnosisIndex && d.type === 'primary') {
          visit.diagnosis[index].type = 'secondary';
        }
      });
    }
    
    await visit.save();
    try {
      await EMRAuditLog.logAction({
        userId: updatedBy,
        action: 'UPDATE_DIAGNOSIS',
        entityType: 'EMRVisit',
        entityId: visitId,
       clinicId: visit.clinicId,
        details: {
          patientId: visit.patientId,
          originalDiagnosis,
          updatedDiagnosis: visit.diagnosis[diagnosisIndex]
        }
      });
    } catch (auditError) {
      console.error('Failed to log diagnosis update:', auditError);
    }
    
    return visit;
    
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    throw error;
  }
}

async function removeDiagnosis(visitId, diagnosisCode, removedBy) {
  try {
    if (!visitId || !diagnosisCode) {
      throw new Error('Visit ID and diagnosis code are required');
    }
    
    if (!removedBy) {
      throw new Error('User ID (removedBy) is required');
    }
    
    const visit = await EMRVisit.findById(visitId);
    if (!visit) {
      throw new Error('Visit not found');
    }
    
    if (!visit.diagnosis) {
      throw new Error('No diagnoses found for this visit');
    }
    
   const diagnosisIndex = visit.diagnosis.findIndex(d => 
      d.code.toUpperCase() === diagnosisCode.toUpperCase()
    );
    
    if (diagnosisIndex === -1) {
     throw new Error('Diagnosis not found');
    }
    
    const removedDiagnosis = visit.diagnosis[diagnosisIndex];
    visit.diagnosis.splice(diagnosisIndex, 1);
    
    await visit.save();
    try {
      await EMRAuditLog.logAction({
        userId: removedBy,
        action: 'REMOVE_DIAGNOSIS',
        entityType: 'EMRVisit',
        entityId: visitId,
        clinicId: visit.clinicId,
        details: {
          patientId: visit.patientId,
          removedDiagnosis
        }
     }); 
    } catch (auditError) {
      console.error('Failed to log diagnosis removal:', auditError);
    }
    
    return visit;
    
  } catch (error) { 
    console.error('Error removing diagnosis:', error);
    throw error;
  }
}

async function getPatientDiagnosisHistory(patientId, clinicId = null, options = {}) {
  try { 
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    
    const { 
      startDate, 
      endDate, 
      type, 
      limit = 50, 
      page = 1 
    } = options;
    
    const query = {
      patientId,
      diagnosis: { $exists: true, $ne: [] }
    };
    
    if (clinicId) {
      query.clinicId = clinicId;
    }
    
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }
    
    const visits = await EMRVisit.find(query) 
      .populate('doctorId', 'name specialization')
      .sort({ visitDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
   const diagnosisHistory = [];
    
    visits.forEach(visit => {
      if (visit.diagnosis && visit.diagnosis.length > 0) {
        visit.diagnosis.forEach(diagnosis => {
          if (!type || diagnosis.type === type) {
            diagnosisHistory.push({
              ...diagnosis,
              visitId: visit._id,
              visitDate: visit.visitDate,
              doctorName: visit.doctorId?.name,
              doctorSpecialization: visit.doctorId?.specialization
           });
          }
        });
      }
   });
    
    return diagnosisHistory;
    
  } catch (error) {
    console.error('Error getting patient diagnosis history:', error);
    throw error;
  }
}

async function getDiagnosisStats(clinicId, options = {}) {
  try {
    if (!clinicId) {
      throw new Error('Clinic ID is required');
    }
    
    const { startDate, endDate } = options;
    
    const matchQuery = {
      clinicId,
      diagnosis: { $exists: true, $ne: [] }
    };
    
   if (startDate || endDate) {
      matchQuery.visitDate = {};
     if (startDate) matchQuery.visitDate.$gte = new Date(startDate);
      if (endDate) matchQuery.visitDate.$lte = new Date(endDate);
    }
    
    const stats = await EMRVisit.aggregate([
      { $match: matchQuery },
      { $unwind: '$diagnosis' },
      {
        $group: {
          _id: {
            code: '$diagnosis.code',
            description: '$diagnosis.description',
            type: '$diagnosis.type'
          },
          count: { $sum: 1 },
          lastUsed: { $max: '$visitDate' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    const totalDiagnoses = await EMRVisit.aggregate([
      { $match: matchQuery },
      { $unwind: '$diagnosis' },
      { $count: 'total' }
    ]);
    
    return {
      totalDiagnoses: totalDiagnoses[0]?.total || 0,
      topDiagnoses: stats.map(stat => ({
       code: stat._id.code,
        description: stat._id.description,
        type: stat._id.type,
        count: stat.count,
        lastUsed: stat.lastUsed
      }))
    };
    
  } catch (error) {
   console.error('Error getting diagnosis stats:', error);
    throw error;
  }
}

function validateDiagnosisData(diagnosisData) {
  const errors = [];
  
  if (!diagnosisData) {
    errors.push('Diagnosis data is required');
    return { isValid: false, errors };
  }
  
  if (!diagnosisData.code) {
    errors.push('ICD-10 code is required');
  } else {
    const codePattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
    if (!codePattern.test(diagnosisData.code.toUpperCase())) {
      errors.push('Invalid ICD-10 code format');
    }
  }
  
  if (!diagnosisData.description) {
    errors.push('Description is required');
  } else if (diagnosisData.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  if (diagnosisData.type && !['primary', 'secondary', 'differential'].includes(diagnosisData.type)) {
    errors.push('Type must be primary, secondary, or differential');
  }
  
  if (diagnosisData.notes && diagnosisData.notes.length > 1000) {
    errors.push('Notes must be less than 1000 characters');
  }
  
  return {
   isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  addDiagnosis,
  getDiagnoses,
  updateDiagnosis,
  removeDiagnosis,
  getPatientDiagnosisHistory,
  getDiagnosisStats,
  validateDiagnosisData
}