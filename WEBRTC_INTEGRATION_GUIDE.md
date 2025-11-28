# WebRTC Consultation - Quick Integration Guide

## ✅ Installation Complete

All dependencies have been installed and components created. The WebRTC consultation feature is ready to use!

## How to Use

### For Patients

1. **Book an Online Consultation**
   - Select a doctor
   - Choose "Online" consultation type
   - Complete booking and payment

2. **Join Consultation**
   - Go to your appointments
   - Click "Join Consultation" button (available 15 minutes before scheduled time)
   - Allow camera/microphone permissions
   - Wait for doctor to join

3. **During Consultation**
   - Use controls to mute/unmute, turn camera on/off
   - Click "End Call" when finished

### For Doctors

Same process - join from your dashboard when appointment time arrives.

## Integration with Existing Components

### PatientDashboard Integration

The `OnlineConsultation` component already integrates with `VideoConsultation`. To add a "Start Consultation" button to your appointments list:

```javascript
// In your appointment card/list
{appointment.consultationType === 'online' && appointment.status === 'approved' && (
  <button 
    className="btn btn-primary"
    onClick={() => {
      // Open OnlineConsultation component
      setSelectedAppointment(appointment);
      setShowConsultation(true);
    }}
  >
    <i className="fas fa-video me-2"></i>
    Start Consultation
  </button>
)}

// Then render the consultation modal
{showConsultation && selectedAppointment && (
  <OnlineConsultation
    appointmentId={selectedAppointment._id}
    user={user}
    onClose={() => {
      setShowConsultation(false);
      setSelectedAppointment(null);
      fetchAppointments(); // Refresh appointments
    }}
  />
)}
```

### DoctorDashboard Integration

Same pattern - add button to doctor's appointment list:

```javascript
{appointment.consultationType === 'online' && appointment.status === 'approved' && (
  <button 
    className="btn btn-success"
    onClick={() => startConsultation(appointment)}
  >
    <i className="fas fa-video me-2"></i>
    Join Consultation
  </button>
)}
```

## Button Visibility Logic

```javascript
const canStartConsultation = (appointment) => {
  // Must be online consultation
  if (appointment.consultationType !== 'online') return false;
  
  // Must be approved
  if (appointment.status !== 'approved') return false;
  
  // Check 15-minute window
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();
  const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60000);
  
  return now >= fifteenMinutesBefore;
};
```

## Testing Locally

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm start
```

### 3. Test with Two Browser Windows

**Window 1 (Patient):**
1. Login as patient
2. Book online consultation
3. Admin approves appointment
4. Join consultation

**Window 2 (Doctor):**
1. Login as doctor
2. See approved appointment
3. Join consultation

Both should see each other's video!

## Quick Test Script

Create `test-consultation.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5005';

async function testConsultation() {
  try {
    // 1. Create test appointment
    const appointment = await axios.post(`${BASE_URL}/api/appointments`, {
      doctorId: 'YOUR_DOCTOR_ID',
      userId: 'YOUR_USER_ID',
      date: new Date(),
      time: '14:00',
      reason: 'Test consultation',
      consultationType: 'online',
      clinicId: 'YOUR_CLINIC_ID'
    });
    
    console.log('✅ Appointment created:', appointment.data._id);
    
    // 2. Approve appointment (as admin)
    await axios.patch(`${BASE_URL}/api/appointments/${appointment.data._id}`, {
      status: 'approved'
    });
    
    console.log('✅ Appointment approved');
    
    // 3. Start consultation
    const start = await axios.post(
      `${BASE_URL}/api/consultations/${appointment.data._id}/start`
    );
    
    console.log('✅ Consultation started:', start.data);
    
    // 4. Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. End consultation
    const end = await axios.post(
      `${BASE_URL}/api/consultations/${appointment.data._id}/end`
    );
    
    console.log('✅ Consultation ended. Duration:', end.data.duration, 'seconds');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConsultation();
```

## Troubleshooting

### "Camera/Microphone access denied"
- Check browser permissions
- Try different browser
- Ensure HTTPS in production

### "Connection failed"
- Check if backend is running
- Verify Socket.io connection in browser console
- Check firewall settings

### "User not connecting"
- Both users must be in same appointment
- Check browser console for errors
- Verify appointment is approved

### "No video showing"
- Check camera is not in use by another app
- Try refreshing page
- Check browser compatibility

## Browser Console Debugging

Open browser console (F12) and look for:

```
✅ Socket connected
✅ User joined consultation
✅ Received offer from: [socket-id]
✅ Received remote track
✅ Connection state: connected
```

## Production Checklist

Before deploying to production:

- [ ] Add HTTPS (required for WebRTC)
- [ ] Configure TURN server for NAT traversal
- [ ] Add authentication to Socket.io
- [ ] Implement consultation recording (if needed)
- [ ] Add monitoring and logging
- [ ] Test on mobile devices
- [ ] Ensure HIPAA compliance
- [ ] Add bandwidth detection
- [ ] Implement reconnection logic
- [ ] Add consultation history

## Next Steps

1. **Add to Patient Dashboard**: Integrate "Start Consultation" button
2. **Add to Doctor Dashboard**: Same integration
3. **Test End-to-End**: Book → Approve → Join → Complete
4. **Customize UI**: Match your brand colors
5. **Add Features**: Screen share, chat, recording, etc.

## Support

The implementation is complete and ready to use. The main components are:

- ✅ `VideoConsultation.js` - WebRTC video interface
- ✅ `OnlineConsultation.js` - Updated with video integration
- ✅ `socketService.js` - Backend signaling
- ✅ `consultationRoutes.js` - API endpoints
- ✅ Appointment model updated with consultation fields

Just integrate the "Start Consultation" button into your dashboards and you're ready to go!
