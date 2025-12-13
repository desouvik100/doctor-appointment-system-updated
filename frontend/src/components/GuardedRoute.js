/**
 * Guarded Route Component
 * Protects routes based on authentication and role
 */

import { useEffect, useState } from 'react';

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  superadmin: 100,
  admin: 80,
  doctor: 60,
  receptionist: 40,
  staff: 30,
  patient: 10,
  guest: 0
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

/**
 * Check if user has minimum role level
 */
export const hasMinRole = (userRole, minRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    // Check all user types
    const user = localStorage.getItem('user');
    const admin = localStorage.getItem('admin');
    const doctor = localStorage.getItem('doctor');
    const receptionist = localStorage.getItem('receptionist');

    if (admin) {
      const parsed = JSON.parse(admin);
      return { ...parsed, role: 'admin' };
    }
    if (doctor) {
      const parsed = JSON.parse(doctor);
      return { ...parsed, role: 'doctor' };
    }
    if (receptionist) {
      const parsed = JSON.parse(receptionist);
      return { ...parsed, role: 'receptionist' };
    }
    if (user) {
      const parsed = JSON.parse(user);
      return { ...parsed, role: 'patient' };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

/**
 * Guarded Route Component
 * Renders children only if user meets requirements
 */
const GuardedRoute = ({
  children,
  requiredRoles = [],
  minRole = null,
  fallback = null,
  redirectTo = null,
  onUnauthorized = null
}) => {
  const [authorized, setAuthorized] = useState(null); // null = checking, true/false = result
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      setAuthorized(false);
      if (onUnauthorized) onUnauthorized('not_authenticated');
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasRole(user.role, requiredRoles)) {
      setAuthorized(false);
      if (onUnauthorized) onUnauthorized('insufficient_role');
      return;
    }

    // Check minimum role level
    if (minRole && !hasMinRole(user.role, minRole)) {
      setAuthorized(false);
      if (onUnauthorized) onUnauthorized('insufficient_level');
      return;
    }

    setAuthorized(true);
  }, [requiredRoles, minRole, onUnauthorized]);

  // Still checking
  if (authorized === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!authorized) {
    if (fallback) return fallback;
    
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center p-5" style={{ 
          background: 'white', 
          borderRadius: '20px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <i className="fas fa-lock fa-3x mb-3" style={{ color: '#ef4444' }}></i>
          <h4 style={{ color: '#1e293b' }}>Access Denied</h4>
          <p className="text-muted mb-4">
            {!currentUser 
              ? 'Please log in to access this page'
              : 'You do not have permission to access this page'}
          </p>
          {redirectTo && (
            <button 
              className="btn btn-primary"
              onClick={() => window.location.hash = redirectTo}
            >
              {!currentUser ? 'Go to Login' : 'Go Back'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Authorized - render children
  return children;
};

/**
 * Higher-order component for route protection
 */
export const withGuard = (Component, options = {}) => {
  return function GuardedComponent(props) {
    return (
      <GuardedRoute {...options}>
        <Component {...props} />
      </GuardedRoute>
    );
  };
};

/**
 * Hook for checking permissions in components
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role || 'guest',
    hasRole: (roles) => hasRole(user?.role, roles),
    hasMinRole: (minRole) => hasMinRole(user?.role, minRole),
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isStaff: ['receptionist', 'staff'].includes(user?.role)
  };
};

export default GuardedRoute;
