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
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import authService from '../../services/api/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
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
      console.log('🔐 Requesting password reset for:', email.trim().toLowerCase());
      const response = await authService.requestPasswordReset(email.trim().toLowerCase());
      console.log('✅ Password reset response:', response);
      // Navigate to OTP verification screen
      navigation.navigate('VerifyOTP', { email: email.trim().toLowerCase() });
    } catch (err) {
      console.error('❌ Password reset error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to send reset link. Please try again.';
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

  const bgColors = isDarkMode
    ? ['#0A0E17', '#121826', '#1A1F2E']
    : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  const orb1Colors = isDarkMode
    ? ['rgba(0, 212, 170, 0.12)', 'transparent']
    : ['rgba(0, 212, 170, 0.06)', 'transparent'];
  const orb2Colors = isDarkMode
    ? ['rgba(108, 92, 231, 0.1)', 'transparent']
    : ['rgba(108, 92, 231, 0.05)', 'transparent'];

  if (sent) {
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

        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <LinearGradient
                colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>✉️</Text>
              </LinearGradient>
            </View>
            
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Check your email</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              We've sent a password reset link to{'\n'}
              <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
            </Text>

            <View style={[styles.instructionsContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.instructionsTitle, { color: colors.textPrimary }]}>What to do next:</Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>1. Open your email app</Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>2. Look for email from HealthSync</Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>3. Click the reset link</Text>
              <Text style={[styles.instruction, { color: colors.textSecondary }]}>4. Create a new password</Text>
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
              <Text style={[styles.resendText, { color: colors.primary }]}>
                {loading ? 'Sending...' : "Didn't receive email? Resend"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.backToLoginText, { color: colors.primary }]}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
                <Text style={styles.icon}>🔐</Text>
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
            <Text style={[styles.backToLoginText, { color: colors.primary }]}>← Back to Sign In</Text>
          </TouchableOpacity>
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
    ...typography.bodyLarge,
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
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.bodyLarge,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  emailText: {
    fontWeight: '600',
  },
  instructionsContainer: {
    width: '100%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
  },
  instructionsTitle: {
    ...typography.labelLarge,
    marginBottom: spacing.md,
  },
  instruction: {
    ...typography.bodyMedium,
    marginBottom: spacing.sm,
  },
  resendButton: {
    marginTop: spacing.lg,
  },
  resendText: {
    ...typography.bodyMedium,
  },
});

export default ForgotPasswordScreen;
