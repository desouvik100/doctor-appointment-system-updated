import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

/**
 * Biometric Check-In Component
 * Uses WebAuthn API for web and native biometric for Android/iOS
 */
const BiometricCheckIn = ({ staffId, staffName, onCheckIn, onCheckOut, isCheckedIn }) => {
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    checkBiometricSupport(native);
    checkBiometricRegistration();
  }, [staffId]);

  const checkBiometricSupport = async (native) => {
    if (native) {
      // Native Android/iOS - use native biometric
      try {
        const { NativeBiometric } = await import('capacitor-native-biometric');
        const result = await NativeBiometric.isAvailable();
        setBiometricSupported(result.isAvailable);
      } catch (err) {
        console.log('Native biometric not available:', err);
        setBiometricSupported(false);
      }
    } else {
      // Web - use WebAuthn
      if (window.PublicKeyCredential) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(available);
        } catch (err) {
          setBiometricSupported(false);
        }
      }
    }
  };

  const checkBiometricRegistration = () => {
    const registered = localStorage.getItem(`biometric_${staffId}`);
    setBiometricRegistered(!!registered);
  };

  // Generate random bytes for challenge
  const generateChallenge = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
  };

  // Native biometric authentication (Android/iOS)
  const authenticateNativeBiometric = async (action) => {
    setLoading(true);
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      const result = await NativeBiometric.verifyIdentity({
        reason: action === 'checkin' ? 'Verify to Check In' : 'Verify to Check Out',
        title: 'Biometric Authentication',
        subtitle: 'HealthSync Attendance',
        description: `Use fingerprint or face to ${action === 'checkin' ? 'check in' : 'check out'}`,
      });

      if (result) {
        // Mark as registered on first successful auth
        if (!biometricRegistered) {
          localStorage.setItem(`biometric_${staffId}`, 'native');
          setBiometricRegistered(true);
        }
        
        // Call the callback and wait for it to complete before showing success
        // The callback should handle the API call and throw on failure
        if (action === 'checkin') {
          if (onCheckIn) {
            try {
              await onCheckIn('biometric');
              toast.success('Biometric verified! Checked in successfully.');
            } catch (apiErr) {
              console.error('Check-in API error:', apiErr);
              toast.error(apiErr.message || 'Biometric verified but check-in failed. Please try again.');
            }
          }
        } else {
          if (onCheckOut) {
            try {
              await onCheckOut('biometric');
              toast.success('Biometric verified! Checked out successfully.');
            } catch (apiErr) {
              console.error('Check-out API error:', apiErr);
              toast.error(apiErr.message || 'Biometric verified but check-out failed. Please try again.');
            }
          }
        }
      }
    } catch (err) {
      console.error('Native biometric error:', err);
      if (err.message?.includes('cancel') || err.code === 'BIOMETRIC_DISMISSED') {
        toast.error('Biometric verification cancelled');
      } else if (err.code === 'BIOMETRIC_NOT_ENROLLED') {
        toast.error('No biometric enrolled on device. Please set up fingerprint in device settings.');
      } else {
        toast.error('Biometric verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Register biometric credential (WebAuthn for web)
  const registerBiometric = async () => {
    if (!biometricSupported) {
      toast.error('Biometric not supported on this device');
      return;
    }

    if (isNative) {
      // For native, just verify once to "register"
      await authenticateNativeBiometric('checkin');
      return;
    }

    setLoading(true);
    try {
      const challenge = generateChallenge();
      
      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "HealthSync Clinic",
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(staffId),
          name: staffName || 'Staff Member',
          displayName: staffName || 'Staff Member'
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred"
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(`biometric_${staffId}`, credentialId);
        setBiometricRegistered(true);
        setShowSetup(false);
        toast.success('Biometric registered successfully!');
      }
    } catch (err) {
      console.error('Biometric registration error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Biometric registration was cancelled');
      } else {
        toast.error('Failed to register biometric');
      }
    } finally {
      setLoading(false);
    }
  };

  // Authenticate with biometric (WebAuthn for web)
  const authenticateBiometric = async (action) => {
    if (isNative) {
      await authenticateNativeBiometric(action);
      return;
    }

    if (!biometricRegistered) {
      toast.error('Please register biometric first');
      setShowSetup(true);
      return;
    }

    setLoading(true);
    try {
      const credentialId = localStorage.getItem(`biometric_${staffId}`);
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: "required",
        timeout: 60000
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        if (action === 'checkin') {
          onCheckIn && onCheckIn('biometric');
          toast.success('Biometric verified! Checked in successfully.');
        } else {
          onCheckOut && onCheckOut('biometric');
          toast.success('Biometric verified! Checked out successfully.');
        }
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Biometric verification cancelled');
      } else {
        toast.error('Biometric verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeBiometric = () => {
    localStorage.removeItem(`biometric_${staffId}`);
    setBiometricRegistered(false);
    toast.success('Biometric removed');
  };

  if (!biometricSupported) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3 text-slate-500">
          <i className="fas fa-fingerprint text-2xl"></i>
          <div>
            <p className="font-medium">Biometric Not Available</p>
            <p className="text-xs">Your device doesn't support biometric authentication</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <i className="fas fa-fingerprint text-white text-xl"></i>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Biometric Check-In</h3>
            <p className="text-xs text-slate-500">
              {isNative ? 'Use fingerprint or face' : (biometricRegistered ? 'Use fingerprint or face to check in/out' : 'Set up biometric for quick check-in')}
            </p>
          </div>
        </div>
        {biometricRegistered && (
          <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
            <i className="fas fa-check mr-1"></i>Registered
          </span>
        )}
      </div>

      {!isNative && (!biometricRegistered || showSetup) ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Register your fingerprint or face ID for secure attendance.
          </p>
          <button
            onClick={registerBiometric}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Setting up...</>
            ) : (
              <><i className="fas fa-fingerprint"></i> Register Biometric</>
            )}
          </button>
          {biometricRegistered && (
            <button onClick={() => setShowSetup(false)} className="w-full py-2 text-slate-600 text-sm">
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => authenticateBiometric('checkin')}
              disabled={loading || isCheckedIn}
              className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                isCheckedIn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-fingerprint"></i> Check In</>}
            </button>
            <button
              onClick={() => authenticateBiometric('checkout')}
              disabled={loading || !isCheckedIn}
              className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                !isCheckedIn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-fingerprint"></i> Check Out</>}
            </button>
          </div>
          {!isNative && (
            <div className="flex justify-between items-center pt-2 border-t border-violet-200">
              <button onClick={() => setShowSetup(true)} className="text-xs text-violet-600 hover:text-violet-700">
                <i className="fas fa-sync-alt mr-1"></i>Re-register
              </button>
              <button onClick={removeBiometric} className="text-xs text-red-500 hover:text-red-600">
                <i className="fas fa-trash mr-1"></i>Remove Biometric
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BiometricCheckIn;
