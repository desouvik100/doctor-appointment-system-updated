# Mobile Integration Guide

## 1. Add Mobile Init Hook to App.js

Add these imports at the top of `App.js`:

```javascript
import { useMobileInit } from './mobile/useMobileInit';
import { Capacitor } from '@capacitor/core';
```

Then inside the `App` function, add the hook:

```javascript
function App() {
  // ... existing state declarations ...
  
  // Add this line after state declarations
  const userId = user?.id || user?._id;
  useMobileInit(userId);
  
  // ... rest of component ...
}
```

## 2. Update Payment Flow in Booking Components

In your booking/payment components, replace direct Razorpay calls with the mobile payment helper:

```javascript
import { openCheckout } from '../mobile/payment';
import { Capacitor } from '@capacitor/core';

// In your payment handler:
const handlePayment = async (appointmentId) => {
  const userId = user?.id || user?._id;
  
  try {
    const result = await openCheckout(appointmentId, userId);
    
    if (result.success) {
      toast.success('Payment successful!');
      // Refresh appointment data
      fetchAppointments();
    } else if (result.testMode) {
      toast.success('Appointment confirmed (test mode)');
      fetchAppointments();
    } else if (result.isWeb && result.orderData) {
      // For web, use existing Razorpay SDK flow
      openRazorpayCheckout(result.orderData);
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

## 3. Update Auth to Use Secure Storage

In your Auth components, update login handlers:

```javascript
import { saveUser, saveAdmin, saveReceptionist } from '../mobile/authStorage';

// After successful login:
const handleLoginSuccess = async (userData, userType) => {
  if (userType === 'admin') {
    await saveAdmin(userData);
    localStorage.setItem('admin', JSON.stringify(userData)); // Keep for web compatibility
  } else if (userType === 'receptionist') {
    await saveReceptionist(userData);
    localStorage.setItem('receptionist', JSON.stringify(userData));
  } else {
    await saveUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }
  
  // Continue with existing login flow...
};
```

## 4. Add Prescription Upload Button

In appointment detail or prescription components:

```javascript
import { captureAndUploadPrescription } from '../mobile/camera';
import { Capacitor } from '@capacitor/core';

const PrescriptionUpload = ({ appointmentId }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async () => {
    setUploading(true);
    try {
      const result = await captureAndUploadPrescription(appointmentId, 'Prescription');
      
      if (result.success) {
        toast.success('Prescription uploaded!');
      } else if (result.cancelled) {
        // User cancelled - do nothing
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // Only show on mobile
  if (!Capacitor.isNativePlatform()) {
    return null; // Or show file input for web
  }
  
  return (
    <button onClick={handleUpload} disabled={uploading}>
      {uploading ? 'Uploading...' : 'Upload Prescription'}
    </button>
  );
};
```

## 5. Handle Payment Callbacks

Add event listener for payment callbacks in App.js or relevant component:

```javascript
useEffect(() => {
  const handlePaymentCallback = (event) => {
    const result = event.detail;
    
    if (result.success) {
      toast.success('Payment completed!');
      // Refresh data
    } else if (result.cancelled) {
      toast('Payment cancelled');
    } else {
      toast.error(result.message || 'Payment failed');
    }
  };
  
  window.addEventListener('paymentCallback', handlePaymentCallback);
  return () => window.removeEventListener('paymentCallback', handlePaymentCallback);
}, []);
```

## 6. Platform-Specific UI

Show/hide elements based on platform:

```javascript
import { Capacitor } from '@capacitor/core';

const MyComponent = () => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  return (
    <div>
      {/* Show only on mobile */}
      {isNative && (
        <button onClick={handleCameraUpload}>
          Take Photo
        </button>
      )}
      
      {/* Show only on web */}
      {!isNative && (
        <input type="file" accept="image/*" />
      )}
      
      {/* Platform-specific styling */}
      <div style={{ 
        paddingTop: isIOS ? 'env(safe-area-inset-top)' : '0' 
      }}>
        Content
      </div>
    </div>
  );
};
```

## 7. Add CSS for Mobile

Add to your main CSS file:

```css
/* Safe area insets for notched devices */
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Keyboard open state */
body.keyboard-open {
  /* Adjust layout when keyboard is visible */
}

body.keyboard-open .fixed-bottom {
  display: none;
}

/* Disable text selection on mobile for app-like feel */
@media (max-width: 768px) {
  .no-select {
    -webkit-user-select: none;
    user-select: none;
  }
}

/* Touch-friendly tap targets */
@media (pointer: coarse) {
  button, a, .clickable {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Files Created

- `frontend/capacitor.config.json` - Capacitor configuration
- `frontend/src/mobile/authStorage.js` - Secure token storage
- `frontend/src/mobile/payment.js` - Mobile payment flow
- `frontend/src/mobile/camera.js` - Camera & file upload
- `frontend/src/mobile/pushNotifications.js` - FCM push notifications
- `frontend/src/mobile/useMobileInit.js` - App initialization hook
- `frontend/src/mobile/PaymentButton.js` - Ready-to-use payment button
- `frontend/src/mobile/index.js` - Central exports
- `frontend/MOBILE_SETUP.md` - Complete setup guide
- `backend/routes/notificationRoutes.js` - Push notification endpoints
