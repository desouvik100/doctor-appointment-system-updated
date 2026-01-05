/**
 * Role-Based Navigator - Routes users to appropriate dashboard based on role
 */

import React from 'react';
import { useUser } from '../context/UserContext';

// Import role-specific navigators
import BottomTabNavigator from './BottomTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const RoleBasedNavigator = () => {
  const { user } = useUser();
  
  // Get user role - handle different possible field names
  const role = user?.role || user?.userType || 'patient';
  
  console.log('========================================');
  console.log('🔐 [RoleBasedNavigator] User role:', role);
  console.log('🔐 [RoleBasedNavigator] User ID:', user?.id || user?._id);
  console.log('🔐 [RoleBasedNavigator] User name:', user?.name);
  console.log('========================================');

  // Route to appropriate navigator based on role
  switch (role.toLowerCase()) {
    case 'doctor':
      console.log('🔐 [RoleBasedNavigator] Routing to Doctor Dashboard');
      return <DoctorTabNavigator />;
    
    case 'staff':
    case 'receptionist':
    case 'clinic':
    case 'nurse':
    case 'pharmacy':
    case 'lab':
      console.log('🔐 [RoleBasedNavigator] Routing to Staff Dashboard');
      return <StaffTabNavigator />;
    
    case 'admin':
    case 'superadmin':
      console.log('🔐 [RoleBasedNavigator] Routing to Admin Dashboard');
      return <AdminTabNavigator />;
    
    case 'patient':
    default:
      console.log('🔐 [RoleBasedNavigator] Routing to Patient Dashboard');
      return <BottomTabNavigator />;
  }
};

export default RoleBasedNavigator;
