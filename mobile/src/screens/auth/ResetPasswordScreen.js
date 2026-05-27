/**
 * Reset Password Screen - Set new password after OTP verification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import authService from '../../services/api/authService';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { colors, isDarkMode } = useTheme();

  const validatePassword = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const bgColors = isDarkMode
    ? ['#0A0E17', '#121826', '#1A1F2E']
    : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  const orb1Colors = isDarkMode
    ? ['rgba(0, 212, 170, 0.12)', 'transparent']
    : ['rgba(0, 212, 170, 0.06)', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      
      {/* Ambient background mesh */}
      <View style={styles.orbContainer}>
        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
        <View style={styles.orb1}>
          <LinearGradient colors={orb1Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>🔒</Text>
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, { color: colors.textPrimary }]}>Create New Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your new password must be different from previously used passwords
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: '' });
                }
              }}
              error={errors.newPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' });
                }
              }}
              error={errors.confirmPassword}
              secureTextEntry
            />

            <View style={[styles.requirementsContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
              <Text style={[styles.requirementsTitle, { color: colors.textPrimary }]}>Password must contain:</Text>
              <Text style={[
                styles.requirement,
                { color: colors.textMuted },
                newPassword.length >= 8 && { color: colors.success },
              ]}>
                {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
              </Text>
              <Text style={[
                styles.requirement,
                { color: colors.textMuted },
                /[A-Z]/.test(newPassword) && { color: colors.success },
              ]}>
                {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
              </Text>
              <Text style={[
                styles.requirement,
                { color: colors.textMuted },
                /[a-z]/.test(newPassword) && { color: colors.success },
              ]}>
                {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
              </Text>
              <Text style={[
                styles.requirement,
                { color: colors.textMuted },
                /\d/.test(newPassword) && { color: colors.success },
              ]}>
                {/\d/.test(newPassword) ? '✓' : '○'} One number
              </Text>
            </View>

            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              fullWidth
              size="large"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -50,
    right: -100,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    ...typography.headlineLarge,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: spacing.lg,
  },
  requirementsContainer: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: -spacing.sm,
  },
  requirementsTitle: {
    ...typography.labelMedium,
    marginBottom: spacing.xs,
  },
  requirement: {
    ...typography.bodySmall,
    marginBottom: 2,
  },
});

export default ResetPasswordScreen;
