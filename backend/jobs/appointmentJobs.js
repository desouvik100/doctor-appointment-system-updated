/**
 * Appointment Jobs - Automated Appointment Management
 * ====================================================
 * Handles automatic appointment status updates and cancellations
 * 
 * Jobs:
 * 1. Auto-cancel expired pending appointments (>24 hours old)
 * 2. Auto-complete appointments (>2 hours after scheduled time)
 * 3. Mark no-show appointments (>30 minutes after scheduled time)
 * 4. Update queue positions and estimated wait times
 */

const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

/**
 * Auto-cancel expired pending appointments
 * Cancels appointments that are pending payment for >24 hours
 */
async function autoCancelExpiredPending() {
  try {
    console.log('🔄 Checking for expired pending appointments...');

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    // Find pending appointments older than 24 hours OR pending_payment older than 15 minutes
    const expiredAppointments = await Appointment.find({
      $or: [
        { status: 'pending', createdAt: { $lt: twentyFourHoursAgo } },
        { status: 'pending_payment', createdAt: { $lt: fifteenMinutesAgo } }
      ]
    })
      .populate('userId', 'name email')
      .populate('doctorId', 'name')
      .limit(100);

    console.log(`Found ${expiredAppointments.length} expired pending appointments`);

    let cancelledCount = 0;

    for (const appointment of expiredAppointments) {
      try {
        const isFifteenMinCancel = appointment.status === 'pending_payment';
        // Update appointment status
        appointment.status = 'cancelled';
        appointment.cancellationReason = isFifteenMinCancel 
          ? 'Automatically cancelled - Payment not completed within 15 minutes'
          : 'Automatically cancelled - Booking not completed within 24 hours';
        appointment.cancelledBy = 'system';
        appointment.cancelledAt = new Date();
        await appointment.save();

        // Send notification to user
        if (appointment.userId) {
          await Notification.create({
            userId: appointment.userId._id,
            userType: 'patient',
            title: 'Appointment Cancelled',
            message: `Your appointment with Dr. ${appointment.doctorId.name} has been automatically cancelled due to pending payment.`,
            type: 'appointment_cancelled',
            priority: 'medium',
            data: {
              appointmentId: appointment._id,
              doctorId: appointment.doctorId._id
            }
          });

          // Send email notification
          if (appointment.userId.email) {
            await sendCancellationEmail(appointment);
          }
        }

        cancelledCount++;
      } catch (error) {
        console.error(`Failed to cancel appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`✅ Auto-cancelled ${cancelledCount} expired pending appointments`);
    return { success: true, cancelledCount };
  } catch (error) {
    console.error('❌ Error in autoCancelExpiredPending:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Auto-complete past appointments
 * Marks confirmed appointments as completed if >2 hours past scheduled time
 */
async function autoCompletePastAppointments() {
  try {
    console.log('🔄 Checking for past appointments to complete...');

    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // Find confirmed appointments that are >2 hours past their scheduled time
    const pastAppointments = await Appointment.find({
      status: { $in: ['confirmed', 'in_progress'] },
      date: { $lt: twoHoursAgo }
    }).limit(100);

    console.log(`Found ${pastAppointments.length} past appointments to complete`);

    let completedCount = 0;

    for (const appointment of pastAppointments) {
      try {
        // Check if appointment time has passed by >2 hours
        const appointmentDateTime = new Date(appointment.date);
        const [hours, minutes] = appointment.time.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const twoHoursAfterAppointment = new Date(appointmentDateTime.getTime() + 2 * 60 * 60 * 1000);

        if (new Date() > twoHoursAfterAppointment) {
          appointment.status = 'completed';
          appointment.consultationStatus = 'completed';
          appointment.consultationEndTime = appointmentDateTime;
          await appointment.save();
          completedCount++;
        }
      } catch (error) {
        console.error(`Failed to complete appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`✅ Auto-completed ${completedCount} past appointments`);
    return { success: true, completedCount };
  } catch (error) {
    console.error('❌ Error in autoCompletePastAppointments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark no-show appointments
 * Marks appointments as no-show if patient didn't arrive >30 minutes after scheduled time
 */
async function markNoShowAppointments() {
  try {
    console.log('🔄 Checking for no-show appointments...');

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    // Find confirmed appointments where patient hasn't checked in
    const appointments = await Appointment.find({
      status: 'confirmed',
      consultationType: 'in_person',
      queueStatus: { $in: ['waiting', 'verified'] },
      date: { $lt: thirtyMinutesAgo }
    })
      .populate('userId', 'name email')
      .populate('doctorId', 'name')
      .limit(100);

    console.log(`Found ${appointments.length} potential no-show appointments`);

    let noShowCount = 0;

    for (const appointment of appointments) {
      try {
        // Check if appointment time has passed by >30 minutes
        const appointmentDateTime = new Date(appointment.date);
        const [hours, minutes] = appointment.time.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const thirtyMinutesAfterAppointment = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);

        if (new Date() > thirtyMinutesAfterAppointment) {
          appointment.queueStatus = 'no_show';
          appointment.status = 'cancelled';
          appointment.cancellationReason = 'Patient did not show up';
          appointment.cancelledBy = 'system';
          appointment.cancelledAt = new Date();
          await appointment.save();

          // Send notification
          if (appointment.userId) {
            await Notification.create({
              userId: appointment.userId._id,
              userType: 'patient',
              title: 'Appointment Marked as No-Show',
              message: `Your appointment with Dr. ${appointment.doctorId.name} was marked as no-show. Please contact us if this was an error.`,
              type: 'appointment_cancelled',
              priority: 'high',
              data: {
                appointmentId: appointment._id,
                doctorId: appointment.doctorId._id
              }
            });
          }

          noShowCount++;
        }
      } catch (error) {
        console.error(`Failed to mark no-show for appointment ${appointment._id}:`, error.message);
      }
    }

    console.log(`✅ Marked ${noShowCount} appointments as no-show`);
    return { success: true, noShowCount };
  } catch (error) {
    console.error('❌ Error in markNoShowAppointments:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update queue positions and estimated wait times
 * Recalculates queue positions for active appointments
 */
async function updateQueuePositions() {
  try {
    console.log('🔄 Updating queue positions...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all doctors with active queues today
    const activeQueues = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
          queueStatus: { $in: ['verified', 'in_queue'] },
          status: { $in: ['confirmed', 'in_progress'] }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          appointments: { $push: '$$ROOT' }
        }
      }
    ]);

    let updatedCount = 0;

    for (const queue of activeQueues) {
      // Sort appointments by time
      const sortedAppointments = queue.appointments.sort((a, b) => {
        return a.time.localeCompare(b.time);
      });

      // Update queue positions
      for (let i = 0; i < sortedAppointments.length; i++) {
        const appointment = sortedAppointments[i];
        const newPosition = i + 1;
        const estimatedWait = i * 15; // Assume 15 minutes per patient

        await Appointment.updateOne(
          { _id: appointment._id },
          {
            $set: {
              queuePosition: newPosition,
              estimatedWaitTime: estimatedWait
            }
          }
        );

        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} queue positions`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('❌ Error in updateQueuePositions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send cancellation email
 */
async function sendCancellationEmail(appointment) {
  const patient = appointment.userId;
  const doctor = appointment.doctorId;

  const subject = 'Appointment Cancelled - Payment Not Completed';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .btn { display: inline-block; background: #00D4AA; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Appointment Cancelled</h1>
        </div>
        <div class="content">
          <p>Hello ${patient.name},</p>
          <p>Your appointment with <strong>Dr. ${doctor.name}</strong> scheduled for <strong>${new Date(appointment.date).toLocaleDateString()}</strong> at <strong>${appointment.time}</strong> has been automatically cancelled.</p>
          <p><strong>Reason:</strong> ${appointment.cancellationReason || 'Payment was not completed within the required time.'}</p>
          <p>If you'd like to reschedule, please book a new appointment through the app.</p>
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/doctors" class="btn">
              Book New Appointment
            </a>
          </center>
        </div>
        <div class="footer">
          <p>🏥 HealthSync - Your Healthcare Companion</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: patient.email,
    subject,
    html
  });
}

/**
 * Run all appointment jobs
 */
async function runAllAppointmentJobs() {
  console.log('\n' + '='.repeat(60));
  console.log('📅 RUNNING ALL APPOINTMENT JOBS');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(60) + '\n');

  const results = {
    timestamp: new Date(),
    jobs: {}
  };

  results.jobs.expiredPending = await autoCancelExpiredPending();
  results.jobs.pastAppointments = await autoCompletePastAppointments();
  results.jobs.noShow = await markNoShowAppointments();
  results.jobs.queuePositions = await updateQueuePositions();

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL APPOINTMENT JOBS COMPLETED');
  console.log('='.repeat(60) + '\n');

  return results;
}

/**
 * Initialize appointment job scheduler
 */
function initializeAppointmentJobs() {
  console.log('📅 Initializing appointment job scheduler...');

  // Auto-cancel expired pending appointments - every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running auto-cancel expired pending job...');
    await autoCancelExpiredPending();
  });

  // Auto-complete past appointments - every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Running auto-complete past appointments job...');
    await autoCompletePastAppointments();
  });

  // Mark no-show appointments - every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ Running mark no-show appointments job...');
    await markNoShowAppointments();
  });

  // Update queue positions - every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running update queue positions job...');
    await updateQueuePositions();
  });

  console.log('✅ Appointment jobs scheduled:');
  console.log('   - Auto-cancel expired: Every 15 minutes');
  console.log('   - Auto-complete past: Every 2 hours');
  console.log('   - Mark no-show: Every 30 minutes');
  console.log('   - Update queue: Every 15 minutes');
}

module.exports = {
  initializeAppointmentJobs,
  runAllAppointmentJobs,
  autoCancelExpiredPending,
  autoCompletePastAppointments,
  markNoShowAppointments,
  updateQueuePositions
};
