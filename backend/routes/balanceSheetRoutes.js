const express = require('express');
const Appointment = require('../models/Appointment');
const { authenticate, checkRole } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * GET /api/balance-sheet/summary
 * Get financial summary for balance sheet (Admin only)
 */
router.get('/summary', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    
    // Calculate date range
    let start, end;
    const now = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'today':
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date();
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          end = new Date();
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date();
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date();
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date();
      }
    }

    // Platform fee percentage (5%)
    const PLATFORM_FEE_PERCENT = 5;

    // Get all completed appointments in date range
    const completedAppointments = await Appointment.find({
      status: 'completed',
      date: { $gte: start, $lte: end }
    }).populate('doctorId', 'name');

    // Get all appointments (for stats)
    const allAppointments = await Appointment.find({
      date: { $gte: start, $lte: end }
    });

    // Calculate totals
    const totalRevenue = completedAppointments.reduce((sum, apt) => 
      sum + (apt.amount || apt.consultationFee || 0), 0);
    
    const platformFees = Math.round(totalRevenue * PLATFORM_FEE_PERCENT / 100);
    const doctorPayouts = totalRevenue - platformFees;

    // Revenue by payment method
    const revenueByMethod = completedAppointments.reduce((acc, apt) => {
      const method = apt.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + (apt.amount || apt.consultationFee || 0);
      return acc;
    }, {});

    // Revenue by consultation type
    const revenueByType = completedAppointments.reduce((acc, apt) => {
      const type = apt.consultationType || 'in_person';
      acc[type] = (acc[type] || 0) + (apt.amount || apt.consultationFee || 0);
      return acc;
    }, {});

    // Revenue by doctor (top 10)
    const revenueByDoctor = {};
    completedAppointments.forEach(apt => {
      const doctorName = apt.doctorId?.name || apt.doctorName || 'Unknown';
      revenueByDoctor[doctorName] = (revenueByDoctor[doctorName] || 0) + (apt.amount || apt.consultationFee || 0);
    });
    const topDoctors = Object.entries(revenueByDoctor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue, payout: Math.round(revenue * (100 - PLATFORM_FEE_PERCENT) / 100) }));

    // Daily revenue trend
    const dailyRevenue = {};
    completedAppointments.forEach(apt => {
      const day = new Date(apt.date).toISOString().split('T')[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (apt.amount || apt.consultationFee || 0);
    });
    const revenueTrend = Object.entries(dailyRevenue)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date, amount }));

    // Appointment stats
    const appointmentStats = {
      total: allAppointments.length,
      completed: allAppointments.filter(a => a.status === 'completed').length,
      cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
      pending: allAppointments.filter(a => ['pending', 'confirmed', 'scheduled'].includes(a.status)).length
    };

    // Refunds (cancelled appointments that were paid)
    const refunds = allAppointments
      .filter(a => a.status === 'cancelled' && a.paymentStatus === 'refunded')
      .reduce((sum, apt) => sum + (apt.amount || 0), 0);

    res.json({
      success: true,
      period: { start, end, label: period },
      summary: {
        totalRevenue,
        platformFees,
        doctorPayouts,
        refunds,
        netRevenue: platformFees - refunds,
        platformFeePercent: PLATFORM_FEE_PERCENT
      },
      breakdown: {
        byPaymentMethod: revenueByMethod,
        byConsultationType: revenueByType,
        topDoctors
      },
      appointments: appointmentStats,
      trend: revenueTrend
    });

  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate balance sheet', error: error.message });
  }
});

/**
 * GET /api/balance-sheet/export
 * Export balance sheet as CSV
 */
router.get('/export', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const appointments = await Appointment.find({
      status: 'completed',
      date: { $gte: start, $lte: end }
    }).populate('doctorId', 'name').populate('userId', 'name email').sort({ date: -1 });

    const PLATFORM_FEE_PERCENT = 5;

    // CSV headers
    const headers = ['Date', 'Patient', 'Doctor', 'Type', 'Amount', 'Platform Fee (5%)', 'Doctor Payout', 'Payment Method', 'Status'];
    
    const rows = appointments.map(apt => {
      const amount = apt.amount || apt.consultationFee || 0;
      const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
      return [
        new Date(apt.date).toLocaleDateString('en-IN'),
        apt.userId?.name || apt.patientName || 'N/A',
        apt.doctorId?.name || apt.doctorName || 'N/A',
        apt.consultationType || 'in_person',
        amount,
        platformFee,
        amount - platformFee,
        apt.paymentMethod || 'cash',
        apt.status
      ];
    });

    // Add totals row
    const totalAmount = appointments.reduce((sum, apt) => sum + (apt.amount || apt.consultationFee || 0), 0);
    const totalPlatformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT / 100);
    rows.push(['', '', '', 'TOTAL', totalAmount, totalPlatformFee, totalAmount - totalPlatformFee, '', '']);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=balance-sheet-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Export balance sheet error:', error);
    res.status(500).json({ success: false, message: 'Failed to export', error: error.message });
  }
});

module.exports = router;
