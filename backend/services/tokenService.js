const Appointment = require('../models/Appointment');

class TokenService {
  /**
   * Generate and save token for appointment
   */
  static async generateTokenForAppointment(appointmentId, doctorCode = 'GEN') {
    try {
      const appointment = await Appointment.findById(appointmentId).populate('doctorId');
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Use doctor's specialty code if available
      const code = doctorCode || appointment.doctorId?.specialization?.substring(0, 5) || 'GEN';
      
      // Generate token
      appointment.generateToken(code);
      appointment.queueStatus = 'waiting';
      
      await appointment.save();
      
      return {
        success: true,
        token: appointment.token,
        expiresAt: appointment.tokenExpiredAt,
        message: 'Token generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify token and update queue status
   */
  static async verifyToken(token) {
    try {
      const appointment = await Appointment.findOne({ token: token.toUpperCase() })
        .populate('userId')
        .populate('doctorId')
        .populate('clinicId');

      if (!appointment) {
        return {
          success: false,
          error: 'Token not found',
          status: 404
        };
      }

      // Check if token is expired
      if (new Date() > appointment.tokenExpiredAt) {
        appointment.queueStatus = 'expired';
        await appointment.save();
        return {
          success: false,
          error: 'Token has expired',
          status: 'expired'
        };
      }

      // Check if already verified
      if (appointment.queueStatus === 'completed' || appointment.queueStatus === 'no_show') {
        return {
          success: false,
          error: `Appointment already ${appointment.queueStatus}`,
          status: appointment.queueStatus
        };
      }

      // Update status to verified
      appointment.queueStatus = 'verified';
      appointment.verifiedAt = new Date();
      await appointment.save();

      return {
        success: true,
        appointment: {
          token: appointment.token,
          patientName: appointment.userId?.name,
          patientEmail: appointment.userId?.email,
          doctorName: appointment.doctorId?.name,
          doctorSpecialization: appointment.doctorId?.specialization,
          clinicName: appointment.clinicId?.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          status: appointment.queueStatus,
          verifiedAt: appointment.verifiedAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  /**
   * Add appointment to queue
   */
  static async addToQueue(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.queueStatus !== 'verified') {
        throw new Error('Appointment must be verified before adding to queue');
      }

      // Get queue position
      const queueCount = await Appointment.countDocuments({
        doctorId: appointment.doctorId,
        date: {
          $gte: new Date(appointment.date).setHours(0, 0, 0, 0),
          $lt: new Date(appointment.date).setHours(23, 59, 59, 999)
        },
        queueStatus: { $in: ['in_queue', 'verified'] }
      });

      appointment.queuePosition = queueCount + 1;
      appointment.queueStatus = 'in_queue';
      appointment.estimatedWaitTime = queueCount * 15; // Assume 15 min per patient

      await appointment.save();

      return {
        success: true,
        queuePosition: appointment.queuePosition,
        estimatedWaitTime: appointment.estimatedWaitTime,
        message: 'Added to queue successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get queue list for a doctor on a specific date
   */
  static async getQueueList(doctorId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const queue = await Appointment.find({
        doctorId,
        date: {
          $gte: startDate,
          $lte: endDate
        },
        queueStatus: { $in: ['in_queue', 'verified', 'completed'] }
      })
        .populate('userId', 'name email phone')
        .sort({ queuePosition: 1 })
        .select('token queuePosition estimatedWaitTime queueStatus appointmentTime userId');

      return {
        success: true,
        queue: queue.map((apt, index) => ({
          position: index + 1,
          token: apt.token,
          patientName: apt.userId?.name,
          patientEmail: apt.userId?.email,
          patientPhone: apt.userId?.phone,
          appointmentTime: apt.appointmentTime,
          status: apt.queueStatus,
          estimatedWaitTime: apt.estimatedWaitTime
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get patient's token
   */
  static async getPatientToken(userId) {
    try {
      const appointment = await Appointment.findOne({
        userId,
        date: { $gte: new Date() },
        token: { $exists: true, $ne: null }
      })
        .sort({ date: 1 })
        .select('token queueStatus appointmentTime date doctorId clinicId');

      if (!appointment) {
        return {
          success: false,
          error: 'No upcoming appointment with token found'
        };
      }

      return {
        success: true,
        token: appointment.token,
        status: appointment.queueStatus,
        appointmentDate: appointment.date,
        appointmentTime: appointment.appointmentTime,
        expiresAt: appointment.tokenExpiredAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark appointment as completed
   */
  static async markAsCompleted(appointmentId) {
    try {
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          queueStatus: 'completed',
          status: 'completed'
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Appointment marked as completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark appointment as no-show
   */
  static async markAsNoShow(appointmentId) {
    try {
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          queueStatus: 'no_show',
          status: 'cancelled'
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Appointment marked as no-show'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Expire old tokens
   */
  static async expireOldTokens() {
    try {
      const result = await Appointment.updateMany(
        {
          tokenExpiredAt: { $lt: new Date() },
          queueStatus: { $in: ['waiting', 'verified', 'in_queue'] }
        },
        {
          queueStatus: 'expired'
        }
      );

      return {
        success: true,
        expiredCount: result.modifiedCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TokenService;
