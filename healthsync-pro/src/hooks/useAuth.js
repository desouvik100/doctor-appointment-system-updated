/**
 * useAuth — Authentication hook for React Native
 * Wraps UserContext with convenience methods
 */
import { useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { logout as authLogout } from '../services/api/authService';

const useAuth = () => {
  const { user, loading, login, logout: contextLogout, updateUser, refreshUser, isLoggedIn } = useUser();

  const role     = user?.role || user?.userType || null;
  const userId   = user?.id || user?._id || null;
  const token    = user?.token || null;
  const clinicId = user?.clinicId || null;

  const signOut = useCallback(async () => {
    try {
      await authLogout();
    } catch { /* ignore API errors on logout */ }
    await contextLogout();
  }, [contextLogout]);

  return {
    user,
    loading,
    isLoggedIn,
    role,
    userId,
    token,
    clinicId,
    login,
    logout: signOut,
    updateUser,
    refreshUser,
    // Role checks
    isDoctor:       role === 'doctor',
    isAdmin:        role === 'admin' || role === 'superadmin',
    isStaff:        role === 'receptionist' || role === 'clinic' || role === 'staff',
    isPatient:      role === 'patient',
  };
};

export default useAuth;
