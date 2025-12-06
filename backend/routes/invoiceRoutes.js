// backend/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Payment = require('../models/Payment');
const { generateInvoiceHTML, generateInvoiceNumber, sendInvoiceEmail, generateAndSendInvoice } = require('../services/invoiceService');

// Test endpoint - send invoice to specific email
router.post('/test-send', async (req, res) => {
  try {
    const { email, appointmentId } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // If appointmentId provided, use that appointment
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email phone')
        .populate('doctorId', 'name specialization consultationFee')
        .populate('clinicId', 'name address');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const result = await generateAndSendInvoice(
        appointment,
        { ...appointment.userId?.toObject(), email }, // Override email
        appointment.doctorId,
        appointment.clinicId,
        {
          consultationFee: appointment.doctorId?.consultationFee || 500,
          platformFee: 35,
          tax: 96,
          totalAmount: 631,
          status: 'completed'
        }
      );

      return res.json(result);
    }

    // Send test invoice with dummy data
    const testInvoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      patient: { name: 'Test Patient', email, phone: '+91-9876543210' },
      doctor: { name: 'Dr. Test Doctor', specialization: 'General Physician', consultationFee: 500 },
      clinic: { name: 'HealthSync Clinic', address: 'Bankura, West Bengal' },
      appointment: { date: new Date(), time: '10:00 AM', consultationType: 'offline', reason: 'General Checkup' },
      payment: { consultationFee: 500, platformFee: 35, tax: 96, totalAmount: 631, status: 'completed' },
      generatedAt: new Date()
    };

    const result = await sendInvoiceEmail(testInvoiceData);
    res.json({ ...result, testData: true });
  } catch (error) {
    console.error('Test invoice error:', error);
    res.status(500).json({ message: 'Failed to send test invoice', error: error.message });
  }
});

// Send invoice for latest appointment of a user (by email)
router.post('/send-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Find latest appointment
    const appointment = await Appointment.findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address');

    if (!appointment) {
      return res.status(404).json({ message: 'No appointments found for this user' });
    }

    const payment = await Payment.findOne({ appointmentId: appointment._id });

    const result = await generateAndSendInvoice(
      appointment,
      appointment.userId,
      appointment.doctorId,
      appointment.clinicId,
      payment || {
        consultationFee: appointment.doctorId?.consultationFee || 500,
        platformFee: 35,
        tax: 96,
        totalAmount: appointment.payment?.totalAmount || 631,
        status: 'completed'
      }
    );

    res.json({
      ...result,
      appointmentId: appointment._id,
      appointmentDate: appointment.date
    });
  } catch (error) {
    console.error('Send by email error:', error);
    res.status(500).json({ message: 'Failed to send invoice', error: error.message });
  }
});

// Generate invoice for an appointment
router.get('/generate/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email phone address')
      .populate('doctorId', 'name specialization qualification consultationFee')
      .populate('clinicId', 'name address phone email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Get payment info if exists
    const payment = await Payment.findOne({ appointmentId: appointment._id });

    const invoiceNumber = generateInvoiceNumber();
    const invoiceData = {
      invoiceNumber,
      patient: appointment.userId,
      doctor: appointment.doctorId,
      clinic: appointment.clinicId,
      appointment,
      payment: payment || {
        consultationFee: appointment.doctorId?.consultationFee || 500,
        status: appointment.payment?.status || 'pending',
        totalAmount: appointment.payment?.totalAmount
      },
      generatedAt: new Date()
    };

    const invoiceHTML = generateInvoiceHTML(invoiceData);

    res.json({
      success: true,
      invoiceNumber,
      invoiceHTML,
      invoiceData: {
        patient: invoiceData.patient?.name,
        doctor: invoiceData.doctor?.name,
        amount: invoiceData.payment?.totalAmount || invoiceData.payment?.consultationFee,
        date: invoiceData.generatedAt
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
});

// Send invoice via email
router.post('/send/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email phone address')
      .populate('doctorId', 'name specialization qualification consultationFee')
      .populate('clinicId', 'name address phone email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!appointment.userId?.email) {
      return res.status(400).json({ message: 'Patient email not found' });
    }

    // Get payment info
    const payment = await Payment.findOne({ appointmentId: appointment._id });

    const result = await generateAndSendInvoice(
      appointment,
      appointment.userId,
      appointment.doctorId,
      appointment.clinicId,
      payment || {
        consultationFee: appointment.doctorId?.consultationFee || 500,
        status: appointment.payment?.status || 'completed',
        totalAmount: appointment.payment?.totalAmount
      }
    );

    if (result.success) {
      // Update appointment with invoice number
      appointment.invoiceNumber = result.invoiceNumber;
      appointment.invoiceSentAt = new Date();
      await appointment.save();
    }

    res.json(result);
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ message: 'Failed to send invoice', error: error.message });
  }
});

