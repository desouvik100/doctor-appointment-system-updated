const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// Get doctor's current control settings
router.get('/settings/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await Doctor.findById(doctorId)
      .select('name consultationSettings bookingControls');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({
      success: true,
      settings: {
        name: doctor.name,
        consultationSettings: doctor.consultationSettings || {},
        bookingControls: doctor.bookingControls || {
          onlineBookingPaused: false,
          clinicBookingPaused: false,
          pauseReason: '',
          pausedUntil: null,
          extendedHours: null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Pause/Resume online bookings
router.post('/pause-online/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { paused, reason, pausedUntil } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Initialize bookingControls if not exists
    if (!doctor.bookingControls) {
      doctor.bookingControls = {};
    }

    doctor.bookingControls.onlineBookingPaused = paused;
    doctor.bookingControls.pauseReason = reason || '';
    doctor.bookingControls.pausedUntil = pausedUntil ? new Date(pausedUntil) : null;
    doctor.bookingControls.onlinePausedAt = paused ? new Date() : null;

    await doctor.save();

    console.log(`🔄 Dr. ${doctor.name}: Online bookings ${paused ? 'PAUSED' : 'RESUMED'}`);

    res.json({
      success: true,
      message: `Online bookings ${paused ? 'paused' : 'resumed'} successfully`,
      bookingControls: doctor.bookingControls
    });
  } catch (error) {
    console.error('Error toggling online bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Pause/Resume clinic bookings
router.post('/pause-clinic/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { paused, reason, pausedUntil } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.bookingControls) {
      doctor.bookingControls = {};
    }

    doctor.bookingControls.clinicBookingPaused = paused;
    doctor.bookingControls.clinicPauseReason = reason || '';
    doctor.bookingControls.clinicPausedUntil = pausedUntil ? new Date(pausedUntil) : null;
    doctor.bookingControls.clinicPausedAt = paused ? new Date() : null;

    await doctor.save();

    console.log(`🔄 Dr. ${doctor.name}: Clinic bookings ${paused ? 'PAUSED' : 'RESUMED'}`);

    res.json({
      success: true,
      message: `Clinic bookings ${paused ? 'paused' : 'resumed'} successfully`,
      bookingControls: doctor.bookingControls
    });
  } catch (error) {
    console.error('Error toggling clinic bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Block a day instantly (emergency leave)
router.post('/block-day/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, reason, notifyPatients } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Parse date
    const [year, month, day] = date.split('-').map(Number);
    const blockDate = new Date(year, month - 1, day);
    blockDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(blockDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all appointments for this day
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: blockDate, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'pending_payment'] }
    }).populate('userId', 'name email phone');

    const affectedCount = appointments.length;

    // Cancel all appointments
    await Appointment.updateMany(
      {
        doctorId,
        date: { $gte: blockDate, $lte: endOfDay },
        status: { $in: ['pending', 'confirmed', 'pending_payment'] }
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: reason || 'Doctor unavailable - Emergency',
          cancelledBy: 'doctor',
          cancelledAt: new Date()
        }
      }
    );

    // Add to blocked days
    if (!doctor.blockedDays) {
      doctor.blockedDays = [];
    }
    doctor.blockedDays.push({
      date: blockDate,
      reason: reason || 'Emergency leave',
      createdAt: new Date()
    });
    await doctor.save();

    // Notify patients if requested
    if (notifyPatients && appointments.length > 0) {
      const formattedDate = blockDate.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      for (const apt of appointments) {
        if (apt.userId?.email) {
          try {
            await sendEmail({
              to: apt.userId.email,
              subject: `⚠️ Appointment Cancelled - Dr. ${doctor.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc3545;">Appointment Cancelled</h2>
                  <p>Dear ${apt.userId.name},</p>
                  <p>We regret to inform you that your appointment with <strong>Dr. ${doctor.name}</strong> on <strong>${formattedDate}</strong> has been cancelled.</p>
                  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0;"><strong>Reason:</strong> ${reason || 'Doctor unavailable due to emergency'}</p>
                  </div>
                  <p>Please book a new appointment at your convenience.</p>
                  <p>We apologize for any inconvenience caused.</p>
                </div>
              `
            });
          } catch (emailError) {
            console.error(`Failed to notify ${apt.userId.email}:`, emailError.message);
          }
        }
      }
    }

    console.log(`🚫 Dr. ${doctor.name}: Blocked ${date}, cancelled ${affectedCount} appointments`);

    res.json({
      success: true,
      message: `Day blocked successfully. ${affectedCount} appointments cancelled.`,
      affectedAppointments: affectedCount,
      notified: notifyPatients
    });
  } catch (error) {
    console.error('Error blocking day:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Extend clinic hours for a day
router.post('/extend-hours/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, newEndTime, reason } = req.body;

    if (!date || !newEndTime) {
      return res.status(400).json({ success: false, message: 'Date and new end time are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Store extended hours
    if (!doctor.extendedHours) {
      doctor.extendedHours = [];
    }

    // Remove existing extension for this date if any
    doctor.extendedHours = doctor.extendedHours.filter(
      eh => eh.date.toISOString().split('T')[0] !== date
    );

    doctor.extendedHours.push({
      date: new Date(date),
      newEndTime,
      reason: reason || 'Extended hours',
      createdAt: new Date()
    });

    await doctor.save();

    console.log(`⏰ Dr. ${doctor.name}: Extended hours on ${date} until ${newEndTime}`);

    res.json({
      success: true,
      message: `Clinic hours extended until ${newEndTime} for ${date}`,
      extendedHours: doctor.extendedHours
    });
  } catch (error) {
    console.error('Error extending hours:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk reschedule all appointments for a day
router.post('/reschedule-day/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { fromDate, toDate, notifyPatients } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'From date and to date are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Parse dates
    const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
    const sourceDate = new Date(fromYear, fromMonth - 1, fromDay);
    sourceDate.setHours(0, 0, 0, 0);
    
    const sourceEndOfDay = new Date(sourceDate);
    sourceEndOfDay.setHours(23, 59, 59, 999);

    const [toYear, toMonth, toDay] = toDate.split('-').map(Number);
    const targetDate = new Date(toYear, toMonth - 1, toDay);

    // Find all appointments for source day
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: sourceDate, $lte: sourceEndOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).populate('userId', 'name email phone');

    const rescheduledCount = appointments.length;

    // Update all appointments to new date
    for (const apt of appointments) {
      apt.date = targetDate;
      apt.rescheduledFrom = sourceDate;
      apt.rescheduledAt = new Date();
      apt.rescheduledBy = 'doctor';
      await apt.save();

      // Notify patient
      if (notifyPatients && apt.userId?.email) {
        const oldDateStr = sourceDate.toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        const newDateStr = targetDate.toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long'
        });

        try {
          await sendEmail({
            to: apt.userId.email,
            subject: `📅 Appointment Rescheduled - Dr. ${doctor.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Appointment Rescheduled</h2>
                <p>Dear ${apt.userId.name},</p>
                <p>Your appointment with <strong>Dr. ${doctor.name}</strong> has been rescheduled:</p>
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Original Date:</strong> <s>${oldDateStr}</s></p>
                  <p><strong>New Date:</strong> ${newDateStr}</p>
                  <p><strong>Time:</strong> ${apt.estimatedTime || apt.time || 'As per queue'}</p>
                </div>
                <p>Your queue position remains the same.</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error(`Failed to notify ${apt.userId.email}:`, emailError.message);
        }
      }
    }

    console.log(`📅 Dr. ${doctor.name}: Rescheduled ${rescheduledCount} appointments from ${fromDate} to ${toDate}`);

    res.json({
      success: true,
      message: `${rescheduledCount} appointments rescheduled to ${toDate}`,
      rescheduledCount,
      notified: notifyPatients
    });
  } catch (error) {
    console.error('Error rescheduling day:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Quick status update for queue management
router.patch('/queue-status/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const previousStatus = appointment.status;
    appointment.status = status;

    // Set timestamps based on status
    if (status === 'in_progress' && previousStatus !== 'in_progress') {
      appointment.consultationStartedAt = new Date();
    }
    if (status === 'completed') {
      appointment.consultationEndedAt = new Date();
      appointment.completedAt = new Date();
    }
    if (status === 'no_show') {
      appointment.markedNoShowAt = new Date();
    }

    await appointment.save();

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        tokenNumber: appointment.tokenNumber || appointment.queueNumber
      }
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get today's control summary
router.get('/today-summary/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await Doctor.findById(doctorId)
      .select('name bookingControls blockedDays extendedHours');

    // Get appointment counts by type and status
    const [onlineStats, clinicStats] = await Promise.all([
      Appointment.aggregate([
        {
          $match: {
            doctorId: doctor._id,
            date: { $gte: today, $lte: endOfDay },
            consultationType: { $in: ['online', 'virtual'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Appointment.aggregate([
        {
          $match: {
            doctorId: doctor._id,
            date: { $gte: today, $lte: endOfDay },
            consultationType: 'in_person'
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const formatStats = (stats) => {
      const result = { total: 0, waiting: 0, inProgress: 0, completed: 0 };
      stats.forEach(s => {
        result.total += s.count;
        if (['pending', 'confirmed'].includes(s._id)) result.waiting += s.count;
        if (s._id === 'in_progress') result.inProgress += s.count;
        if (s._id === 'completed') result.completed += s.count;
      });
      return result;
    };

    res.json({
      success: true,
      summary: {
        online: formatStats(onlineStats),
        clinic: formatStats(clinicStats),
        controls: doctor.bookingControls || {},
        isBlocked: doctor.blockedDays?.some(
          bd => bd.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        ),
        extendedHours: doctor.extendedHours?.find(
          eh => eh.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        )
      }
    });
  } catch (error) {
    console.error('Error fetching today summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
