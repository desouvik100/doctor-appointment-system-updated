// Admin Email Service - Analytics, Alerts, and Notifications
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured for admin emails');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  return transporter;
}

const adminEmail = () => process.env.ADMIN_EMAIL || 'admin@healthsyncpro.in';

// ============================================
// 1. DAILY/WEEKLY ANALYTICS EMAIL REPORT
// ============================================
async function sendAnalyticsReport(period = 'daily') {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  try {
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Gather analytics data
    const [
      totalUsers,
      newUsers,
      totalDoctors,
      newDoctors,
      totalAppointments,
      newAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'patient', createdAt: { $gte: startDate } }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ createdAt: { $gte: startDate } }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: startDate } }),
      Appointment.countDocuments({ status: 'completed', createdAt: { $gte: startDate } }),
      Appointment.countDocuments({ status: 'cancelled', createdAt: { $gte: startDate } }),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    // Calculate revenue
    const revenueData = await Appointment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const revenue = revenueData[0]?.total || 0;

    const periodLabel = period === 'daily' ? 'Daily' : 'Weekly';
    const dateRange = period === 'daily' 
      ? startDate.toLocaleDateString('en-IN')
      : `${startDate.toLocaleDateString('en-IN')} - ${now.toLocaleDateString('en-IN')}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header p { color: rgba(255,255,255,0.8); margin: 10px 0 0 0; }
          .content { padding: 30px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
          .stat-value { font-size: 32px; font-weight: 700; color: #1e293b; }
          .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; }
          .stat-change { font-size: 12px; margin-top: 5px; }
          .stat-change.positive { color: #10b981; }
          .stat-change.negative { color: #ef4444; }
          .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 25px 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .revenue-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center; color: white; margin: 20px 0; }
          .revenue-value { font-size: 36px; font-weight: 700; }
          .revenue-label { font-size: 14px; opacity: 0.9; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${periodLabel} Analytics Report</h1>
            <p>${dateRange}</p>
          </div>
          <div class="content">
            <div class="revenue-box">
              <div class="revenue-value">₹${revenue.toLocaleString('en-IN')}</div>
              <div class="revenue-label">${periodLabel} Revenue (${completedAppointments} completed appointments)</div>
            </div>

            <div class="section-title">👥 Users & Doctors</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${totalUsers}</div>
                <div class="stat-label">Total Patients</div>
                <div class="stat-change positive">+${newUsers} new</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${totalDoctors}</div>
                <div class="stat-label">Total Doctors</div>
                <div class="stat-change positive">+${newDoctors} new</div>
              </div>
            </div>

            <div class="section-title">📅 Appointments</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${newAppointments}</div>
                <div class="stat-label">New Bookings</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${completedAppointments}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${cancelledAppointments}</div>
                <div class="stat-label">Cancelled</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${pendingAppointments}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>

            <div class="section-title">📈 Summary</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Total Appointments (All Time)</td>
                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">${totalAppointments}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Completion Rate</td>
                <td style="padding: 12px 0; color: #10b981; font-weight: 600; text-align: right;">${newAppointments > 0 ? Math.round((completedAppointments / newAppointments) * 100) : 0}%</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b;">Average Revenue per Appointment</td>
                <td style="padding: 12px 0; color: #1e293b; font-weight: 600; text-align: right;">₹${completedAppointments > 0 ? Math.round(revenue / completedAppointments).toLocaleString('en-IN') : 0}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HealthSync Pro. All rights reserved.</p>
            <p>This is an automated ${periodLabel.toLowerCase()} report.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transport.sendMail({
      from: `"HealthSync Pro Analytics" <${process.env.EMAIL_USER}>`,
      to: adminEmail(),
      subject: `📊 ${periodLabel} Analytics Report - ${dateRange}`,
      html
    });

    console.log(`✅ ${periodLabel} analytics report sent to ${adminEmail()}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending analytics report:', error);
    return { success: false, error: error.message };
  }
}


