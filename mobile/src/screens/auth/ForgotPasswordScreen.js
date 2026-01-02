/**
 * Forgot Password Screen - Password Reset Flow
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
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { authService } from '../../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      Alert.alert('Success', 'Reset link sent again!');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        <View style={styles.orbContainer}>
          <LinearGradient
            colors={['rgba(0, 212, 170, 0.3)', 'transparent']}
            style={[styles.orb, styles.orb1]}
          />
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>✉️</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>What to do next:</Text>
              <Text style={styles.instruction}>1. Open your email app</Text>
              <Text style={styles.instruction}>2. Look for email from HealthSync</Text>
              <Text style={styles.instruction}>3. Click the reset link</Text>
              <Text style={styles.instruction}>4. Create a new password</Text>
            </View>

            <Button
              title="Open Email App"
              onPress={() => {}}
              fullWidth
              size="large"
            />

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResend}
              disabled={loading}
            >
              <Text style={styles.resendText}>
                {loading ? 'Sending...' : "Didn't receive email? Resend"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
                <Text style={styles.icon}>🔐</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError('');
              }}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={loading}
              fullWidth
              size="large"
            />
          </View>

          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: spacing.xl,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  backToLoginText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '500',
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  emailText: {
    color: colors.primary,
    fontWeight: '600',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  instructionsTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  instruction: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resendButton: {
    marginTop: spacing.lg,
  },
  resendText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;
