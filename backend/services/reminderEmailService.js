// backend/services/reminderEmailService.js
const nodemailer = require('nodemailer');

// Get transporter from email service or create new one
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured for reminders');
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

// Send appointment reminder email
async function sendAppointmentReminder(appointment, user, doctor) {
  const transport = getTransporter();
  if (!transport) {
    console.log('📧 Email not configured - skipping appointment reminder');
    return { success: false, reason: 'Email not configured' };
  }

  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const subject = `⏰ Appointment Reminder - Dr. ${doctor.name} Tomorrow`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: 600; color: #4b5563; width: 100px; }
        .detail-value { color: #1f2937; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 HealthSync</h1>
          <p>Appointment Reminder</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <div class="reminder-box">
            <strong>⏰ Reminder:</strong> You have an appointment tomorrow!
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div class="detail-row">
              <div class="detail-label">Doctor:</div>
              <div class="detail-value">Dr. ${doctor.name}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Date:</div>
              <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Time:</div>
              <div class="detail-value">${appointment.time}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Type:</div>
              <div class="detail-value">${appointment.consultationType === 'online' ? '🌐 Online' : '🏥 In-Person'}</div>
            </div>
          </div>
          ${appointment.consultationType === 'online' && appointment.googleMeetLink ? `
            <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin-bottom: 10px;">Join your online consultation:</p>
              <a href="${appointment.googleMeetLink}" style="background: white; color: #10b981; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Join Meeting</a>
            </div>
          ` : `
            <p style="color: #6b7280;">Please arrive 10 minutes before your scheduled time.</p>
          `}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html
    });
    console.log(`✅ Appointment reminder sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send appointment reminder:', error.message);
    return { success: false, error: error.message };
  }
}

// Send medicine reminder email
async function sendMedicineReminder(user, medicines) {
  const transport = getTransporter();
  if (!transport) {
    console.log('📧 Email not configured - skipping medicine reminder');
    return { success: false, reason: 'Email not configured' };
  }

  const subject = `💊 Medicine Reminder - Time to take your medicines`;
  
  const medicineList = medicines.map(m => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${m.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${m.dosage}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${m.time}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💊 Medicine Reminder</h1>
          <p>Time to take your medicines!</p>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">Here are your medicines for today:</p>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${medicineList}
            </tbody>
          </table>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <strong>💡 Tip:</strong> Take your medicines with water and after meals for better absorption.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HealthSync. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html
    });
    console.log(`✅ Medicine reminder sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send medicine reminder:', error.message);
    return { success: false, error: error.message };
  }
}

// Send water intake reminder
async function sendWaterReminder(user) {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  const subject = `💧 Hydration Reminder - Stay Healthy!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; text-align: center; }
        .water-icon { font-size: 60px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💧 Hydration Reminder</h1>
        </div>
        <div class="content">
          <div class="water-icon">🥤</div>
          <h2>Hi ${user.name}!</h2>
          <p style="color: #6b7280; font-size: 18px; margin: 20px 0;">
            Don't forget to drink water! Staying hydrated is essential for your health.
          </p>
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0;"><strong>Goal:</strong> 8 glasses (2 liters) per day</p>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">
            Benefits: Better energy, clearer skin, improved digestion, and enhanced brain function!
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HealthSync</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send health checkup reminder
async function sendHealthCheckupReminder(user, checkupType = 'Annual') {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'Email not configured' };

  const subject = `🩺 Health Checkup Reminder - ${checkupType} Checkup Due`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩺 Health Checkup Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name}! 👋</h2>
          <p style="color: #6b7280; margin: 20px 0;">
            It's time for your <strong>${checkupType} Health Checkup</strong>! Regular checkups help detect health issues early.
          </p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <strong>Why regular checkups matter:</strong>
            <ul style="color: #6b7280; margin-top: 10px;">
              <li>Early detection of diseases</li>
              <li>Monitor existing conditions</li>
              <li>Update vaccinations</li>
              <li>Get personalized health advice</li>
            </ul>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}" class="cta-button">
              Book Your Checkup Now
            </a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HealthSync</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendAppointmentReminder,
  sendMedicineReminder,
  sendWaterReminder,
  sendHealthCheckupReminder
};
