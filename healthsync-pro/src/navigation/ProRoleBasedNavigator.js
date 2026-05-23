/**
 * Pro Role-Based Navigator - Routes to Doctor, Staff, Admin, or Patient dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../context/UserContext';
import DoctorTabNavigator from './DoctorTabNavigator';
import StaffTabNavigator from './StaffTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const UnauthorizedScreen = () => (
  <View style={styles.container}>
    <Text style={styles.icon}>🔒</Text>
    <Text style={styles.text}>Access Denied</Text>
    <Text style={styles.sub}>
      This app is for clinical staff only.{'\n'}
      Patients should use the HealthSync web app at healthsyncpro.in
    </Text>
  </View>
);

const ProRoleBasedNavigator = () => {
  const { user } = useUser();
  const role = (user?.role || user?.userType || '').toLowerCase();

  switch (role) {
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

    // Patients are redirected to web — mobile app is staff-only
    case 'patient':
    default:
      return <UnauthorizedScreen />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0A0E17',
  },
  icon: { fontSize: 56, marginBottom: 16 },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProRoleBasedNavigator;
