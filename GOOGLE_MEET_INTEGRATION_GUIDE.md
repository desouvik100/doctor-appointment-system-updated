# Google Meet Integration & Smart Time Selection Guide

## 🎯 Overview

This guide covers the complete implementation of:
- ✅ Automatic Google Meet link generation (18 minutes before appointment)
- ✅ Smart 1-minute interval time selection
- ✅ Real-time availability checking
- ✅ Automatic email notifications with Meet links
- ✅ Fallback to Jitsi Meet if Google API unavailable
- ✅ Test mode for development

---

## 📦 Features Implemented

### 1. **Automatic Google Meet Link Generation**
- Links are generated **18 minutes before** the appointment time
- Uses Google Calendar API with Meet integration
- Scheduled via `node-cron` background jobs
- Automatic fallback to Jitsi Meet if Google API fails

### 2. **Smart Time Selection (1-Minute Intervals)**
- Users can select any time with 1-minute precision
- Real-time availability checking
- Visual indicators for booked/available slots
- Quick-select buttons for 30-minute intervals

### 3. **Email Notifications**
- Automatic emails sent to both patient and doctor
- Includes Google Meet link, appointment details, and clinic info
- Professional HTML email templates
- Powered by Resend API

### 4. **Conflict Prevention**
- Exact minute-level booking validation
- Real-time availability API
- Prevents double-booking

### 5. **Test Mode**
- Skip Stripe payments during development
- Set `TEST_APPOINTMENT=true` in `.env`

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install googleapis google-auth-library node-cron
```

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `http://localhost:5005/api/google/callback`
   - Copy **Client ID** and **Client Secret**

5. Generate Refresh Token:
   ```bash
   # Use OAuth Playground: https://developers.google.com/oauthplayground/
   # 1. Select "Google Calendar API v3"
   # 2. Authorize APIs
   # 3. Exchange authorization code for tokens
   # 4. Copy the refresh token
   ```

### Step 3: Update Environment Variables

Add to `backend/.env`:

```env
# Google Meet / Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5005/api/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here

# Timezone Configuration
TIMEZONE=Asia/Kolkata

# Test Mode (skip Stripe payments)
TEST_APPOINTMENT=false
```

### Step 4: Start the Backend

```bash
cd backend
npm start
```

The scheduler will automatically:
- Initialize on server startup
- Scan for pending appointments
- Schedule Meet link generation
- Run hourly cleanup jobs

---

## 📋 API Endpoints

### Check Time Availability
```http
POST /api/appointments/check-availability
Content-Type: application/json

{
  "doctorId": "doctor_id_here",
  "date": "2024-12-01",
  "time": "14:30"
}

Response:
{
  "available": true,
  "message": "Time slot is available"
}
```

### Get Booked Times
```http
GET /api/appointments/booked-times/:doctorId/:date

Response:
{
  "bookedTimes": ["09:00", "10:30", "14:15"]
}
```

### Create Appointment
```http
POST /api/appointments
Content-Type: application/json

{
  "userId": "user_id",
  "doctorId": "doctor_id",
  "clinicId": "clinic_id",
  "date": "2024-12-01",
  "time": "14:30",
  "reason": "General checkup",
  "consultationType": "online"
}
```

---

## 🎨 Frontend Components

### SmartTimePicker Component

```jsx
import SmartTimePicker from './components/SmartTimePicker';

<SmartTimePicker
  doctorId={selectedDoctor._id}
  selectedDate={appointmentDate}
  onTimeSelect={(time) => setSelectedTime(time)}
  selectedTime={selectedTime}
/>
```

**Features:**
- Real-time availability checking
- Visual feedback (green = available, red = booked)
- Quick-select 30-minute interval buttons
- Custom time input with 1-minute precision

### AppointmentCard Component

```jsx
import AppointmentCard from './components/AppointmentCard';

<AppointmentCard appointment={appointmentData} />
```

**Features:**
- Displays appointment details
- Shows Google Meet link when generated
- "Join Meeting" button (opens 15 min before)
- Copy link functionality
- Countdown timer

---

## 🔄 How It Works

### Appointment Booking Flow

1. **User selects time** → SmartTimePicker checks availability
2. **Availability confirmed** → User books appointment
3. **Appointment created** → Scheduler registers the appointment
4. **18 minutes before** → Google Meet link generated automatically
5. **Email sent** → Both patient and doctor receive link
6. **15 minutes before** → "Join Meeting" button becomes active
7. **Meeting time** → Users can join via link

### Scheduler Logic

```javascript
// Trigger time calculation
const appointmentTime = new Date(appointment.date + ' ' + appointment.time);
const triggerTime = new Date(appointmentTime.getTime() - 18 * 60 * 1000);

// Schedule job
setTimeout(() => {
  generateGoogleMeetLink(appointment);
  sendEmailNotifications(appointment);
}, triggerTime - Date.now());
```

### Fallback Mechanism

