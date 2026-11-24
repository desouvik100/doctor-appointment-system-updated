const cron = require('node-cron');
const MedicineReminder = require('../models/MedicineReminder');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

async function sendMedicineReminderEmail(user, medicine, time) {
  const formattedTime = formatTime(time);
  
  const subject = `💊 Medicine Reminder - Time to take ${medicine.name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${medicine.color} 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 24px; }
        .content { padding: 30px; }
        .medicine-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid ${medicine.color}; }
        .medicine-name { font-size: 1.3rem; font-weight: 700; color: #1f2937; margin: 0 0 8px 0; }
        .medicine-dosage { font-size: 1.1rem; color: ${medicine.color}; font-weight: 600; margin: 0 0 8px 0; }
        .medicine-time { font-size: 0.95rem; color: #6b7280; }
        .btn { display: inline-block; background: ${medicine.color}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; }
        .notes { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 0.9rem; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💊 Medicine Reminder</h1>
          <p>It's time to take your medicine</p>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>This is a friendly reminder to take your medicine:</p>
          
          <div class="medicine-card">
            <p class="medicine-name">${medicine.name}</p>
            <p class="medicine-dosage">${medicine.dosage}</p>
            <p class="medicine-time">⏰ Scheduled for: ${formattedTime}</p>
          </div>
          
          ${medicine.notes ? `<div class="notes"><strong>📝 Notes:</strong> ${medicine.notes}</div>` : ''}
          
          <p style="margin-top: 20px; color: #6b7280;">
            Remember to take your medicine with water and as prescribed by your doctor.
          </p>
          
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">
              Open HealthSync
            </a>
          </center>
        </div>
        <div class="footer">
          <p>🏥 HealthSync - Your Healthcare Companion</p>
          <p>This is an automated reminder. Stay healthy!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Medicine Reminder - ${medicine.name}

Hello ${user.name},

It's time to take your medicine:

Medicine: ${medicine.name}
Dosage: ${medicine.dosage}
Time: ${formattedTime}
${medicine.notes ? `Notes: ${medicine.notes}` : ''}

Remember to take your medicine with water and as prescribed by your doctor.

- HealthSync Team
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
    console.log(`✅ Medicine reminder email sent to ${user.email} for ${medicine.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send medicine reminder email:`, error.message);
    return false;
  }
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

async function checkAndSendReminders() {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const medicines = await MedicineReminder.find({
      isActive: true,
      emailReminders: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: today } }
      ]
    }).populate('userId', 'name email');
    const medicinesForCurrentTime = medicines.filter(m => 
      Array.isArray(m.times) && m.times.includes(currentTime)
    );

    for (const medicine of medicinesForCurrentTime) {
      if (!medicine.userId || !medicine.userId.email) {
        continue;
      }
      const lastSent = medicine.lastEmailSent;
      if (lastSent && new Date(lastSent).toDateString() === today.toDateString()) {
        const lastSentTime = `${String(new Date(lastSent).getHours()).padStart(2, '0')}:${String(new Date(lastSent).getMinutes()).padStart(2, '0')}`;
        if (lastSentTime === currentTime) {
          continue; 
        }
      }
      const alreadyTaken = medicine.takenHistory.find(h => 
        new Date(h.date).toDateString() === today.toDateString() && 
        h.time === currentTime
      );

      if (alreadyTaken) {
        continue; 
      }
      const sent = await sendMedicineReminderEmail(medicine.userId, medicine, currentTime);
      
      if (sent) {
        medicine.lastEmailSent = now;
        await medicine.save();
      }
    }
  } catch (error) {
    console.error('❌ Error in medicine reminder check:', error);
  }
}

function initializeMedicineReminders() {
  console.log('💊 Initializing medicine reminder service...');
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
  });

  console.log('✅ Medicine reminder service initialized - checking every minute');
}

async function sendTestReminder(userId, medicineId) {
  try {
    const medicine = await MedicineReminder.findById(medicineId).populate('userId', 'name email');
    
    if (!medicine) {
      return { success: false, error: 'Medicine not found' };
    }

    const sent = await sendMedicineReminderEmail(medicine.userId, medicine, medicine.times[0]);
    
    return { success: sent, message: sent ? 'Test email sent' : 'Failed to send email' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeMedicineReminders,
  checkAndSendReminders,
  sendMedicineReminderEmail,
  sendTestReminder
};
