/**
 
/**
 * Audit Service - Centralized logging for critical actions
 * "Who did what, when, from where"
 */
const auditService = {
  /**
   * Log an action with full context
   */
  async log(action, performer, target, details = {}, req = null) {
    const data = {
      action,
      performedBy: {
        userId: performer?.id || performer?._id,
        name: performer?.name || 'System',
        email: performer?.email,
        role: performer?.role || 'system'
      },
      target: target ? {
        type: target.type,
        id: target.id || target._id,
        name: target.name,
        email: target.email
      } : undefined,
      clinicId: details.clinicId || performer?.clinicId,
      details: {
        before: details.before,
        after: details.after,
        reason: details.reason,
        notes: details.notes
      },
      metadata: req ? {
        ipAddress: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
        userAgent: req.headers?.['user-agent']?.substring(0, 200),
        source: req.headers?.['x-source'] || 'web'
      } : { source: 'system' }
    };

    return AuditLog.log(data);
  },

  // ==================== APPOINTMENT ACTIONS ====================
  
  async appointmentCreated(appointment, performer, req) {
    return this.log('appointment_created', performer, {
      type: 'appointment',
      id: appointment._id,
      name: appointment.patientName
    }, {
      clinicId: appointment.clinicId,
      after: {
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        type: appointment.appointmentType
      }
    }, req);
  },

  async appointmentRescheduled(appointment, oldData, performer, reason, req) {
    return this.log('appointment_rescheduled', performer, {
      type: 'appointment',
      id: appointment._id,
      name: appointment.patientName
    }, {
      clinicId: appointment.clinicId,
      before: { date: oldData.date, time: oldData.time },
      after: { date: appointment.date, time: appointment.time },
      reason
    }, req);
  },

  async appointmentCancelled(appointment, performer, reason, req) {
    return this.log('appointment_cancelled', performer, {
      type: 'appointment',
      id: appointment._id,
      name: appointment.patientName
    }, {
      clinicId: appointment.clinicId,
      before: { status: 'scheduled' },
      after: { status: 'cancelled' },
      reason
    }, req);
  },

  async appointmentCompleted(appointment, performer, req) {
    return this.log('appointment_completed', performer, {
      type: 'appointment',
      id: appointment._id,
      name: appointment.patientName
    }, { clinicId: appointment.clinicId }, req);
  },

  // ==================== DOCTOR ACTIONS ====================

  async doctorAdded(doctor, performer, req) {
    return this.log('doctor_added', performer, {
      type: 'doctor',
      id: doctor._id,
      name: doctor.name,
      email: doctor.email
    }, {
      clinicId: doctor.clinicId,
      after: { specialization: doctor.specialization }
    }, req);
  },

  async doctorRemoved(doctor, performer, reason, req) {
    return this.log('doctor_removed', performer, {
      type: 'doctor',
      id: doctor._id,
      name: doctor.name,
      email: doctor.email
    }, { clinicId: doctor.clinicId, reason }, req);
  },

  async doctorScheduleUpdated(doctor, oldSchedule, newSchedule, performer, req) {
    return this.log('doctor_schedule_updated', performer, {
      type: 'doctor',
      id: doctor._id,
      name: doctor.name
    }, {
      clinicId: doctor.clinicId,
      before: oldSchedule,
      after: newSchedule
    }, req);
  },

  async doctorApproved(doctor, performer, req) {
    return this.log('doctor_approved', performer, {
      type: 'doctor',
      id: doctor._id,
      name: doctor.name,
      email: doctor.email
    }, { clinicId: doctor.clinicId }, req);
  },

  async doctorRejected(doctor, performer, reason, req) {
    return this.log('doctor_rejected', performer, {
      type: 'doctor',
      id: doctor._id,
      name: doctor.name,
      email: doctor.email
    }, { clinicId: doctor.clinicId, reason }, req);
  },

  // ==================== STAFF ACTIONS ====================

  async staffAdded(staff, performer, req) {
    return this.log('staff_added', performer, {
      type: 'staff',
      id: staff._id,
      name: staff.name,
      email: staff.email
    }, { clinicId: staff.clinicId }, req);
  },

  async staffRemoved(staff, performer, reason, req) {
    return this.log('staff_removed', performer, {
      type: 'staff',
      id: staff._id,
      name: staff.name,
      email: staff.email
    }, { clinicId: staff.clinicId, reason }, req);
  },

  async staffApproved(staff, performer, req) {
    return this.log('staff_approved', performer, {
      type: 'staff',
      id: staff._id,
      name: staff.name,
      email: staff.email
    }, { clinicId: staff.clinicId }, req);
  },

  async staffRejected(staff, performer, reason, req) {
    return this.log('staff_rejected', performer, {
      type: 'staff',
      id: staff._id,
      name: staff.name,
      email: staff.email
    }, { clinicId: staff.clinicId, reason }, req);
  },

  async staffRoleChanged(staff, oldRole, newRole, performer, req) {
    return this.log('staff_role_changed', performer, {
      type: 'staff',
      id: staff._id,
      name: staff.name
    }, {
      clinicId: staff.clinicId,
      before: { role: oldRole },
      after: { role: newRole }
    }, req);
  },

  // ==================== PRESCRIPTION ACTIONS ====================

  async prescriptionCreated(prescription, patient, performer, req) {
    return this.log('prescription_created', performer, {
      type: 'prescription',
      id: prescription._id,
      name: patient.name
    }, {
      clinicId: prescription.clinicId,
      after: { medications: prescription.medications?.length || 0 }
    }, req);
  },

  async prescriptionUpdated(prescription, patient, performer, req) {
    return this.log('prescription_updated', performer, {
      type: 'prescription',
      id: prescription._id,
      name: patient.name
    }, { clinicId: prescription.clinicId }, req);
  },

  // ==================== PAYMENT ACTIONS ====================

  async paymentReceived(payment, performer, req) {
    return this.log('payment_received', performer, {
      type: 'payment',
      id: payment._id,
      name: payment.patientName
    }, {
      clinicId: payment.clinicId,
      after: { amount: payment.amount, method: payment.method }
    }, req);
  },

  async paymentRefunded(payment, performer, reason, req) {
    return this.log('payment_refunded', performer, {
      type: 'payment',
      id: payment._id,
      name: payment.patientName
    }, {
      clinicId: payment.clinicId,
      after: { amount: payment.amount },
      reason
    }, req);
  },

  async paymentStatusChanged(payment, oldStatus, newStatus, performer, req) {
    return this.log('payment_status_changed', performer, {
      type: 'payment',
      id: payment._id
    }, {
      clinicId: payment.clinicId,
      before: { status: oldStatus },
      after: { status: newStatus }
    }, req);
  },

  // ==================== CLINIC OPERATIONS ====================

  async clinicDayOpened(clinicId, performer, req) {
    return this.log('clinic_day_opened', performer, {
      type: 'clinic',
      id: clinicId
    }, { clinicId }, req);
  },

  async clinicDayClosed(clinicId, performer, stats, req) {
    return this.log('clinic_day_closed', performer, {
      type: 'clinic',
      id: clinicId
    }, {
      clinicId,
      after: stats // { totalAppointments, completed, cancelled, revenue }
    }, req);
  },

  // ==================== USER MANAGEMENT ====================

  async userSuspended(user, performer, reason, req) {
    return this.log('user_suspended', performer, {
      type: 'user',
      id: user._id,
      name: user.name,
      email: user.email
    }, { reason }, req);
  },

  async userActivated(user, performer, req) {
    return this.log('user_activated', performer, {
      type: 'user',
      id: user._id,
      name: user.name,
      email: user.email
    }, {}, req);
  },

  async userDeleted(user, performer, reason, req) {
    return this.log('user_deleted', performer, {
      type: 'user',
      id: user._id,
      name: user.name,
      email: user.email
    }, { reason }, req);
  },

  // ==================== SECURITY ====================

  async loginSuccess(user, req) {
    return this.log('login_success', user, {
      type: 'user',
      id: user._id,
      name: user.name,
      email: user.email
    }, {}, req);
  },

  async loginFailed(email, req) {
    return this.log('login_failed', { name: 'Unknown', email, role: 'system' }, {
      type: 'user',
      email
    }, {}, req);
  },

  async passwordReset(user, req) {
    return this.log('password_reset', user, {
      type: 'user',
      id: user._id,
      name: user.name,
      email: user.email
    }, {}, req);
  }
};

module.exports = auditService;
