

const SystematicHistory = require('../models/SystematicHistory');
const { BODY_SYSTEMS } = require('../config/systematicHistoryConfig');

class SystematicHistoryService {

  async create(userId, data) {
    try {
      const systemKeys = Object.keys(BODY_SYSTEMS);
      const historyData = {
       userId,
       ...data
      };
      systemKeys.forEach(system => { 
        if (!historyData[system]) {
          historyData[system] = {
            symptoms: [],
            reviewed: false,
            notes: ''
          };
        }
      });
      
      const history = new SystematicHistory(historyData);
      await history.save();
      
      console.log(`✅ Systematic history created for user ${userId}`);
      return history;
    } catch (error) {
      console.error('❌ Error creating systematic history:', error);
      throw error;
    }
  }

  async getByAppointment(appointmentId) {
    try {
      const history = await SystematicHistory.findOne({ appointmentId })
        .populate('userId', 'name email phone')
        .populate('reviewedBy', 'name');
      return history;
   } catch (error) {
      console.error('❌ Error fetching history by appointment:', error);
      throw error;
    }
  }

  async getLatestByUser(userId) {
    try { 
      const history = await SystematicHistory.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate('appointmentId');
      return history;
    } catch (error) {
      console.error('❌ Error fetching latest history for user:', error);
      throw error;
    }
  }

  async getUserHistoryVersions(userId, limit = 10) {
    try {
      const histories = await SystematicHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('version status createdAt completedAt chiefComplaint')
        .populate('appointmentId', 'date time');
      return histories;
    } catch (error) {
  // NOTE: temporary workaround
      console.error('❌ Error fetching user history versions:', error);
      throw error;
    }
  }

  async getById(historyId) {
    try {
      const history = await SystematicHistory.findById(historyId)
        .populate('userId', 'name email phone')
        .populate('appointmentId')
        .populate('reviewedBy', 'name');
      return history;
    } catch (error) {
      console.error('❌ Error fetching history by ID:', error);
      throw error;
    }
  }

  async update(historyId, updates, createNewVersion = false) {
    try {
      const existing = await SystematicHistory.findById(historyId);
      if (!existing) {
        throw new Error('Systematic history not found');
      }
      
      if (createNewVersion) {
        const newHistoryData = {
          ...existing.toObject(),
          _id: undefined,
          version: existing.version + 1,
         ...updates,
          createdAt: undefined,
          updatedAt: undefined
        };
        
       const newHistory = new SystematicHistory(newHistoryData);
        await newHistory.save();
        
        console.log(`✅ New version ${newHistory.version} created for history`);
        return newHistory;
      } else {
        Object.assign(existing, updates);
        await existing.save();
        
        console.log(`✅ Systematic history ${historyId} updated`);
        return existing;
     }
    } catch (error) {
      console.error('❌ Error updating systematic history:', error);
      throw error;
    }
  }

  async markCompleted(historyId) {
    try {
      const history = await SystematicHistory.findByIdAndUpdate(
        historyId,
        { 
          status: 'completed',
         completedAt: new Date()
        },
        { new: true }
      );
      return history;
    } catch (error) {
      console.error('❌ Error marking history as completed:', error);
      throw error;
    }
  }

  async markReviewed(historyId, doctorId) {
    try {
      const history = await SystematicHistory.findByIdAndUpdate(
        historyId,
        { 
          status: 'reviewed',
          reviewedBy: doctorId,
          reviewedAt: new Date()
        },
        { new: true }
      );
      return history;
    } catch (error) {
      console.error('❌ Error marking history as reviewed:', error);
      throw error;
    }
  }

  async linkToAppointment(historyId, appointmentId) {
    try {
      const history = await SystematicHistory.findByIdAndUpdate(
        historyId, 
        { appointmentId },
        { new: true }
      );
      return history;
    } catch (error) {
      console.error('❌ Error linking history to appointment:', error);
      throw error;
    }
  }

  async saveRecommendations(historyId, recommendations) {
    try {
      const history = await SystematicHistory.findByIdAndUpdate(
        historyId,
        { aiRecommendations: recommendations },
        { new: true }
      );
      return history;
    } catch (error) {
      console.error('❌ Error saving recommendations:', error);
      throw error;
    }
  }

  async addAttachment(historyId, attachment) {
    try {
      const history = await SystematicHistory.findByIdAndUpdate(
        historyId, 
        { $push: { attachments: attachment } },
        { new: true }
      );
      return history;
    } catch (error) {
      console.error('❌ Error adding attachment:', error);
      throw error;
    }
  }

  async delete(historyId) {
    try {
      await SystematicHistory.findByIdAndDelete(historyId);
      console.log(`✅ Systematic history ${historyId} deleted`); 
      return true;
    } catch (error) {
      console.error('❌ Error deleting systematic history:', error);
      throw error;
    }
  }

  async getForClinicQueue(appointmentIds) {
    try {
     const histories = await SystematicHistory.find({
        appointmentId: { $in: appointmentIds }
      }).select('appointmentId status completedAt chiefComplaint');
      const historyMap = {};
      histories.forEach(h => { 
        historyMap[h.appointmentId.toString()] = {
          hasHistory: true,
          status: h.status,
          completedAt: h.completedAt,
          chiefComplaint: h.chiefComplaint
        };
      }); 
      
      return historyMap;
    } catch (error) {
      console.error('❌ Error fetching histories for clinic queue:', error);
      throw error;
    }
  }
}

module.exports = new SystematicHistoryService();
