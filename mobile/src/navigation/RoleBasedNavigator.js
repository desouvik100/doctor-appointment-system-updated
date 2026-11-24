

import React from 'react';
import { useUser } from '../context/UserContext';
import BottomTabNavigator from './BottomTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const RoleBasedNavigator = () => {
  const { user } = useUser();
  const role = user?.role || user?.userType || 'patient';
  
  console.log('========================================');
  console.log('🔐 [RoleBasedNavigator] User role:', role);
  console.log('🔐 [RoleBasedNavigator] User ID:', user?.id || user?._id);
  console.log('🔐 [RoleBasedNavigator] User name:', user?.name);
  console.log('========================================');
  switch (role.toLowerCase()) {
    case 'doctor':
      console.log('🔐 [RoleBasedNavigator] Routing to Doctor Dashboard');
    console.log('DEBUG: RoleBasedNavigator.js')
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