// Download invoice as HTML
router.get('/download/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email phone address')
      .populate('doctorId', 'name specialization qualification consultationFee registrationNumber')
      .populate('clinicId', 'name address phone email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const payment = await Payment.findOne({ appointmentId: appointment._id });

    const invoiceNumber = appointment.invoiceNumber || generateInvoiceNumber();
    const invoiceData = {
      invoiceNumber,
      patient: appointment.userId,
      doctor: appointment.doctorId,
      clinic: appointment.clinicId,
      appointment,
      payment: payment || {
        consultationFee: appointment.doctorId?.consultationFee || 500,
        status: appointment.payment?.status || 'pending',
        totalAmount: appointment.payment?.totalAmount
      },
      generatedAt: new Date()
    };

    const invoiceHTML = generateInvoiceHTML(invoiceData);

    // Set headers for download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.html`);
    res.send(invoiceHTML);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ message: 'Failed to download invoice', error: error.message });
  }
});

// Get invoice by appointment ID (view only)
router.get('/view/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('userId', 'name email phone address')
      .populate('doctorId', 'name specialization qualification consultationFee')
      .populate('clinicId', 'name address phone email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const payment = await Payment.findOne({ appointmentId: appointment._id });

    const invoiceNumber = appointment.invoiceNumber || generateInvoiceNumber();
    const invoiceData = {
      invoiceNumber,
      patient: appointment.userId,
      doctor: appointment.doctorId,
      clinic: appointment.clinicId,
      appointment,
      payment: payment || {
        consultationFee: appointment.doctorId?.consultationFee || 500,
        status: appointment.payment?.status || 'pending',
        totalAmount: appointment.payment?.totalAmount
      },
      generatedAt: appointment.invoiceSentAt || new Date()
    };

    const invoiceHTML = generateInvoiceHTML(invoiceData);

    // Return HTML directly for viewing in browser
    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHTML);
  } catch (error) {
    console.error('View invoice error:', error);
    res.status(500).json({ message: 'Failed to view invoice', error: error.message });
  }
});

// Bulk send invoices (admin)
router.post('/bulk-send', async (req, res) => {
  try {
    const { appointmentIds } = req.body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return res.status(400).json({ message: 'appointmentIds array required' });
    }

    const results = [];
    for (const appointmentId of appointmentIds) {
      try {
        const appointment = await Appointment.findById(appointmentId)
          .populate('userId', 'name email phone')
          .populate('doctorId', 'name specialization consultationFee')
          .populate('clinicId', 'name address');

        if (appointment && appointment.userId?.email) {
          const payment = await Payment.findOne({ appointmentId });
          const result = await generateAndSendInvoice(
            appointment,
            appointment.userId,
            appointment.doctorId,
            appointment.clinicId,
            payment
          );
          results.push({ appointmentId, ...result });
        } else {
          results.push({ appointmentId, success: false, message: 'Appointment not found or no email' });
        }
      } catch (err) {
        results.push({ appointmentId, success: false, message: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      message: `Sent ${successCount}/${appointmentIds.length} invoices`,
      results
    });
  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({ message: 'Failed to send invoices', error: error.message });
  }
});

module.exports = router;
