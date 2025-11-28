# WebRTC Video Consultation Implementation

## Overview
Real-time video consultation feature using WebRTC for peer-to-peer audio/video communication with Socket.io for signaling.

## Features Implemented

### ✅ Core Features
- **WebRTC Video/Audio**: Real-time peer-to-peer communication
- **Socket.io Signaling**: Server-side signaling for WebRTC connection establishment
- **Media Controls**: Mute/unmute audio, enable/disable video, end call
- **Audio-Only Fallback**: Automatically falls back to audio if video unavailable
- **Consultation Duration Tracking**: Saves duration to database
- **Access Control**: Only approved appointments can start consultations
- **15-Minute Window**: Consultations can start 15 minutes before scheduled time
- **Modern Healthcare UI**: Clean, professional interface

## Architecture

### Backend Components

#### 1. Socket Service (`backend/services/socketService.js`)
- Manages WebRTC signaling
- Handles room management
- Tracks active consultations
- Manages ICE candidate exchange
- Handles offer/answer SDP exchange

#### 2. Consultation Routes (`backend/routes/consultationRoutes.js`)
- `POST /api/consultations/:appointmentId/start` - Start consultation
- `POST /api/consultations/:appointmentId/end` - End consultation
- `GET /api/consultations/:appointmentId/status` - Get consultation status

#### 3. Appointment Model Updates (`backend/models/Appointment.js`)
Added fields:
- `consultationStatus`: "not_started" | "in_progress" | "completed"
- `consultationStartTime`: Date
- `consultationEndTime`: Date
- `consultationDuration`: Number (seconds)

### Frontend Components

#### 1. VideoConsultation Component (`frontend/src/components/VideoConsultation.js`)
Main WebRTC video consultation interface with:
- Local and remote video streams
- Audio/video controls
- Connection status indicators
- Automatic reconnection handling
- Clean, modern UI

#### 2. Updated OnlineConsultation Component
- Integrates VideoConsultation component
- Handles consultation access checks
- Shows waiting room before consultation
- Manages consultation lifecycle

## Installation

### Dependencies Installed
```bash
# Backend
cd backend
npm install socket.io

# Frontend
cd frontend
npm install socket.io-client simple-peer
```

## Usage

### Starting a Consultation

1. **Patient/Doctor navigates to appointment**
2. **Clicks "Join Consultation" button** (available 15 minutes before scheduled time)
3. **Browser requests camera/microphone permissions**
4. **WebRTC connection established**
5. **Video consultation begins**

### During Consultation

**Controls Available:**
- 🎤 **Mute/Unmute** - Toggle microphone
- 📹 **Camera On/Off** - Toggle video
- ☎️ **End Call** - End consultation

### Ending Consultation

1. **Either party clicks "End Call"**
2. **Duration saved to database**
3. **Appointment status updated to "completed"**
4. **All media streams stopped**
5. **Socket connections closed**

## Technical Details

### WebRTC Flow

```
1. User A joins consultation room (Socket.io)
2. User B joins consultation room
3. User A creates offer (SDP)
4. User A sends offer to User B via Socket.io
5. User B receives offer, creates answer (SDP)
6. User B sends answer to User A via Socket.io
7. Both exchange ICE candidates
8. Peer-to-peer connection established
9. Media streams flow directly between peers
```

