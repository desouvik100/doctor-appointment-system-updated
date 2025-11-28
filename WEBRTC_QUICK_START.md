# 🚀 WebRTC Video Consultation - Quick Start

## ⚡ 3-Minute Setup

### 1. Dependencies Installed ✅
All required packages are already installed:
- Backend: `socket.io`
- Frontend: `socket.io-client`, `simple-peer`

### 2. Start Servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 3. Add to Your Dashboard

**Option A: Use the Ready-Made Button**

```javascript
import ConsultationButton from './ConsultationButton';

// In your appointment card
<ConsultationButton 
  appointment={appointment} 
  user={user} 
  onComplete={() => fetchAppointments()}
/>
```

**Option B: Custom Integration**

```javascript
import { useState } from 'react';
import OnlineConsultation from './OnlineConsultation';

function YourComponent() {
  const [showConsultation, setShowConsultation] = useState(false);
  
  return (
    <>
      {/* Your button */}
      <button onClick={() => setShowConsultation(true)}>
        <i className="fas fa-video"></i> Start Consultation
      </button>
      
      {/* Consultation modal */}
      {showConsultation && (
        <OnlineConsultation
          appointmentId={appointment._id}
          user={user}
          onClose={() => setShowConsultation(false)}
        />
      )}
    </>
  );
}
```

### 4. Test It!

1. **Book an online consultation** (consultationType: 'online')
2. **Approve the appointment** (status: 'approved')
3. **Open two browser windows**
4. **Click "Start Consultation" in both**
5. **Allow camera/microphone permissions**
6. **See each other and talk!** 🎉

## 🎯 Key Points

- ✅ Only works for **online consultations** (consultationType: 'online')
- ✅ Appointment must be **approved** (status: 'approved')
- ✅ Available **15 minutes before** scheduled time
- ✅ Automatically saves **duration** to database
- ✅ **Audio-only fallback** if camera unavailable

## 🔧 Button Visibility Logic

The button automatically:
- ❌ Hides for in-person appointments
- ❌ Disables if not approved
- ❌ Disables if too early (shows countdown)
- ✅ Enables 15 minutes before appointment
- ❌ Disables 60 minutes after appointment

## 📱 What Users See

### Before 15-Minute Window
```
[🎥 Available in 23 min] (disabled)
```

### During Window
```
[🎥 Start Consultation] (enabled, green)
```

### After Window
```
[🎥 Window closed] (disabled)
```

## 🎨 Features

- **Video**: HD quality, auto-adjusts to connection
- **Audio**: Echo cancellation, noise suppression
- **Controls**: Mute, camera off, end call
- **UI**: Modern healthcare design, responsive
- **Fallback**: Audio-only if video fails
- **Tracking**: Duration saved to database

## 🐛 Quick Troubleshooting

**No video?**
- Allow browser permissions
- Check camera not in use

**Can't connect?**
- Both users must be in same appointment
- Check backend is running
- Verify appointment is approved

**Button disabled?**
- Check appointment status is 'approved'
- Wait for 15-minute window
- Verify consultationType is 'online'

## 📚 Full Documentation

- **Complete Guide**: `WEBRTC_SETUP_COMPLETE.md`
- **Technical Details**: `WEBRTC_CONSULTATION_IMPLEMENTATION.md`
- **Integration Examples**: `WEBRTC_INTEGRATION_GUIDE.md`

## ✨ That's It!

You now have a fully functional video consultation system. Just add the button to your UI and start testing!

**Need help?** Check the documentation files above for detailed information.
