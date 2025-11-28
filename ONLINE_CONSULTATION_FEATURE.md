# Online Consultation Feature - Complete Implementation 🎥

## Overview
A complete online consultation system has been integrated into the existing appointment flow, allowing patients to choose between in-person and online consultations with doctors.

## Features Implemented

### 1. **Appointment Model Updates**
- Added `consultationType` field: "in_person" or "online" (default: "in_person")
- Added `meetingLink` field for video consultation URL
- Added `joinCode` field: 8-character secure code for joining
- Added `meetingStartTime` and `meetingEndTime` for tracking
- Updated status enum to include "in_progress"

### 2. **Access Control System**
- Consultations only accessible when status is "confirmed" or "in_progress"
- Time window: 15 minutes before appointment to 60 minutes after
- Automatic access checking with countdown timer
- Join code verification for security

### 3. **Backend API Endpoints**

#### Generate Meeting
```
POST /api/appointments/:id/generate-meeting
```
- Creates meeting link and join code
- Returns meeting details

#### Check Access
```
GET /api/appointments/:id/check-access
```
- Verifies if consultation is accessible
- Returns time until opening if not ready
- Provides appointment details

#### Join Consultation
```
POST /api/appointments/:id/join
```
- Verifies join code
- Updates status to "in_progress"
- Records meeting start time

#### End Consultation
```
POST /api/appointments/:id/end-consultation
```
- Marks consultation as completed
- Records meeting end time
- Calculates duration

#### Get Upcoming Online Consultations
```
GET /api/appointments/user/:userId/online-upcoming
```
- Lists all upcoming online consultations
- Includes accessibility information

### 4. **Frontend Components**

#### OnlineConsultation Component
**Location**: `frontend/src/components/OnlineConsultation.js`

**Features**:
- Waiting room with countdown timer
- Lobby with appointment details
- Video consultation room (placeholder for integration)
- Join code display
- Access control UI
- Meeting tips and guidelines

**States**:
1. **Loading**: Checking consultation access
2. **Waiting**: Consultation not yet accessible (shows countdown)
3. **Lobby**: Ready to join (shows join button)
4. **In Meeting**: Active consultation (shows video area)

#### Updated Components

**MyAppointments.js**:
- Shows consultation type badge (Online/In-Person)
- "Join Consultation" button for online appointments
- Status badge includes "In Progress"
- Integrates OnlineConsultation component

**BookAppointment.js**:
- Consultation type selector (In-Person/Online)
- Visual cards for selection
- Info alert for online consultations
- Passes consultationType to backend

### 5. **Security Features**

#### Join Code System
- 8-character alphanumeric code
- Excludes similar-looking characters (0, O, I, 1, etc.)
- Required for joining consultation
- Prevents unauthorized access

#### Time-Based Access
- 15-minute buffer before appointment
- 60-minute window after start time
- Automatic expiration
- Real-time countdown display

#### Status Verification
- Must be confirmed or in_progress
- Payment must be completed
- Appointment must exist

## User Flow

### Booking Online Consultation

1. **Select Doctor**
   - Browse doctor list
   - Click "Book Appointment"

2. **Choose Consultation Type**
   - Select "Online" or "In-Person"
   - See info about online consultation

3. **Fill Details**
   - Select date and time
   - Enter reason for visit
   - Submit booking

4. **Complete Payment**
   - Pay consultation fee
   - Receive confirmation

5. **Receive Meeting Details**
   - Meeting link generated
   - Join code provided
   - Email notification sent

### Joining Online Consultation

1. **Navigate to Appointments**
   - View "My Appointments"
   - Find upcoming online consultation

2. **Check Accessibility**
   - See countdown if too early
   - "Join Consultation" button appears when ready

3. **Join Meeting**
   - Click "Join Consultation"
   - View appointment details in lobby
   - Click "Join Consultation" to enter

4. **In Consultation**
   - Video consultation area
   - Patient and doctor information
   - "End Consultation" button

5. **End Meeting**
   - Click "End Consultation"
   - Marked as completed
   - Return to dashboard

## Technical Implementation

### Database Schema

```javascript
{
  // Existing fields...
  consultationType: {
    type: String,
    enum: ["in_person", "online"],
    default: "in_person"
  },
  meetingLink: String,
  joinCode: String,
  meetingStartTime: Date,
  meetingEndTime: Date,
  status: {
    type: String,
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"]
  }
}
```

### Model Methods

```javascript
// Generate random join code
generateJoinCode()

// Check if consultation is accessible
isConsultationAccessible()
```

### API Response Examples

#### Check Access - Not Ready
```json
{
  "accessible": false,
  "reason": "Consultation opens in 25 minutes",
  "opensAt": "2025-11-27T10:45:00.000Z",
  "appointment": { ... }
}
```

#### Check Access - Ready
```json
{
  "accessible": true,
  "reason": "Ready to join",
  "appointment": {
    "id": "...",
    "meetingLink": "http://localhost:3000/consultation/...",
    "joinCode": "ABC12XYZ"
  }
}
```

## Configuration

### Environment Variables

```env
# Frontend URL for meeting links
FRONTEND_URL=http://localhost:3000

# Time windows (in minutes)
CONSULTATION_EARLY_ACCESS=15
CONSULTATION_LATE_ACCESS=60
```

### Customizable Settings

**Time Windows**:
- Early access: 15 minutes before (configurable)
- Late access: 60 minutes after (configurable)

**Join Code**:
- Length: 8 characters (configurable)
- Character set: A-Z, 2-9 (excluding similar chars)