### STUN Servers Used
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}
```

## Security Features

✅ **Appointment Verification**: Only approved appointments can start
✅ **Time Window Enforcement**: 15-minute before window
✅ **User Authentication**: User ID verification
✅ **Peer-to-Peer Encryption**: WebRTC encrypts media streams
✅ **Socket Authentication**: Can be extended with JWT tokens

## UI/UX Features

### Modern Healthcare Design
- Clean, professional interface
- Medical-themed colors
- Smooth animations
- Responsive layout
- Accessibility compliant

### User Feedback
- Connection status indicators
- Toast notifications for all actions
- Loading states
- Error messages with helpful guidance
- Audio-only mode indicator

### Responsive Design
- Desktop: Side-by-side video layout
- Mobile: Stacked video layout
- Picture-in-picture local video
- Touch-friendly controls

## Database Schema

### Appointment Model Extensions
```javascript
{
  consultationStatus: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started"
  },
  consultationStartTime: Date,
  consultationEndTime: Date,
  consultationDuration: Number // seconds
}
```

## API Endpoints

### Start Consultation
```http
POST /api/consultations/:appointmentId/start
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation started",
  "appointment": { ... }
}
```

**Errors:**
- `403`: Appointment not approved
- `403`: Too early (before 15-minute window)
- `400`: Not an online consultation
- `404`: Appointment not found

### End Consultation
```http
POST /api/consultations/:appointmentId/end
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation ended",
  "duration": 1234,
  "appointment": { ... }
}
```

### Get Consultation Status
```http
GET /api/consultations/:appointmentId/status
```

**Response:**
```json
{
  "success": true,
  "appointment": { ... },
  "canStart": true
}
```

## Socket.io Events

### Client → Server
- `join-consultation` - Join consultation room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `toggle-audio` - Notify audio toggle
- `toggle-video` - Notify video toggle
- `leave-consultation` - Leave consultation

### Server → Client
- `user-joined` - New user joined
- `existing-participants` - List of existing participants
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `user-left` - User left consultation
- `peer-audio-toggle` - Peer toggled audio
- `peer-video-toggle` - Peer toggled video

## Testing

### Manual Testing Steps

1. **Test Camera/Mic Access**
   - Allow permissions
   - Deny permissions (should show error)

2. **Test Connection**
   - Open two browser windows
   - Join same consultation
   - Verify video/audio works

3. **Test Controls**
   - Mute/unmute audio
   - Turn camera on/off
   - End call

4. **Test Access Control**
   - Try joining before 15-minute window
   - Try joining unapproved appointment
   - Try joining as unauthorized user

5. **Test Audio-Only Fallback**
   - Disable camera in browser settings
   - Should fall back to audio only

## Browser Compatibility

✅ **Chrome/Edge**: Full support
✅ **Firefox**: Full support
✅ **Safari**: Full support (iOS 11+)
⚠️ **IE**: Not supported (WebRTC not available)

## Performance Considerations

- **Bandwidth**: ~1-2 Mbps for HD video
- **CPU**: Hardware acceleration recommended
- **Latency**: <100ms typical with good connection
- **Fallback**: Automatically reduces quality on poor connection

## Future Enhancements

### Potential Additions
- [ ] Screen sharing for medical records
- [ ] Recording consultations (with consent)
- [ ] Chat messaging during consultation
- [ ] Waiting room with queue
- [ ] Multiple participants (group consultations)
- [ ] Virtual backgrounds
- [ ] Noise cancellation
- [ ] TURN server for NAT traversal
- [ ] End-to-end encryption
- [ ] Consultation notes/prescriptions

## Troubleshooting

### Common Issues

**1. No Video/Audio**
- Check browser permissions
- Verify camera/microphone not in use
- Try different browser
- Check firewall settings

**2. Connection Failed**
- Check internet connection
- Verify STUN servers accessible
- May need TURN server for restrictive networks

**3. Poor Quality**
- Check bandwidth (speed test)
- Close other applications
- Move closer to WiFi router
- Reduce video quality

**4. Echo/Feedback**
- Use headphones
- Check audio settings
- Verify echo cancellation enabled

## Environment Variables

Add to `.env` files:

### Backend
```env
# Already configured, no additional variables needed
```

### Frontend
```env
REACT_APP_BACKEND_URL=http://localhost:5005
```

## Production Deployment

### Considerations for Production

1. **TURN Server**: Add TURN server for NAT traversal
2. **SSL/TLS**: Required for WebRTC (HTTPS)
3. **Scalability**: Consider using mediasoup or Janus for scaling
4. **Monitoring**: Add logging and analytics
5. **Recording**: Implement server-side recording if needed
6. **Compliance**: Ensure HIPAA compliance for medical data

### Recommended TURN Server Setup
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
}
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Socket.io connection
3. Check network connectivity
4. Review server logs

## License

Part of HealthSync Doctor Appointment System