// ============================================
// 2. SYSTEM HEALTH ALERTS
// ============================================
async function sendSystemHealthAlert(alertType, details) {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  try {
    const alertConfig = {
      'database_error': { emoji: '🔴', title: 'Database Connection Error', severity: 'critical', color: '#ef4444' },
      'high_error_rate': { emoji: '🟠', title: 'High Error Rate Detected', severity: 'warning', color: '#f59e0b' },
      'server_restart': { emoji: '🔵', title: 'Server Restarted', severity: 'info', color: '#3b82f6' },
      'memory_warning': { emoji: '🟡', title: 'High Memory Usage', severity: 'warning', color: '#f59e0b' },
      'payment_failure': { emoji: '🔴', title: 'Payment System Error', severity: 'critical', color: '#ef4444' },
      'security_breach': { emoji: '🚨', title: 'Security Alert', severity: 'critical', color: '#dc2626' },
      'api_timeout': { emoji: '🟠', title: 'API Timeout Detected', severity: 'warning', color: '#f59e0b' },
      'backup_complete': { emoji: '✅', title: 'Backup Completed', severity: 'info', color: '#10b981' }
    };

    const config = alertConfig[alertType] || { emoji: '⚠️', title: 'System Alert', severity: 'warning', color: '#f59e0b' };
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: ${config.color}; padding: 25px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .content { padding: 25px; }
          .alert-box { background: #fef2f2; border: 1px solid ${config.color}; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .severity { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: ${config.color}; color: white; }
          .details { background: #f8fafc; border-radius: 8px; padding: 15px; margin-top: 15px; }
          .details pre { margin: 0; white-space: pre-wrap; font-size: 13px; color: #475569; }
          .footer { background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.emoji} ${config.title}</h1>
          </div>
          <div class="content">
            <p><span class="severity">${config.severity}</span></p>
            <p style="color: #475569; margin-top: 15px;"><strong>Time:</strong> ${timestamp}</p>
            
            <div class="details">
              <strong>Details:</strong>
              <pre>${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}</pre>
            </div>
            
            ${config.severity === 'critical' ? `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <strong style="color: #92400e;">⚠️ Action Required</strong>
              <p style="color: #78350f; margin: 5px 0 0 0; font-size: 14px;">This is a critical alert. Please investigate immediately.</p>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>HealthSync Pro System Monitor</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transport.sendMail({
      from: `"HealthSync Pro Alerts" <${process.env.EMAIL_USER}>`,
      to: adminEmail(),
      subject: `${config.emoji} [${config.severity.toUpperCase()}] ${config.title}`,
      html
    });

    console.log(`✅ System health alert sent: ${alertType}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending system health alert:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 3. NEW DOCTOR REGISTRATION APPROVAL EMAIL
// ============================================
async function sendNewDoctorRegistrationAlert(doctor) {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  try {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const approvalLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 25px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .content { padding: 25px; }
          .doctor-card { background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
          .doctor-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 700; margin: 0 auto 15px; }
          .doctor-name { font-size: 20px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 5px; }
          .doctor-specialty { font-size: 14px; color: #6366f1; text-align: center; margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .info-label { color: #64748b; font-size: 14px; }
          .info-value { color: #1e293b; font-weight: 500; font-size: 14px; }
          .action-btn { display: block; width: 100%; padding: 15px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; text-align: center; border-radius: 10px; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👨‍⚕️ New Doctor Registration</h1>
          </div>
          <div class="content">
            <p style="color: #475569; margin-bottom: 20px;">A new doctor has registered and is awaiting approval.</p>
            
            <div class="doctor-card">
              <div class="doctor-avatar">${doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D'}</div>
              <div class="doctor-name">Dr. ${doctor.name || 'Unknown'}</div>
              <div class="doctor-specialty">${doctor.specialization || 'General'}</div>
              
              <div class="info-row">
                <span class="info-label">📧 Email</span>
                <span class="info-value">${doctor.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📱 Phone</span>
                <span class="info-value">${doctor.phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">🏥 Clinic</span>
                <span class="info-value">${doctor.clinicName || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">💰 Consultation Fee</span>
                <span class="info-value">₹${doctor.consultationFee || 0}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📍 Location</span>
                <span class="info-value">${doctor.location || 'N/A'}</span>
              </div>
              <div class="info-row" style="border-bottom: none;">
                <span class="info-label">🕐 Registered</span>
                <span class="info-value">${timestamp}</span>
              </div>
            </div>
            
            <a href="${approvalLink}" class="action-btn">Review & Approve in Dashboard →</a>
          </div>
          <div class="footer">
            <p>HealthSync Pro Admin Notification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transport.sendMail({
      from: `"HealthSync Pro" <${process.env.EMAIL_USER}>`,
      to: adminEmail(),
      subject: `👨‍⚕️ New Doctor Registration: Dr. ${doctor.name || 'Unknown'} - Approval Required`,
      html
    });

    console.log(`✅ New doctor registration alert sent for: ${doctor.name}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending doctor registration alert:', error);
    return { success: false, error: error.message };
  }
}


// ============================================
// 4. REVENUE SUMMARY EMAIL
// ============================================
async function sendRevenueSummary(period = 'monthly') {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  try {
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get revenue by doctor
    const revenueByDoctor = await Appointment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: '$doctorId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Populate doctor names
    const doctorIds = revenueByDoctor.map(r => r._id);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select('name specialization');
    const doctorMap = {};
    doctors.forEach(d => { doctorMap[d._id.toString()] = d; });

    // Get daily revenue for chart
    const dailyRevenue = await Appointment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Calculate totals
    const totalRevenue = revenueByDoctor.reduce((sum, r) => sum + r.total, 0);
    const totalAppointments = revenueByDoctor.reduce((sum, r) => sum + r.count, 0);
    const platformFee = totalRevenue * (parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || 7) / 100);
    const gst = platformFee * (parseFloat(process.env.GST_PERCENTAGE || 18) / 100);

    const periodLabel = period === 'weekly' ? 'Weekly' : 'Monthly';
    const dateRange = `${startDate.toLocaleDateString('en-IN')} - ${now.toLocaleDateString('en-IN')}`;

    // Generate doctor rows
    let doctorRows = '';
    revenueByDoctor.forEach((r, i) => {
      const doc = doctorMap[r._id?.toString()] || { name: 'Unknown', specialization: 'N/A' };
      doctorRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; color: #64748b;">${i + 1}</td>
          <td style="padding: 12px 8px;">
            <div style="font-weight: 600; color: #1e293b;">Dr. ${doc.name}</div>
            <div style="font-size: 12px; color: #64748b;">${doc.specialization}</div>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #1e293b;">${r.count}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #10b981;">₹${r.total.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
          .content { padding: 30px; }
          .revenue-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
          .revenue-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
          .revenue-card.highlight { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; grid-column: span 2; }
          .revenue-value { font-size: 28px; font-weight: 700; }
          .revenue-label { font-size: 13px; opacity: 0.8; margin-top: 5px; }
          .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 25px 0 15px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; padding: 12px 8px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; }
          .breakdown { background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 20px; }
          .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .breakdown-row:last-child { border-bottom: none; font-weight: 700; color: #10b981; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 ${periodLabel} Revenue Summary</h1>
            <p>${dateRange}</p>
          </div>
          <div class="content">
            <div class="revenue-cards">
              <div class="revenue-card highlight">
                <div class="revenue-value">₹${totalRevenue.toLocaleString('en-IN')}</div>
                <div class="revenue-label">Total Revenue</div>
              </div>
              <div class="revenue-card">
                <div class="revenue-value" style="color: #1e293b;">${totalAppointments}</div>
                <div class="revenue-label" style="color: #64748b;">Completed Appointments</div>
              </div>
              <div class="revenue-card">
                <div class="revenue-value" style="color: #6366f1;">₹${totalAppointments > 0 ? Math.round(totalRevenue / totalAppointments).toLocaleString('en-IN') : 0}</div>
                <div class="revenue-label" style="color: #64748b;">Avg. per Appointment</div>
              </div>
            </div>

            <div class="section-title">🏆 Top Performing Doctors</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Doctor</th>
                  <th style="text-align: center;">Appointments</th>
                  <th style="text-align: right;">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${doctorRows || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">No data available</td></tr>'}
              </tbody>
            </table>

            <div class="breakdown">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 15px;">💳 Platform Revenue Breakdown</div>
              <div class="breakdown-row">
                <span style="color: #64748b;">Gross Revenue</span>
                <span style="color: #1e293b;">₹${totalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div class="breakdown-row">
                <span style="color: #64748b;">Platform Fee (${process.env.PLATFORM_FEE_PERCENTAGE || 7}%)</span>
                <span style="color: #1e293b;">₹${Math.round(platformFee).toLocaleString('en-IN')}</span>
              </div>
              <div class="breakdown-row">
                <span style="color: #64748b;">GST on Platform Fee (${process.env.GST_PERCENTAGE || 18}%)</span>
                <span style="color: #1e293b;">₹${Math.round(gst).toLocaleString('en-IN')}</span>
              </div>
              <div class="breakdown-row">
                <span>Net Platform Earnings</span>
                <span>₹${Math.round(platformFee - gst).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} HealthSync Pro. All rights reserved.</p>
            <p>This is an automated ${periodLabel.toLowerCase()} revenue report.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transport.sendMail({
      from: `"HealthSync Pro Finance" <${process.env.EMAIL_USER}>`,
      to: adminEmail(),
      subject: `💰 ${periodLabel} Revenue Summary: ₹${totalRevenue.toLocaleString('en-IN')} - ${dateRange}`,
      html
    });

    console.log(`✅ ${periodLabel} revenue summary sent to ${adminEmail()}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending revenue summary:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SCHEDULED JOBS
// ============================================
function initializeScheduledEmails() {
  // Daily analytics report at 8 AM IST
  cron.schedule('0 8 * * *', async () => {
    console.log('📊 Sending daily analytics report...');
    await sendAnalyticsReport('daily');
  }, { timezone: 'Asia/Kolkata' });

  // Weekly analytics report on Monday at 9 AM IST
  cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Sending weekly analytics report...');
    await sendAnalyticsReport('weekly');
  }, { timezone: 'Asia/Kolkata' });

  // Weekly revenue summary on Sunday at 10 AM IST
  cron.schedule('0 10 * * 0', async () => {
    console.log('💰 Sending weekly revenue summary...');
    await sendRevenueSummary('weekly');
  }, { timezone: 'Asia/Kolkata' });

  // Monthly revenue summary on 1st of each month at 10 AM IST
  cron.schedule('0 10 1 * *', async () => {
    console.log('💰 Sending monthly revenue summary...');
    await sendRevenueSummary('monthly');
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Admin email schedules initialized');
  console.log('   📊 Daily report: 8:00 AM IST');
  console.log('   📊 Weekly report: Monday 9:00 AM IST');
  console.log('   💰 Weekly revenue: Sunday 10:00 AM IST');
  console.log('   💰 Monthly revenue: 1st of month 10:00 AM IST');
}

module.exports = {
  sendAnalyticsReport,
  sendSystemHealthAlert,
  sendNewDoctorRegistrationAlert,
  sendRevenueSummary,
  initializeScheduledEmails
};
