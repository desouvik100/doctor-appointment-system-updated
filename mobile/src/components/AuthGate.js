/**
 * AuthGate - Prevents navigation before auth is resolved
 * Wraps the app to ensure context is ready before rendering
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const AuthGate = ({ children }) => {
  const { loading: userLoading } = useUser();
  const { colors } = useTheme();

  // Show loading screen while auth is being resolved
  if (userLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors?.background || '#0f172a' }]}>
        <View style={styles.content}>
          <Text style={styles.logo}>🏥</Text>
          <Text style={[styles.title, { color: colors?.textPrimary || '#fff' }]}>HealthSync</Text>
          <ActivityIndicator size="large" color={colors?.primary || '#6366f1'} style={styles.loader} />
          <Text style={[styles.loadingText, { color: colors?.textSecondary || '#94a3b8' }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default AuthGate;
