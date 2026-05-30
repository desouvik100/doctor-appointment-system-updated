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
  const { colors } = useTheme();
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(0, 212, 170, 0.3)', 'transparent']}
          style={[styles.orb, styles.orb1]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>🔒</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
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

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <Text style={[
                styles.requirement,
                newPassword.length >= 8 && styles.requirementMet,
              ]}>
                {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
              </Text>
              <Text style={[
                styles.requirement,
                /[A-Z]/.test(newPassword) && styles.requirementMet,
              ]}>
                {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
              </Text>
              <Text style={[
                styles.requirement,
                /[a-z]/.test(newPassword) && styles.requirementMet,
              ]}>
                {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
              </Text>
              <Text style={[
                styles.requirement,
                /\d/.test(newPassword) && styles.requirementMet,
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

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -100,
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
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
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
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: spacing.lg,
  },
  requirementsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: -spacing.sm,
  },
  requirementsTitle: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  requirement: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: 2,
  },
  requirementMet: {
    color: colors.success,
  },
});

export default ResetPasswordScreen;
