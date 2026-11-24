 

class OfflineDataService {
  async getOfflinePatientData(patientId) {
    const EMRPatient = require('../models/EMRPatient');
    const EMRVisit = require('../models/EMRVisit');
    const Prescription = require('../models/Prescription');
    
    try {
      const patient = await EMRPatient.findById(patientId).lean();
      if (!patient) throw new Error('Patient not found');
      const visits = await EMRVisit.find({ patientId })
        .sort({ visitDate: -1 })
        .limit(10)
        .lean();
      const prescriptions = await Prescription.find({ 
        patientId, 
        status: 'active' 
     }).lean();
      const offlinePackage = {
        syncedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        patient: {
          id: patient._id,
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies || [],
          chronicConditions: patient.chronicConditions || [],
         emergencyContact: patient.emergencyContact
        },
        vitals: visits[0]?.vitals || null,
       medications: prescriptions.map(p => ({
          name: p.medicationName,
          dosage: p.dosage,
          frequency: p.frequency,
          instructions: p.instructions
        })),
        recentDiagnoses: visits.slice(0, 5).map(v => ({
          date: v.visitDate,
         diagnosis: v.diagnosis,
          icdCode: v.icdCode
        })),
        alerts: this.generatePatientAlerts(patient, visits, prescriptions)
      };
      
      return offlinePackage;
    } catch (err) {
      console.error('Offline data fetch error:', error);
      throw error;
    }
  }
  generatePatientAlerts(patient, visits, prescriptions) {
   const alerts = [];
    if (patient.allergies?.length > 0) {
      alerts.push({
       type: 'allergy',
        severity: 'high',
        message: `Allergies: ${patient.allergies.join(', ')}`
      });
    }
    if (patient.chronicConditions?.length > 0) {
      alerts.push({
        type: 'chronic',
        severity: 'medium',
        message: `Chronic: ${patient.chronicConditions.join(', ')}`
     });
    }
    const highRiskMeds = ['warfarin', 'insulin', 'methotrexate', 'lithium'];
    prescriptions.forEach(p => {
      if (highRiskMeds.some(m => p.medicationName?.toLowerCase().includes(m))) {
        alerts.push({
          type: 'medication',
          severity: 'high',
          message: `High-risk medication: ${p.medicationName}`
       });
      }
    });
    
    return alerts;
  }
  async syncOfflineChanges(changes) {
    const results = { success: [], failed: [] };
    
    for (const change of changes) {
      try {
        switch (change.type) {
          case 'vitals':
            await this.syncVitals(change.data);
            break;
          case 'note':
            await this.syncNote(change.data);
            break;
          case 'prescription':
            await this.syncPrescription(change.data);
            break;
        }
        results.success.push(change.id); 
      } catch (error) {
        results.failed.push({ id: change.id, error: error.message });
      }
    }
    
    return results;
  }
  
  async syncVitals(data) {
    const EMRVisit = require('../models/EMRVisit');
    await EMRVisit.findByIdAndUpdate(data.visitId, {
      $set: { vitals: data.vitals, updatedAt: new Date() }
    });
  }
  
  async syncNote(data) {
    const EMRVisit = require('../models/EMRVisit');
    await EMRVisit.findByIdAndUpdate(data.visitId, {
      $push: { notes: { ...data.note, syncedAt: new Date() } }
    });
  }
  
  async syncPrescription(data) {
    const Prescription = require('../models/Prescription');
    if (data._id) {
      await Prescription.findByIdAndUpdate(data._id, data);
    } else {
      await Prescription.create({ ...data, syncedAt: new Date() }); 
    }
  }
}

module.exports = new OfflineDataService();
