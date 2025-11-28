# 📝 Example Integration - PatientDashboard

## Complete Example: Adding Video Consultation to PatientDashboard

### Step 1: Import the Component

```javascript
// At the top of PatientDashboard.js
import ConsultationButton from './ConsultationButton';
```

### Step 2: Add to Appointment Card

Find where you render appointments and add the button:

```javascript
// Example appointment card rendering
{appointments.map(appointment => (
  <div key={appointment._id} className="appointment-card">
    {/* Existing appointment info */}
    <div className="appointment-header">
      <h5>{appointment.doctor?.name}</h5>
      <span className={`badge ${appointment.status}`}>
        {appointment.status}
      </span>
    </div>
    
    <div className="appointment-details">
      <p><i className="fas fa-calendar"></i> {new Date(appointment.date).toLocaleDateString()}</p>
      <p><i className="fas fa-clock"></i> {appointment.time}</p>
      <p><i className="fas fa-stethoscope"></i> {appointment.doctor?.specialization}</p>
      
      {/* Show consultation type badge */}
      {appointment.consultationType === 'online' && (
        <span className="badge bg-info">
          <i className="fas fa-video me-1"></i>
          Online Consultation
        </span>
      )}
    </div>
    
    <div className="appointment-actions">
      {/* Existing buttons */}
      <button className="btn btn-sm btn-outline-primary">
        <i className="fas fa-info-circle"></i> Details
      </button>
      
      {/* ADD THIS: Video Consultation Button */}
      <ConsultationButton 
        appointment={appointment} 
        user={user} 
        onComplete={() => fetchAppointments()}
      />
      
      {/* Other buttons */}
      <button className="btn btn-sm btn-outline-danger">
        <i className="fas fa-times"></i> Cancel
      </button>
    </div>
  </div>
))}
```

### Step 3: That's It! 🎉

The `ConsultationButton` component handles everything:
- ✅ Shows/hides based on consultation type
- ✅ Enables/disables based on approval status
- ✅ Shows countdown until available
- ✅ Opens video consultation when clicked
- ✅ Handles all state management

## Alternative: Manual Integration

If you want more control:

```javascript
import { useState } from 'react';
import OnlineConsultation from './OnlineConsultation';

function PatientDashboard({ user }) {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showConsultation, setShowConsultation] = useState(false);
  
  const handleStartConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    setShowConsultation(true);
  };
  
  const handleCloseConsultation = () => {
    setShowConsultation(false);
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh appointments
  };
  
  return (
    <div>
      {/* Your appointments list */}
      {appointments.map(appointment => (
        <div key={appointment._id}>
          {/* Appointment info */}
          
          {/* Video consultation button */}
          {appointment.consultationType === 'online' && 
           appointment.status === 'approved' && (
            <button 
              className="btn btn-success"
              onClick={() => handleStartConsultation(appointment)}
            >
              <i className="fas fa-video me-2"></i>
              Start Consultation
            </button>
          )}
        </div>
      ))}
      
      {/* Consultation modal */}
      {showConsultation && selectedAppointment && (
        <OnlineConsultation
          appointmentId={selectedAppointment._id}
          user={user}
          onClose={handleCloseConsultation}
        />
      )}
    </div>
  );
}
```

## For DoctorDashboard

Same exact pattern:

```javascript
import ConsultationButton from './ConsultationButton';

// In doctor's appointment list
<ConsultationButton 
  appointment={appointment} 
  user={doctorUser} 
  onComplete={() => refreshAppointments()}
/>
```

## Styling the Button

The button uses Bootstrap classes by default. To customize:

```css
/* In your CSS file */
.consultation-button-container {
  margin-top: 0.5rem;
}

.consultation-button-container .btn {
  width: 100%;
  font-weight: 600;
}

.consultation-button-container .btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.consultation-button-container .btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}
```

## Complete Flow Example

```javascript
// 1. User sees appointment card
┌─────────────────────────────────────┐
│ Dr. Smith - Cardiology              │
│ 📅 Dec 15, 2024  🕐 2:00 PM        │
│ 🎥 Online Consultation              │
│                                     │
│ [🎥 Start Consultation] ✅          │
└─────────────────────────────────────┘

// 2. User clicks button
↓

// 3. Waiting room appears
┌─────────────────────────────────────┐
│ Ready to Join Consultation          │
│                                     │
│ Dr. Smith - Cardiology              │
│ Dec 15, 2024 at 2:00 PM            │
│                                     │
│ [Join Consultation]                 │
└─────────────────────────────────────┘

// 4. User clicks "Join Consultation"
↓

// 5. Full-screen video interface
┌─────────────────────────────────────┐
│ 🎥 Video Consultation  ● Connected  │
├─────────────────────────────────────┤
│                                     │
│     [Doctor's Video - Large]        │
│                                     │
│              ┌──────────┐           │
│              │ Your     │           │
│              │ Video    │           │
│              └──────────┘           │
├─────────────────────────────────────┤
│     [🎤]  [📹]  [☎️ End]           │
└─────────────────────────────────────┘
```

## Testing Your Integration

1. **Add the import and button** to your dashboard
2. **Restart frontend** (if needed)
3. **Create a test appointment**:
   ```javascript
   {
     consultationType: 'online',
     status: 'approved',
     date: new Date(),
     time: '14:00'
   }
   ```
4. **Click the button** - should open consultation
5. **Allow permissions** - camera and microphone
6. **Open second window** - join as doctor
7. **See each other** - video consultation working! 🎉

## Common Patterns

### Show button only for upcoming appointments
```javascript
{appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
  <ConsultationButton 
    appointment={appointment} 
    user={user} 
    onComplete={fetchAppointments}
  />
)}
```

### Add custom styling
```javascript
<div className="my-custom-wrapper">
  <ConsultationButton 
    appointment={appointment} 
    user={user} 
    onComplete={fetchAppointments}
  />
</div>
```

### Add analytics tracking
```javascript
<ConsultationButton 
  appointment={appointment} 
  user={user} 
  onComplete={() => {
    fetchAppointments();
    trackEvent('consultation_completed', { appointmentId: appointment._id });
  }}
/>
```

## That's All You Need!

The integration is designed to be as simple as possible:
1. Import the component
2. Add it to your JSX
3. Done! ✅

Everything else (permissions, WebRTC, signaling, UI) is handled automatically.
