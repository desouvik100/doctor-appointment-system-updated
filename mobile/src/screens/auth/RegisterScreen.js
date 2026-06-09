/**
 * Register Screen - User Registration with Form Validation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import authService from '../../services/api/authService';
import socialAuthService from '../../services/socialAuthService';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import Svg, { Path } from 'react-native-svg';

// ─── Branded SVG Logos ───────────────────────────────────────────────────────
const GoogleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </Svg>
);

const FacebookIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </Svg>
);

const AppleIcon = ({ color }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24">
    <Path fill={color || "#000"} d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
  </Svg>
);

const RegisterScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const { login } = useUser();

  const bgColors = isDarkMode
    ? ['#0A0E17', '#121826', '#1A1F2E']
    : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  const orb1Colors = isDarkMode
    ? ['rgba(0, 212, 170, 0.12)', 'transparent']
    : ['rgba(0, 212, 170, 0.06)', 'transparent'];
  const orb2Colors = isDarkMode
    ? ['rgba(108, 92, 231, 0.1)', 'transparent']
    : ['rgba(108, 92, 231, 0.05)', 'transparent'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Step 1: Send OTP to email for verification
      console.log('📧 Sending registration OTP to:', formData.email.trim().toLowerCase());
      await authService.sendRegistrationOTP(formData.email.trim().toLowerCase());

      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', { 
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        password: formData.password,
        isRegistration: true,
      });
    } catch (error) {
      console.error('❌ Registration OTP error:', error);
      const message = error.response?.data?.message || 'Failed to send verification code. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading('google');
    try {
      const { user, token, isNewUser } = await socialAuthService.signInWithGoogle();
      await login(user, token);
      
      Alert.alert(
        isNewUser ? 'Welcome!' : 'Welcome Back!', 
        isNewUser ? 'Your account has been created successfully.' : 'You have been signed in.',
        [{ text: 'OK', onPress: () => navigation.replace('Main') }]
      );
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Google Sign-Up Failed', error.message || 'Unable to sign up with Google. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignUp = async () => {
    setSocialLoading('facebook');
    try {
      const { user, token, isNewUser } = await socialAuthService.signInWithFacebook();
      await login(user, token);
      
      Alert.alert(
        isNewUser ? 'Welcome!' : 'Welcome Back!', 
        isNewUser ? 'Your account has been created successfully.' : 'You have been signed in.',
        [{ text: 'OK', onPress: () => navigation.replace('Main') }]
      );
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Facebook Sign-Up Failed', error.message || 'Unable to sign up with Facebook. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      const { user, token, isNewUser } = await socialAuthService.signInWithApple();
      await login(user, token);
      
      Alert.alert(
        isNewUser ? 'Welcome!' : 'Welcome Back!', 
        isNewUser ? 'Your account has been created successfully.' : 'You have been signed in.',
        [{ text: 'OK', onPress: () => navigation.replace('Main') }]
      );
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Apple Sign-Up Failed', error.message || 'Unable to sign up with Apple. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      
      {/* Ambient background mesh */}
      <View style={styles.orbContainer}>
        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
        <View style={styles.orb1}>
          <LinearGradient colors={orb1Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
        <View style={styles.orb2}>
          <LinearGradient colors={orb2Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  borderWidth: isDarkMode ? 1 : 0,
                }
              ]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Join HealthSync today</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                error={errors.name}
                autoCapitalize="words"
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Phone Number"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                error={errors.phone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                error={errors.password}
                secureTextEntry
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <View style={styles.termsContainer}>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  By signing up, you agree to our{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
                </Text>
              </View>

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                fullWidth
                size="large"
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or sign up with</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              </View>

              {/* Social Sign Up */}
              <View style={styles.socialStack}>
                {[
                  { id: 'google',   label: 'Sign up with Google',   icon: <GoogleIcon />,       color: colors.textPrimary, bg: colors.surface, onPress: handleGoogleSignUp },
                  { id: 'facebook', label: 'Sign up with Facebook', icon: <FacebookIcon />,     color: '#1877F2',          bg: isDarkMode ? 'rgba(24, 119, 242, 0.1)' : '#F0F5FF', onPress: handleFacebookSignUp },
                  { id: 'apple',    label: 'Sign up with Apple',    icon: <AppleIcon color={colors.textPrimary} />, color: colors.textPrimary, bg: colors.surface, onPress: handleAppleSignUp },
                ].map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.socialBtnPremium,
                      {
                        backgroundColor: s.bg,
                        borderColor: colors.surfaceBorder,
                        borderWidth: 1.5,
                      }
                    ]}
                    onPress={s.onPress}
                    disabled={socialLoading !== null}
                    activeOpacity={0.8}
                  >
                    {socialLoading === s.id ? (
                      <ActivityIndicator size="small" color={s.color} />
                    ) : (
                      <View style={styles.socialBtnContent}>
                        {s.icon}
                        <Text style={[styles.socialBtnTextPremium, { color: colors.textPrimary }]}>{s.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  orb2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -50,
    left: -100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
  },
  headerTitle: {
    ...typography.headlineLarge,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodyLarge,
  },
  formContainer: {
    flex: 1,
  },
  form: {
    gap: spacing.xs,
  },
  termsContainer: {
    marginVertical: spacing.md,
  },
  termsText: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.labelMedium,
    marginHorizontal: spacing.lg,
  },
  socialStack: { gap: spacing.md, width: '100%' },
  socialBtnPremium: {
    height: 52, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    paddingHorizontal: spacing.lg,
  },
  socialBtnContent: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  socialBtnTextPremium: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.bodyMedium,
  },
  signInLink: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});

export default RegisterScreen;