If Google API fails or is not configured:
```javascript
// Automatic fallback to Jitsi Meet
const fallbackLink = `https://meet.jit.si/healthsync-${appointmentId}`;
```

---

## 🧪 Testing

### Test Appointment Creation

```bash
# Test with immediate Meet link generation
curl -X POST http://localhost:5005/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "doctorId": "doctor_id",
    "clinicId": "clinic_id",
    "date": "2024-12-01T10:00:00Z",
    "time": "14:30",
    "reason": "Test consultation",
    "consultationType": "online"
  }'
```

### Test Availability Check

```bash
curl -X POST http://localhost:5005/api/appointments/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor_id",
    "date": "2024-12-01",
    "time": "14:30"
  }'
```

### Test Email Service

```javascript
// In backend console or test file
const { sendAppointmentEmail } = require('./services/emailService');

await sendAppointmentEmail(appointment, 'patient');
await sendAppointmentEmail(appointment, 'doctor');
```

---

## 🔧 Configuration Options

### Scheduler Settings

Edit `backend/services/appointmentScheduler.js`:

```javascript
// Change trigger time (default: 18 minutes)
const triggerTime = new Date(appointmentDate.getTime() - 18 * 60 * 1000);

// Change cleanup interval (default: hourly)
cron.schedule('0 * * * *', checkMissedAppointments);
```

### Time Picker Settings

Edit `frontend/src/components/SmartTimePicker.js`:

```javascript
// Change working hours
const startHour = 9;  // 9 AM
const endHour = 18;   // 6 PM

// Change quick-select interval
for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
```

---

## 📧 Email Template Customization

Edit `backend/services/emailService.js`:

```javascript
// Customize email content
const subject = `Appointment Confirmed - Dr. ${doctorName}`;
const html = `<!-- Your custom HTML template -->`;
```

---

## 🐛 Troubleshooting

### Issue: Google Meet links not generating

**Solution:**
1. Check Google API credentials in `.env`
2. Verify refresh token is valid
3. Check server logs for errors
4. Fallback to Jitsi will activate automatically

### Issue: Emails not sending

**Solution:**
1. Verify `RESEND_API_KEY` in `.env`
2. Check `RESEND_FROM_EMAIL` is configured
3. Review email service logs

### Issue: Time slots showing as available when booked

**Solution:**
1. Clear browser cache
2. Check database for conflicting appointments
3. Verify date format consistency

### Issue: Scheduler not running

**Solution:**
1. Check server startup logs
2. Verify `initializeScheduler()` is called
3. Check for MongoDB connection issues

---

## 🔐 Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Validate all user inputs** on backend
4. **Implement rate limiting** for availability checks
5. **Use HTTPS** in production
6. **Sanitize email content** to prevent XSS

---

## 📊 Database Schema Updates

### Appointment Model Fields

```javascript
{
  // Existing fields...
  
  // Google Meet Integration
  googleMeetLink: String,
  googleEventId: String,
  meetLinkGenerated: Boolean,
  meetLinkGeneratedAt: Date,
  meetLinkSentToPatient: Boolean,
  meetLinkSentToDoctor: Boolean
}
```

---

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Production URLs
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/google/callback
GOOGLE_REFRESH_TOKEN=prod_refresh_token

# Email (production)
RESEND_API_KEY=prod_resend_key
RESEND_FROM_EMAIL=Doctor Appointment <no-reply@yourdomain.com>

# Disable test mode
TEST_APPOINTMENT=false
```

### Deployment Checklist

- [ ] Update all environment variables
- [ ] Test Google Meet generation
- [ ] Test email delivery
- [ ] Verify scheduler is running
- [ ] Test time availability checks
- [ ] Monitor server logs
- [ ] Set up error alerting

---

## 📈 Performance Optimization

1. **Cache booked times** for frequently accessed dates
2. **Use database indexes** on doctorId, date, time
3. **Implement connection pooling** for MongoDB
4. **Rate limit** availability check API
5. **Use CDN** for frontend assets

---

## 🎓 Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [Resend API Documentation](https://resend.com/docs)
- [Jitsi Meet Documentation](https://jitsi.github.io/handbook/)

---

## 💡 Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Calendar sync (iCal, Outlook)
- [ ] Recurring appointments
- [ ] Appointment reminders (24h, 1h before)
- [ ] Video consultation recording
- [ ] Multi-language support
- [ ] Mobile app integration

---

## 📞 Support

For issues or questions:
- Check server logs: `backend/logs/`
- Review error messages in browser console
- Test API endpoints with Postman
- Verify environment variables are set correctly

---

**✅ Implementation Complete!**

Your appointment system now has:
- ✅ Automatic Google Meet integration
- ✅ Smart 1-minute time selection
- ✅ Real-time availability checking
- ✅ Professional email notifications
- ✅ Robust fallback mechanisms
- ✅ Production-ready code

Happy coding! 🚀
