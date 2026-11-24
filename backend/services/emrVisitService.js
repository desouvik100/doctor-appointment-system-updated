

const EMRVisit = require('../models/EMRVisit');
const EMRAuditLog = require('../models/EMRAuditLog');

class EMRVisitService {

  static async createVisit(visitData, userId) {
    try {
      const {
        patientId,
        clinicId,
        doctorId,
        visitType,
        appointmentId,
        chiefComplaint
      } = visitData;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastVisit = await EMRVisit.findOne({
        clinicId,
        visitDate: { $gte: today }
      }).sort({ tokenNumber: -1 });
      
      const tokenNumber = (lastVisit?.tokenNumber || 0) + 1;
      
      const visit = new EMRVisit({
        patientId,
        clinicId,
        doctorId,
        visitType: visitType || 'walk_in',
        appointmentId,
        chiefComplaint,
        tokenNumber,
        visitDate: new Date(),
        checkInTime: new Date(),
        status: 'waiting',
        createdBy: userId
      });
      
      await visit.save();
      await visit.populate('patientId', 'name phone age gender');
      await visit.populate('doctorId', 'name specialization');
      
      return visit;
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
  }

  static async updateStatus(visitId, status, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      
      const oldStatus = visit.status;
      visit.status = status;
      visit.updatedBy = userId;
      if (status === 'in_progress' && !visit.consultationStartTime) {
        visit.consultationStartTime = new Date();
      } else if (status === 'completed' && !visit.consultationEndTime) {
        visit.consultationEndTime = new Date();
      }
      
      await visit.save();
      await this.logAudit(visit.clinicId, userId, 'status_change', 'EMRVisit', visitId, {
        from: oldStatus,
        to: status
      });
      
      return visit;
    } catch (error) {
      console.error('Error updating visit status:', error);
      throw error;
    }
  }

  static async recordVitals(visitId, vitals, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      if (vitals.weight?.value && vitals.height?.value) {
        const heightInMeters = vitals.height.value / 100;
        vitals.bmi = Math.round((vitals.weight.value / (heightInMeters * heightInMeters)) * 10) / 10;
      }
      
      vitals.recordedAt = new Date();
      vitals.recordedBy = userId;
      
      visit.vitalSigns = vitals;
      visit.updatedBy = userId;
      
      await visit.save();
      
      return visit;
    } catch (error) {
      console.error('Error recording vitals:', error);
      throw error;
    }
  }

  static async addClinicalNotes(visitId, notes, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      
      const oldNotes = { ...visit.clinicalNotes };
      
      visit.clinicalNotes = {
        ...visit.clinicalNotes,
        ...notes
      };
      visit.updatedBy = userId;
      
      await visit.save();
      await this.logAudit(visit.clinicId, userId, 'update', 'EMRVisit', visitId, {
        field: 'clinicalNotes',
        oldValue: oldNotes,
        newValue: visit.clinicalNotes
      });
      
      return visit;
    } catch (error) {
      console.error('Error adding clinical notes:', error);
      throw error;
    }
  }

  static async addDiagnosis(visitId, diagnosis, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      
      if (!visit.diagnosis) {
        visit.diagnosis = [];
      }
      
      visit.diagnosis.push(diagnosis);
      visit.updatedBy = userId;
      
      await visit.save();
      
      return visit;
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      throw error;
    }
  }

  static async linkPrescription(visitId, prescriptionId, userId) {
    try {
      const visit = await EMRVisit.findByIdAndUpdate(
        visitId,
        { 
          prescriptionId,
          updatedBy: userId
        },
        { new: true }
      );
      
      return visit;
    } catch (error) {
      console.error('Error linking prescription:', error);
      throw error;
    }
  }

  static async scheduleFollowUp(visitId, followUpData, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      
      visit.followUp = {
        required: true,
        scheduledDate: followUpData.date,
        reason: followUpData.reason,
        appointmentId: followUpData.appointmentId
      };
      visit.updatedBy = userId;
      
      await visit.save();
      
      return visit;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      throw error;
    }
  }

  static async addLabOrder(visitId, labOrder, userId) {
    try {
      const visit = await EMRVisit.findById(visitId);
      
      if (!visit) {
        throw new Error('Visit not found');
      }
      
      if (!visit.labOrders) {
        visit.labOrders = [];
      }
      
      visit.labOrders.push({
        ...labOrder,
        orderedAt: new Date()
      });
      visit.updatedBy = userId;
      
      await visit.save();
      
      return visit;
    } catch (error) {
      console.error('Error adding lab order:', error);
      throw error;
    }
  }

  static async getVisit(visitId) {
    try {
      const visit = await EMRVisit.findById(visitId)
        .populate('patientId', 'name phone email age gender dateOfBirth address')
        .populate('doctorId', 'name specialization')
        .populate('clinicId', 'name address')
        .populate('prescriptionId')
        .populate('systematicHistoryId');
      
      return visit;
    } catch (error) {
      console.error('Error getting visit:', error);
      throw error;
    }
  }

  static async getPatientVisits(patientId, options = {}) {
    try {
      return EMRVisit.getPatientHistory(patientId, options);
    } catch (error) {
      console.error('Error getting patient visits:', error);
      throw error;
    }
  }

  static async getTodayVisits(clinicId) {
    try {
      return EMRVisit.getTodayVisits(clinicId);
    } catch (error) {
      console.error('Error getting today visits:', error);
      throw error;
    }
  }

  static async getClinicVisits(clinicId, startDate, endDate, options = {}) {
    try {
      const { doctorId, status, limit = 100, skip = 0 } = options;
      
      const query = {
        clinicId,
        visitDate: { $gte: startDate, $lte: endDate },
        isDeleted: false
      };
      
      if (doctorId) query.doctorId = doctorId;
      if (status) query.status = status;
      
      const visits = await EMRVisit.find(query)
        .populate('patientId', 'name phone age gender')
        .populate('doctorId', 'name specialization')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await EMRVisit.countDocuments(query);
      
      return { visits, total };
    } catch (error) {
      console.error('Error getting clinic visits:', error);
      throw error;
    }
  }

  static async logAudit(clinicId, userId, action, entityType, entityId, changes) {
    try {
      if (EMRAuditLog) {
        await EMRAuditLog.create({
          clinicId,
          userId,
          action,
          entityType,
          entityId,
          changes,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  static async deleteVisit(visitId, userId, reason) {
    try {
      const visit = await EMRVisit.findByIdAndUpdate(
        visitId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        },
        { new: true }
      );
      await this.logAudit(visit.clinicId, userId, 'delete', 'EMRVisit', visitId, {
        reason
      });
      
      return visit;
    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }
}

module.exports = EMRVisitService;
