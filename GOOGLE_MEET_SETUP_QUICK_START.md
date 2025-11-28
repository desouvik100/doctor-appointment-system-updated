# 🚀 Google Meet Integration - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```bash
cd backend
npm install googleapis google-auth-library node-cron
```

### Step 2: Update Environment Variables (2 minutes)

Add these lines to `backend/.env`:

```env
# Google Meet Configuration (Optional - will use Jitsi fallback if not set)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5005/api/google/callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here

# Timezone
TIMEZONE=Asia/Kolkata

# Test Mode (skip Stripe payments)
TEST_APPOINTMENT=false
```

**Note:** If you don't configure Google credentials, the system will automatically use **Jitsi Meet** as a fallback. This works perfectly for testing!

### Step 3: Start Backend (1 minute)

```bash
cd backend
npm start
```

You should see:
```
✅ Server running on port 5005
✅ MongoDB Connected
🚀 Initializing appointment scheduler...
✅ Appointment scheduler initialized successfully
```

### Step 4: Test the Integration (1 minute)

```bash
node test-google-meet-integration.js
```

---

## 🎯 What's New?

### For Patients:
1. **Smart Time Picker** - Select any time with 1-minute precision
2. **Real-time Availability** - See which times are booked instantly
3. **Automatic Meet Links** - Get Google Meet link 18 minutes before appointment
4. **Email Notifications** - Receive appointment details and meeting link via email
5. **Join Meeting Button** - One-click access to video consultation

### For Doctors:
1. **Automatic Scheduling** - Meet links generated automatically
2. **Email Notifications** - Get notified about new appointments with meeting links
3. **No Manual Setup** - Everything happens automatically

### For Admins:
1. **Conflict Prevention** - No double-booking possible
2. **Automatic Fallback** - Uses Jitsi if Google API unavailable
3. **Test Mode** - Skip payments during development

---

## 📱 How to Use (Patient Side)

### Booking an Appointment:

1. **Select Doctor** from the list
2. **Choose Date** using the calendar
3. **Pick Time** using the smart time picker:
   - Type exact time (e.g., 14:37)
   - Or click quick-select buttons (30-min intervals)
   - Green = Available ✅
   - Red = Booked ❌
4. **Select Consultation Type**: Online or In-Person
5. **Click Book Appointment**

### Joining the Meeting:

1. Go to **My Appointments**
2. Find your upcoming appointment
3. **18 minutes before** appointment time:
   - Google Meet link appears automatically
   - Email sent with meeting details
4. **15 minutes before** appointment time:
   - "Join Meeting" button becomes active
5. **Click "Join Meeting"** to start consultation

---

## 🔧 Configuration Options

### Change Meeting Generation Time

Edit `backend/services/appointmentScheduler.js`:

```javascript
// Default: 18 minutes before
const triggerTime = new Date(appointmentDate.getTime() - 18 * 60 * 1000);

// Change to 30 minutes before:
const triggerTime = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
```

### Change Working Hours

Edit `frontend/src/components/SmartTimePicker.js`:

```javascript
const startHour = 9;  // Start at 9 AM
const endHour = 18;   // End at 6 PM
```

### Enable Test Mode (Skip Payments)

In `backend/.env`:

```env
TEST_APPOINTMENT=true
```

---

## 🎨 Frontend Integration

### Add Smart Time Picker to Your Booking Form:

```jsx
import SmartTimePicker from './components/SmartTimePicker';

function BookingForm() {
  const [selectedTime, setSelectedTime] = useState('');
  
  return (
    <SmartTimePicker
      doctorId={selectedDoctor._id}
      selectedDate={appointmentDate}
      onTimeSelect={(time) => setSelectedTime(time)}
      selectedTime={selectedTime}
    />
  );
}
```

### Display Appointments with Meet Links:

```jsx
import AppointmentCard from './components/AppointmentCard';

function MyAppointments() {
  return (
    <div>
      {appointments.map(appointment => (
        <AppointmentCard 
          key={appointment._id} 
          appointment={appointment} 
        />
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Scheduler initializes successfully
- [ ] Can check time availability
- [ ] Can create online appointment
- [ ] Appointment appears in database
- [ ] Meet link generates (or fallback to Jitsi)
- [ ] Emails sent successfully
- [ ] "Join Meeting" button works
- [ ] Time picker shows booked slots correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Google API not configured"

**Solution:** This is normal! The system will use Jitsi Meet automatically.

To use Google Meet:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Create OAuth credentials
4. Add credentials to `.env`

### Issue: Emails not sending

**Solution:** 
1. Check `RESEND_API_KEY` in `.env`
2. Verify `RESEND_FROM_EMAIL` is set
3. Check server logs for errors

### Issue: Time slots not updating

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify backend is running

### Issue: "Join Meeting" button disabled

**Solution:**
- Button activates 15 minutes before appointment
- Check system time is correct
- Verify appointment time is in the future

---

## 📊 Database Changes

New fields added to Appointment model:

```javascript
{
  googleMeetLink: String,        // Google Meet URL
  googleEventId: String,         // Calendar event ID
  meetLinkGenerated: Boolean,    // Generation status
  meetLinkGeneratedAt: Date,     // When generated
  meetLinkSentToPatient: Boolean,// Email sent to patient
  meetLinkSentToDoctor: Boolean  // Email sent to doctor
}
```

**No migration needed** - fields are added automatically!

---

## 🚀 Production Deployment

### Before deploying:

1. **Update environment variables** with production values
2. **Get production Google OAuth credentials**
3. **Configure production email settings**
4. **Set TEST_APPOINTMENT=false**
5. **Test thoroughly in staging environment**

### Production `.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
GOOGLE_REDIRECT_URI=https://api.your-domain.com/api/google/callback
GOOGLE_REFRESH_TOKEN=prod_refresh_token

RESEND_API_KEY=prod_resend_key
RESEND_FROM_EMAIL=Doctor Appointment <no-reply@your-domain.com>

TEST_APPOINTMENT=false
```

---

## 📈 Performance Tips

1. **Cache booked times** for frequently accessed dates
2. **Use database indexes** on doctorId + date + time
3. **Rate limit** availability check API
4. **Monitor scheduler** logs for issues
5. **Set up error alerts** for failed Meet link generation

---

## 🎓 Learn More

- **Full Documentation:** See `GOOGLE_MEET_INTEGRATION_GUIDE.md`
- **API Reference:** Check backend routes in `appointmentRoutes.js`
- **Component Docs:** Review component files for props and usage

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Server starts with "Appointment scheduler initialized"
2. ✅ Time picker shows real-time availability
3. ✅ Appointments create successfully
4. ✅ Meet links appear 18 minutes before appointment
5. ✅ Emails arrive with meeting details
6. ✅ "Join Meeting" button works
7. ✅ No double-booking possible

---

## 🎉 You're All Set!

Your appointment system now has:
- ✅ Automatic Google Meet integration
- ✅ Smart 1-minute time selection
- ✅ Real-time conflict prevention
- ✅ Professional email notifications
- ✅ Robust fallback mechanisms

**Start booking appointments and enjoy the seamless experience!** 🚀

---

## 💬 Need Help?

1. Check server logs: `backend/logs/`
2. Review browser console for errors
3. Test API with Postman
4. Verify environment variables
5. Check MongoDB connection

**Happy coding!** 👨‍💻👩‍💻
