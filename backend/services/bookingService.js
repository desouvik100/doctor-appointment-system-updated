

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const OnlineSlot = require('../models/OnlineSlot');
const ClinicSlot = require('../models/ClinicSlot');
const FinancialLedger = require('../models/FinancialLedger');
const { ConflictError, NotFoundError, ValidationError } = require('../middleware/errorHandler');

class BookingService {
  
  static async createBooking(bookingData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        doctorId,
        slotId,
        slotType, 
        date,
        consultationType,
        reason,
        symptoms,
        patientDetails
      } = bookingData;
      const SlotModel = slotType === 'online' ? OnlineSlot : ClinicSlot;
      
      const slot = await SlotModel.findOneAndUpdate(
        {
          _id: slotId,
          isBooked: false,
          isBlocked: false
        },
        {
          $set: {
            isBooked: true,
            bookedBy: userId,
            bookedAt: new Date()
          }
        },
        { 
          new: true, 
          session,
          runValidators: true
        }
      );

      if (!slot) {
        throw new ConflictError('Slot is no longer available. Please select another slot.');
      }
      const existingAppointments = await Appointment.countDocuments({
        doctor: doctorId,
        date: date,
        status: { $nin: ['cancelled'] }
      }).session(session);

      const queueNumber = existingAppointments + 1;
      const appointment = new Appointment({
        patient: userId,
        doctor: doctorId,
        date: date,
        time: slot.startTime,
        endTime: slot.endTime,
        consultationType: consultationType,
        reason: reason || '',
        symptoms: symptoms || [],
        queueNumber: queueNumber,
        slotId: slotId,
        slotType: slotType,
        status: 'pending', 
        patientDetails: patientDetails,
        createdAt: new Date()
      });

      await appointment.save({ session });
      await SlotModel.findByIdAndUpdate(
        slotId,
        { appointmentId: appointment._id },
        { session }
      );

      await session.commitTransaction();

      return {
        success: true,
        appointment: appointment,
        slot: slot,
        queueNumber: queueNumber,
        message: 'Booking created successfully. Please complete payment.'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async confirmBooking(appointmentId, paymentDetails, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          patient: userId,
          status: 'pending'
        },
        {
          $set: {
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentId: paymentDetails.paymentId,
            paymentMethod: paymentDetails.method || 'razorpay',
            paidAt: new Date()
          }
        },
        { new: true, session }
      ).populate('doctor', 'name specialization consultationFee');

      if (!appointment) {
        throw new NotFoundError('Appointment not found or already processed');
      }
      const ledgerEntry = new FinancialLedger({
        appointmentId: appointment._id,
        doctorId: appointment.doctor._id,
        patientId: userId,
        transactionType: 'booking_payment',
        consultationType: appointment.consultationType,
        consultationFee: paymentDetails.consultationFee,
        platformFee: paymentDetails.platformFee || 0,
        convenienceFee: paymentDetails.convenienceFee || 0,
        gstAmount: paymentDetails.gstAmount || 0,
        totalAmount: paymentDetails.totalAmount,
        commissionAmount: paymentDetails.commissionAmount || 0,
        commissionType: paymentDetails.commissionType || 'percentage',
        doctorEarnings: paymentDetails.doctorEarnings,
        platformEarnings: paymentDetails.platformEarnings || 0,
        paymentId: paymentDetails.paymentId,
        paymentMethod: paymentDetails.method || 'razorpay',
        paymentGatewayFee: paymentDetails.gatewayFee || 0,
        
        status: 'completed',
        createdAt: new Date()
      });

      await ledgerEntry.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        appointment: appointment,
        ledgerEntry: ledgerEntry,
        message: 'Booking confirmed successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async cancelBooking(appointmentId, userId, reason, isDoctor = false) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query = { _id: appointmentId };
      if (!isDoctor) {
        query.patient = userId;
      }

      const appointment = await Appointment.findOne(query).session(session);

      if (!appointment) {
        throw new NotFoundError('Appointment');
      }

      if (appointment.status === 'cancelled') {
        throw new ConflictError('Appointment is already cancelled');
      }

      if (appointment.status === 'completed') {
        throw new ConflictError('Cannot cancel a completed appointment');
      }
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = isDoctor ? 'doctor' : 'patient';
      appointment.cancellationReason = reason || 'Cancelled by user';
      await appointment.save({ session });
      const SlotModel = appointment.slotType === 'online' ? OnlineSlot : ClinicSlot;
      await SlotModel.findByIdAndUpdate(
        appointment.slotId,
        {
          $set: {
            isBooked: false,
            bookedBy: null,
            bookedAt: null,
            appointmentId: null
          }
        },
        { session }
      );
      if (appointment.paymentStatus === 'paid') {
        const refundEntry = new FinancialLedger({
          appointmentId: appointment._id,
          doctorId: appointment.doctor,
          patientId: appointment.patient,
          transactionType: 'refund',
          consultationType: appointment.consultationType,
          totalAmount: -appointment.totalPaid, 
          status: 'pending_refund',
          refundReason: reason,
          createdAt: new Date()
        });
        await refundEntry.save({ session });
      }

      await session.commitTransaction();

      return {
        success: true,
        appointment: appointment,
        message: 'Appointment cancelled successfully',
        refundInitiated: appointment.paymentStatus === 'paid'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getAvailableSlots(doctorId, date, slotType = 'both') {
    const query = {
      doctor: doctorId,
      date: date,
      isBooked: false,
      isBlocked: false
    };

    let slots = [];

    if (slotType === 'online' || slotType === 'both') {
      const onlineSlots = await OnlineSlot.find(query)
        .sort({ startTime: 1 })
        .lean();
      slots = slots.concat(onlineSlots.map(s => ({ ...s, slotType: 'online' })));
    }

    if (slotType === 'clinic' || slotType === 'both') {
      const clinicSlots = await ClinicSlot.find(query)
        .sort({ startTime: 1 })
        .lean();
      slots = slots.concat(clinicSlots.map(s => ({ ...s, slotType: 'clinic' })));
    }

    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  static async checkSlotAvailability(slotId, slotType) {
    const SlotModel = slotType === 'online' ? OnlineSlot : ClinicSlot;
    const slot = await SlotModel.findById(slotId).lean();

    if (!slot) {
      return { available: false, reason: 'Slot not found' };
    }

    if (slot.isBooked) {
      return { available: false, reason: 'Slot already booked' };
    }

    if (slot.isBlocked) {
      return { available: false, reason: 'Slot is blocked' };
    }

    return { available: true, slot };
  }
}

module.exports = BookingService;
