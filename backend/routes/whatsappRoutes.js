/**
 * WhatsApp Integration Routes
 * API endpoints for sending WhatsApp messages
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

/**
 * POST /api/whatsapp/send-prescription
 * Send prescription via WhatsApp
 */
router.post('/send-prescription', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { prescriptionId, patientPhone } = req.body;
    
    if (!prescriptionId) {
      return res.status(400).json({ success: false, message: 'Prescription ID required' });
    }
    
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name');
    
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    
    const phone = patientPhone || prescription.patientId?.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone number not available' });
    }
    
    const result = await whatsappService.sendPrescription(phone, {
      patientName: prescription.patientId?.name || 'Patient',
      doctorName: prescription.doctorId?.name || 'Doctor',
      clinicName: prescription.clinicId?.name || 'HealthSync',
      date: prescription.createdAt,
      medicines: prescription.medicines || [],
      diagnosis: prescription.diagnosis,
      advice: prescription.advice
    });
    
    // Log the action
    prescription.whatsappSent = true;
    prescription.whatsappSentAt = new Date();
    await prescription.save();
    
    res.json({
      success: true,
      message: result.requiresManualSend 
        ? 'WhatsApp link generated. Click to send.' 
        : 'Prescription sent via WhatsApp',
      ...result
    });
    
  } catch (error) {
    console.error('Error sending prescription via WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-reminder
 * Send appointment reminder via WhatsApp
 */
router.post('/send-reminder', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID required' });
    }
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name phone email')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    const phone = appointment.userId?.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone number not available' });
    }
    
    const result = await whatsappService.sendAppointmentReminder(phone, {
      patientName: appointment.userId?.name || 'Patient',
      doctorName: appointment.doctorId?.name || 'Doctor',
      clinicName: appointment.clinicId?.name || 'HealthSync',
      date: appointment.date,
      time: appointment.time,
      consultationType: appointment.consultationType,
      tokenNumber: appointment.tokenNumber || appointment.queueNumber
    });
    
    // Update reminder status
    if (!appointment.remindersSent) appointment.remindersSent = {};
    appointment.remindersSent.whatsapp = true;
    appointment.remindersSent.whatsappSentAt = new Date();
    await appointment.save();
    
    res.json({
      success: true,
      message: result.requiresManualSend 
        ? 'WhatsApp link generated. Click to send.' 
        : 'Reminder sent via WhatsApp',
      ...result
    });
    
  } catch (error) {
    console.error('Error sending reminder via WhatsApp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-confirmation
 * Send appointment confirmation via WhatsApp
 */
router.post('/send-confirmation', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name phone')
      .populate('doctorId', 'name')
      .populate('clinicId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    const phone = appointment.userId?.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone not available' });
    }
    
    const result = await whatsappService.sendAppointmentConfirmation(phone, {
      patientName: appointment.userId?.name,
      doctorName: appointment.doctorId?.name,
      clinicName: appointment.clinicId?.name,
      date: appointment.date,
      time: appointment.time,
      consultationType: appointment.consultationType,
      tokenNumber: appointment.tokenNumber,
      amount: appointment.payment?.totalAmount
    });
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending confirmation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-lab-report
 * Send lab report notification via WhatsApp
 */
router.post('/send-lab-report', verifyTokenWithRole(['doctor', 'receptionist', 'admin', 'lab']), async (req, res) => {
  try {
    const { patientId, patientPhone, testName, reportDate, reportUrl, clinicName } = req.body;
    
    let phone = patientPhone;
    let patientName = 'Patient';
    
    if (patientId && !phone) {
      const patient = await User.findById(patientId);
      phone = patient?.phone;
      patientName = patient?.name || 'Patient';
    }
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone required' });
    }
    
    const result = await whatsappService.sendLabReportReady(phone, {
      patientName,
      testName: testName || 'Lab Test',
      clinicName: clinicName || 'HealthSync',
      reportDate: reportDate || new Date(),
      reportUrl
    });
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending lab report notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-payment-receipt
 * Send payment receipt via WhatsApp
 */
router.post('/send-payment-receipt', verifyToken, async (req, res) => {
  try {
    const { appointmentId, patientPhone } = req.body;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name phone')
      .populate('doctorId', 'name')
      .populate('clinicId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    const phone = patientPhone || appointment.userId?.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    const result = await whatsappService.sendPaymentReceipt(phone, {
      patientName: appointment.userId?.name,
      amount: appointment.payment?.totalAmount || appointment.paymentDetails?.amount,
      paymentId: appointment.razorpayPaymentId || appointment.payuPaymentId || appointment._id,
      serviceName: `Consultation with Dr. ${appointment.doctorId?.name}`,
      clinicName: appointment.clinicId?.name,
      date: appointment.paymentDetails?.paidAt || new Date()
    });
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-followup-reminder
 * Send follow-up reminder via WhatsApp
 */
router.post('/send-followup-reminder', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { patientId, patientPhone, doctorName, followUpDate, reason, clinicName } = req.body;
    
    let phone = patientPhone;
    let patientName = 'Patient';
    
    if (patientId && !phone) {
      const patient = await User.findById(patientId);
      phone = patient?.phone;
      patientName = patient?.name || 'Patient';
    }
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone required' });
    }
    
    const result = await whatsappService.sendFollowUpReminder(phone, {
      patientName,
      doctorName: doctorName || 'your doctor',
      clinicName: clinicName || 'HealthSync',
      followUpDate,
      reason
    });
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending follow-up reminder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-queue-update
 * Send queue position update via WhatsApp
 */
router.post('/send-queue-update', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('userId', 'name phone')
      .populate('doctorId', 'name');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    const phone = appointment.userId?.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Patient phone not available' });
    }
    
    // Get current queue position
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentServing = await Appointment.findOne({
      doctorId: appointment.doctorId._id,
      date: { $gte: today },
      status: 'in_progress'
    }).sort({ tokenNumber: 1 });
    
    const result = await whatsappService.sendQueueUpdate(phone, {
      patientName: appointment.userId?.name,
      tokenNumber: appointment.tokenNumber || appointment.queueNumber,
      currentToken: currentServing?.tokenNumber || 1,
      estimatedWait: appointment.estimatedWaitTime || 15,
      doctorName: appointment.doctorId?.name
    });
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending queue update:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/send-custom
 * Send custom message via WhatsApp
 */
router.post('/send-custom', verifyTokenWithRole(['doctor', 'receptionist', 'admin']), async (req, res) => {
  try {
    const { phone, message, clinicName } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message required' });
    }
    
    const result = await whatsappService.sendCustomMessage(phone, message, clinicName);
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    console.error('Error sending custom message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/whatsapp/bulk-reminder
 * Send bulk appointment reminders (for tomorrow's appointments)
 */
router.post('/bulk-reminder', verifyTokenWithRole(['admin', 'receptionist']), async (req, res) => {
  try {
    const { clinicId, date } = req.body;
    
    // Default to tomorrow
    const targetDate = date ? new Date(date) : new Date();
    if (!date) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    const query = {
      date: { $gte: targetDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    };
    
    if (clinicId) {
      query.clinicId = clinicId;
    }
    
    const appointments = await Appointment.find(query)
      .populate('userId', 'name phone')
      .populate('doctorId', 'name')
      .populate('clinicId', 'name');
    
    const results = {
      total: appointments.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      links: []
    };
    
    for (const apt of appointments) {
      if (!apt.userId?.phone) {
        results.skipped++;
        continue;
      }
      
      try {
        const result = await whatsappService.sendAppointmentReminder(apt.userId.phone, {
          patientName: apt.userId.name,
          doctorName: apt.doctorId?.name,
          clinicName: apt.clinicId?.name,
          date: apt.date,
          time: apt.time,
          consultationType: apt.consultationType,
          tokenNumber: apt.tokenNumber
        });
        
        if (result.requiresManualSend) {
          results.links.push({
            patient: apt.userId.name,
            link: result.link
          });
        }
        results.sent++;
      } catch (err) {
        results.failed++;
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.total} appointments`,
      results
    });
    
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/whatsapp/generate-link
 * Generate wa.me link for manual sending
 */
router.get('/generate-link', verifyToken, (req, res) => {
  try {
    const { phone, message } = req.query;
    
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message required' });
    }
    
    const result = whatsappService.generateWaLink(
      whatsappService.normalizePhoneNumber(phone),
      message
    );
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