## Integration Points

### Video Conferencing

The current implementation provides a placeholder for video integration. You can integrate with:

1. **Zoom**
   - Use Zoom SDK
   - Generate meeting on booking
   - Embed in consultation room

2. **Google Meet**
   - Use Google Meet API
   - Create meeting link
   - Embed iframe

3. **Jitsi Meet**
   - Open source solution
   - Self-hosted option
   - Easy integration

4. **Twilio Video**
   - Programmable video
   - Custom UI
   - High quality

### Example Integration (Jitsi)

```javascript
// In OnlineConsultation.js
const JitsiMeet = () => {
  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: appointment.joinCode,
      width: '100%',
      height: 500,
      parentNode: document.querySelector('#jitsi-container')
    };
    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, []);

  return <div id="jitsi-container"></div>;
};
```

## Styling

### CSS Classes

**Consultation Container**:
- `.consultation-container`: Main wrapper
- `.consultation-waiting`: Waiting state
- `.consultation-lobby`: Lobby state
- `.consultation-room`: Active meeting

**Components**:
- `.waiting-card`: Waiting room card
- `.lobby-card`: Lobby card
- `.countdown-timer`: Countdown display
- `.join-code-display`: Join code display
- `.video-container`: Video area
- `.consultation-header`: Meeting header

### Responsive Design

- Mobile-optimized layouts
- Touch-friendly buttons
- Adaptive grid layouts
- Collapsible sections

## Testing

### Manual Testing Checklist

#### Booking
- [ ] Can select online consultation type
- [ ] Info alert shows for online type
- [ ] Meeting link generated after payment
- [ ] Join code created and saved

#### Access Control
- [ ] Cannot join before 15-minute window
- [ ] Countdown timer shows correctly
- [ ] Can join within time window
- [ ] Cannot join after 60-minute window

#### Joining
- [ ] Join button appears when accessible
- [ ] Lobby shows appointment details
- [ ] Join code displayed correctly
- [ ] Can enter consultation room

#### In Meeting
- [ ] Status updates to "in_progress"
- [ ] Meeting start time recorded
- [ ] Can end consultation
- [ ] Meeting end time recorded

#### Security
- [ ] Join code verification works
- [ ] Invalid code rejected
- [ ] Unauthorized access prevented
- [ ] Time window enforced

### API Testing

```bash
# Check access
curl http://localhost:5000/api/appointments/:id/check-access

# Join consultation
curl -X POST http://localhost:5000/api/appointments/:id/join \
  -H "Content-Type: application/json" \
  -d '{"joinCode": "ABC12XYZ"}'

# End consultation
curl -X POST http://localhost:5000/api/appointments/:id/end-consultation
```

## Migration

### Existing Appointments

All existing appointments will default to `consultationType: "in_person"`. No data migration needed.

### Database Update

```javascript
// Optional: Update all existing appointments
db.appointments.updateMany(
  { consultationType: { $exists: false } },
  { $set: { consultationType: "in_person" } }
);
```

## Future Enhancements

### Planned Features
- [ ] Screen sharing capability
- [ ] Chat during consultation
- [ ] File sharing (reports, prescriptions)
- [ ] Recording option (with consent)
- [ ] Waiting room for multiple patients
- [ ] Doctor availability calendar
- [ ] Automated reminders (SMS/Email)
- [ ] Post-consultation notes
- [ ] Prescription generation
- [ ] Follow-up scheduling

### Advanced Features
- [ ] AI-powered symptom checker
- [ ] Real-time translation
- [ ] Virtual waiting room
- [ ] Queue management
- [ ] Analytics dashboard
- [ ] Integration with EHR systems

## Troubleshooting

### Common Issues

**Issue**: Cannot join consultation
- Check appointment status (must be confirmed)
- Verify payment completed
- Check time window (15 min before to 60 min after)
- Verify join code

**Issue**: Meeting link not generated
- Check FRONTEND_URL environment variable
- Verify appointment saved correctly
- Check server logs for errors

**Issue**: Countdown not updating
- Check browser console for errors
- Verify date/time format
- Check timezone settings

## Security Considerations

### Best Practices
- Always verify join code
- Enforce time windows
- Validate appointment status
- Check payment completion
- Log all access attempts
- Monitor for suspicious activity

### HIPAA Compliance
- Use encrypted connections (HTTPS)
- Secure video platform
- Patient data protection
- Access logging
- Consent management

## Performance

### Optimization
- Lazy load video components
- Efficient polling (30-second intervals)
- Cached appointment data
- Optimized database queries
- CDN for static assets

### Monitoring
- Track join success rate
- Monitor video quality
- Log connection issues
- Measure latency
- User feedback collection

## Documentation Files

1. **ONLINE_CONSULTATION_FEATURE.md** - This file
2. **backend/models/Appointment.js** - Updated model
3. **backend/routes/appointmentRoutes.js** - API endpoints
4. **frontend/src/components/OnlineConsultation.js** - Main component
5. **frontend/src/components/OnlineConsultation.css** - Styling
6. **frontend/src/components/MyAppointments.js** - Updated
7. **frontend/src/components/BookAppointment.js** - Updated

## Support

### For Developers
- Check API documentation
- Review code comments
- Test with sample data
- Use browser dev tools

### For Users
- User guide in app
- FAQ section
- Support contact
- Video tutorials

---

**Status**: ✅ Complete and Ready for Testing
**Version**: 1.0.0
**Last Updated**: November 27, 2025
**Integration Ready**: Yes (requires video platform selection)
