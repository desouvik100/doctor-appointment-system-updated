/**
 * Pro Role-Based Navigator - Routes to Doctor, Staff, or Admin dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../context/UserContext';
import DoctorTabNavigator from './DoctorTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const UnauthorizedScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Access Denied</Text>
    <Text style={styles.sub}>This app is for clinical staff only.</Text>
  </View>
);

const ProRoleBasedNavigator = () => {
  const { user } = useUser();
  const role = user?.role || user?.userType || '';

  switch (role.toLowerCase()) {
    case 'doctor':
      return <DoctorTabNavigator />;
    case 'staff':
    case 'receptionist':
    case 'clinic':
    case 'nurse':
    case 'pharmacy':
    case 'lab':
      return <StaffTabNavigator />;
    case 'admin':
    case 'superadmin':
      return <AdminTabNavigator />;
    default:
      return <UnauthorizedScreen />;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8 },
  sub: { fontSize: 15, color: '#888', textAlign: 'center' },
});

export default ProRoleBasedNavigator;
