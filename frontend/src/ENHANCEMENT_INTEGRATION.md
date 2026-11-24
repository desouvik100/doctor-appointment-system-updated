# HealthSync Enhancement Integration Guide

This document explains how to integrate the new enhancement components into your existing code.

## 1. Error Handler Integration

Add to any component that makes API calls:

```jsx
import { handleApiError, withRetry, setupOfflineDetection } from '../utils/errorHandler';

// In your component
useEffect(() => {
  const cleanup = setupOfflineDetection();
  return cleanup;
}, []);

// When making API calls
const fetchData = async () => {
  try {
    const response = await withRetry(() => axios.get('/api/data'));
    setData(response.data);
  } catch (error) {
    handleApiError(error, 'Failed to load data');
  }
};
```

## 2. Loading Skeleton Integration

Replace spinners with skeletons:

```jsx
import { DoctorGridSkeleton, AppointmentCardSkeleton } from './LoadingSkeleton';

// In your render
{loading ? (
  <DoctorGridSkeleton count={6} />
) : (
  <div className="doctors-grid">
    {doctors.map(doctor => <DoctorCard key={doctor._id} doctor={doctor} />)}
  </div>
)}
```

## 3. Confirm Dialog Integration

Add confirmation for critical actions:

```jsx
import ConfirmDialog from './ConfirmDialog';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Appointment"
  message="Are you sure you want to delete this appointment?"
  type="danger"
  confirmText="Delete"
/>
```

## 4. Cancel Appointment Modal Integration

Add to appointment cards:

```jsx
import CancelAppointmentModal from './CancelAppointmentModal';

const [showCancelModal, setShowCancelModal] = useState(false);
const [selectedAppointment, setSelectedAppointment] = useState(null);

// In appointment card
<button onClick={() => {
  setSelectedAppointment(appointment);
  setShowCancelModal(true);
}}>
  Cancel
</button>

<CancelAppointmentModal
  isOpen={showCancelModal}
  onClose={() => setShowCancelModal(false)}
  appointment={selectedAppointment}
  onCancelled={(apt) => {
    // Refresh appointments list
    fetchAppointments();
  }}
  userType="patient"
/>
```

## 5. Doctor Availability Badge Integration

Add to doctor cards:

```jsx
import DoctorAvailabilityBadge from './DoctorAvailabilityBadge';

// In doctor card
<DoctorAvailabilityBadge 
  doctorId={doctor._id}
  showQueueCount={true}
  showEstimatedWait={true}
  compact={false}
/>

// Or compact version
<DoctorAvailabilityBadge 
  doctorId={doctor._id}
  compact={true}
/>
```

## 6. Queue Polling Hook Integration

For real-time queue updates:

```jsx
import { useQueuePolling } from '../hooks/useQueuePolling';

const { queueData, loading, refresh } = useQueuePolling(appointmentId, {
  enabled: true,
  interval: 30000,
  onPositionChange: (newPos, oldPos) => {
    toast.success(`Queue position updated: ${newPos}`);
  },
  onAlmostTurn: (position) => {
    toast.success(`Almost your turn! Position: ${position}`);
  }
});
```

## 7. Toast Configuration

Replace default Toaster with enhanced version:

```jsx
// In App.js
import { ToastConfig } from './components/ToastConfig';

function App() {
  return (
    <>
      <ToastConfig />
      {/* rest of app */}
    </>
  );
}
```

## 8. Form Validation

Use validation helpers:

```jsx
import { validateForm, getFieldError } from '../utils/validation';

const handleSubmit = () => {
  const { isValid, errors } = validateForm(formData, {
    email: { required: true, email: true },
    phone: { required: true, phone: true },
    name: { required: true, minLength: 2 }
  });

  if (!isValid) {
    toast.error(getFieldError(errors, 'email') || 'Please fix form errors');
    return;
  }
  
  // Submit form
};
```

## New API Endpoints

### Cancel Appointment with Reason
```
PUT /api/appointments/:id/cancel
Body: {
  reason: "Schedule conflict",
  cancelledBy: "patient",
  notifyPatient: true,
  notifyDoctor: true
}
```

## Files Added

- `frontend/src/utils/errorHandler.js` - Centralized error handling
- `frontend/src/utils/validation.js` - Form validation utilities
- `frontend/src/components/LoadingSkeleton.js` - Skeleton loading components
- `frontend/src/components/LoadingSkeleton.css` - Skeleton styles
- `frontend/src/components/ConfirmDialog.js` - Confirmation dialog
- `frontend/src/components/ConfirmDialog.css` - Dialog styles
- `frontend/src/components/CancelAppointmentModal.js` - Cancellation modal
- `frontend/src/components/CancelAppointmentModal.css` - Modal styles
- `frontend/src/components/DoctorAvailabilityBadge.js` - Availability indicator
- `frontend/src/components/DoctorAvailabilityBadge.css` - Badge styles
- `frontend/src/components/ToastConfig.js` - Enhanced toast configuration
- `frontend/src/hooks/useQueuePolling.js` - Real-time queue hooks

## Files Modified

- `backend/services/aiHealthService.js` - Fixed unused parameters
- `backend/services/emailService.js` - Added cancellation email
- `backend/routes/appointmentRoutes.js` - Added cancel endpoint
- `backend/models/Appointment.js` - Added cancellation fields
