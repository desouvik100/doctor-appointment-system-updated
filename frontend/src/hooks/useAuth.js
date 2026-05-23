/**
 * useAuth — Authentication state hook
 * Reads from localStorage and provides auth utilities
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const STORAGE_KEYS = ['user', 'admin', 'receptionist', 'doctor'];

const readFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Handle nested format { token, user: {...} }
    if (parsed?.user && typeof parsed.user === 'object') {
      return { ...parsed.user, token: parsed.token };
    }
    return parsed;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser]               = useState(() => readFromStorage('user'));
  const [admin, setAdmin]             = useState(() => readFromStorage('admin'));
  const [receptionist, setReceptionist] = useState(() => readFromStorage('receptionist'));
  const [doctor, setDoctor]           = useState(() => readFromStorage('doctor'));

  // Derived state
  const currentUser = user || admin || receptionist || doctor;
  const isLoggedIn  = !!currentUser;
  const userRole    = currentUser?.role || null;
  const token       = currentUser?.token || null;

  const login = useCallback((userData, userType = 'patient') => {
    const key = userType === 'admin' ? 'admin'
      : userType === 'receptionist' ? 'receptionist'
      : userType === 'doctor' ? 'doctor'
      : 'user';

    localStorage.setItem(key, JSON.stringify(userData));

    switch (key) {
      case 'admin':        setAdmin(userData);        break;
      case 'receptionist': setReceptionist(userData); break;
      case 'doctor':       setDoctor(userData);       break;
      default:             setUser(userData);         break;
    }
  }, []);

  const logout = useCallback(async () => {
    // Try to call logout API (non-blocking)
    try {
      await axios.post('/api/auth/logout');
    } catch { /* ignore */ }

    // Clear all storage
    STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('doctorToken');

    setUser(null);
    setAdmin(null);
    setReceptionist(null);
    setDoctor(null);

    toast.success('Logged out successfully');
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    const key = admin ? 'admin'
      : receptionist ? 'receptionist'
      : doctor ? 'doctor'
      : 'user';

    const current = readFromStorage(key);
    if (!current) return;

    const updated = { ...current, ...updates };
    localStorage.setItem(key, JSON.stringify(updated));

    switch (key) {
      case 'admin':        setAdmin(updated);        break;
      case 'receptionist': setReceptionist(updated); break;
      case 'doctor':       setDoctor(updated);       break;
      default:             setUser(updated);         break;
    }
  }, [admin, receptionist, doctor]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/users/me');
      updateCurrentUser(res.data);
    } catch { /* silent */ }
  }, [token, updateCurrentUser]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (STORAGE_KEYS.includes(e.key)) {
        const val = e.newValue ? JSON.parse(e.newValue) : null;
        switch (e.key) {
          case 'user':         setUser(val);         break;
          case 'admin':        setAdmin(val);        break;
          case 'receptionist': setReceptionist(val); break;
          case 'doctor':       setDoctor(val);       break;
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return {
    user,
    admin,
    receptionist,
    doctor,
    currentUser,
    isLoggedIn,
    userRole,
    token,
    login,
    logout,
    updateCurrentUser,
    refreshProfile,
    // Convenience role checks
    isPatient:      userRole === 'patient',
    isAdmin:        userRole === 'admin',
    isDoctor:       userRole === 'doctor',
    isReceptionist: userRole === 'receptionist' || userRole === 'clinic',
  };
};

export default useAuth;
