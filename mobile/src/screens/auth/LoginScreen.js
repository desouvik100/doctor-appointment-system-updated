/**
 * Login Screen — Premium patient-first design
 * Dynamic light/dark theme · icon inputs · focus states · trust badges · proper error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, Animated,
  TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { spacing, borderRadius } from '../../theme/typography';
import LoginSuccessAnimation from '../../components/common/LoginSuccessAnimation';
import authService from '../../services/api/authService';
import { useUser } from '../../context/UserContext';
import biometricService from '../../services/biometricService';
import socialAuthService from '../../services/socialAuthService';
import NotificationService from '../../services/notifications/NotificationService';
import { useTheme } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

// ─── Inline Input with icon + focus glow ────────────────────────────────────
const FancyInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightElement, colors }) => {
  const [focused, setFocused] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceBorder || '#E5E7EB', colors.primary || '#00D4AA']
  });
  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor, shadowOpacity, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: focused ? 3 : 0 }]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={[styles.inputField, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted || '#9CA3AF'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {rightElement ? rightElement : null}
    </Animated.View>
  );
};

// ─── Error toast ─────────────────────────────────────────────────────────────
const ErrorToast = ({ message }) => {
  const slideAnim = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, [message]);
  if (!message) return null;
  return (
    <Animated.View style={[styles.errorToast, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.errorToastIcon}>⚠️</Text>
      <Text style={styles.errorToastText}>{message}</Text>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [biometricAvailable, setBiometricAvailable]       = useState(false);
  const [biometricType, setBiometricType]                 = useState(null);
  const [hasStoredCredentials, setHasStoredCredentials]   = useState(false);
  const [socialLoading, setSocialLoading]                 = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation]   = useState(false);
  const [loggedInUser, setLoggedInUser]                   = useState(null);
  const [isEmailLogin, setIsEmailLogin]                   = useState(false);
  const { login } = useUser();

  useEffect(() => {
    biometricService.isBiometricAvailable().then(({ available, biometryName }) => {
      setBiometricAvailable(available);
      setBiometricType(biometryName);
      if (available) biometricService.hasStoredCredentials().then(setHasStoredCredentials);
    });
  }, []);

  const clearError = () => setErrorMsg('');

  const handleLogin = async () => {
    clearError();
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const { user, token } = await authService.login({ email: email.trim().toLowerCase(), password });
      await login(user, token);
      const userId = user?.id || user?._id;
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(err => console.warn('Device registration failed:', err.message));
      setLoggedInUser(user);
      setIsEmailLogin(true);
      setShowSuccessAnimation(true);
    } catch (error) {
      let msg = 'Login failed. Please check your credentials.';
      if (error.statusCode === 0 || error.code === 'ERR_NETWORK') {
        msg = 'Network error. Please check your internet connection.';
      } else if (error.statusCode === 401 || error.statusCode === 400) {
        msg = 'Invalid email or password. Please try again.';
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    if (isEmailLogin && biometricAvailable && !hasStoredCredentials && email && password) {
      biometricService.enableBiometricLogin(email.trim().toLowerCase(), password).catch(err => console.warn('Biometric setup failed:', err.message));
    }
    navigation.replace('Main');
    setIsEmailLogin(false);
  };

  const handleBiometricLogin = async () => {
    try {
      const credentials = await biometricService.biometricLogin();
      const { user, token } = await authService.login({ email: credentials.email, password: credentials.password });
      await login(user, token);
      const userId = user?.id || user?._id;
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(err => console.warn('Device registration failed:', err.message));
      setLoggedInUser(user);
      setShowSuccessAnimation(true);
    } catch {
      setErrorMsg('Biometric login failed. Please use your password.');
    }
  };

  const handleSocial = async (provider) => {
    setSocialLoading(provider);
    clearError();
    try {
      const fn = provider === 'google' ? socialAuthService.signInWithGoogle
               : provider === 'facebook' ? socialAuthService.signInWithFacebook
               : socialAuthService.signInWithApple;
      const { user, token } = await fn();
      await login(user, token);
      const userId = user?.id || user?._id;
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(err => console.warn('Device registration failed:', err.message));
      setLoggedInUser(user);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Sign in cancelled') setErrorMsg(error.message || `${provider} sign-in failed.`);
    } finally {
      setSocialLoading(null);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
        <View style={styles.orb1}>
          <LinearGradient colors={orb1Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
        <View style={styles.orb2}>
          <LinearGradient colors={orb2Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
      </View>

      <LoginSuccessAnimation
        visible={showSuccessAnimation}
        userName={loggedInUser?.name || 'User'}
        onAnimationComplete={handleAnimationComplete}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>

          {/* Error toast */}
          <ErrorToast message={errorMsg} />

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={colors.primaryGradient || colors.gradientPrimary || ['#00D4AA', '#00B894']} style={styles.logoGradient}>
              <Text style={styles.logoPlus}>+</Text>
            </LinearGradient>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Welcome back 👋</Text>
            <Text style={[styles.welcomeSub, { color: colors.textSecondary }]}>Sign in to your HealthSync account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Email address</Text>
            <FancyInput
              icon="✉️"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
              colors={colors}
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg, color: colors.textPrimary }]}>Password</Text>
            <FancyInput
              icon="🔒"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry={!showPass}
              colors={colors}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={loading ? [colors.primaryLight, colors.primaryLight] : (colors.primaryGradient || colors.gradientPrimary || ['#00D4AA', '#00B894'])} style={styles.signInGradient}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.signInText}>Sign In →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Biometric */}
            {biometricAvailable && hasStoredCredentials ? (
              <TouchableOpacity style={[styles.biometricBtn, { borderColor: colors.primaryLight, backgroundColor: colors.surface }]} onPress={handleBiometricLogin}>
                <Text style={styles.biometricIcon}>{biometricType === 'Face ID' ? '👤' : '👆'}</Text>
                <Text style={[styles.biometricText, { color: colors.primary }]}>Sign in with {biometricType}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              {[
                { id: 'google',   label: 'G',  color: '#EA4335', bg: isDarkMode ? 'rgba(234, 67, 53, 0.1)' : '#FFF5F5' },
                { id: 'facebook', label: 'f',  color: '#1877F2', bg: isDarkMode ? 'rgba(24, 119, 242, 0.1)' : '#F0F5FF' },
                { id: 'apple',    label: '🍎', color: colors.textPrimary, bg: colors.surface },
              ].map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.socialBtn,
                    {
                      backgroundColor: s.bg,
                      borderColor: colors.surfaceBorder,
                      borderWidth: isDarkMode ? 1 : 0,
                    }
                  ]}
                  onPress={() => handleSocial(s.id)}
                  disabled={socialLoading !== null}
                  activeOpacity={0.8}
                >
                  {socialLoading === s.id
                    ? <ActivityIndicator size="small" color={s.color} />
                    : <Text style={[styles.socialBtnText, { color: s.color }]}>{s.label}</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Premium Trust Statement */}
          <View style={[styles.trustCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>
              🔐 Your health records and personal data are fully protected under HIPAA compliance standards and 256-bit bank-grade encryption.
            </Text>
          </View>

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -50, right: -100 },
  orb2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, bottom: -50, left: -100 },
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: 40, paddingTop: spacing.huge },

  backBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  backIcon: { fontSize: 20 },

  errorToast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: '#FECACA',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  errorToastIcon: { fontSize: 16, marginRight: spacing.sm },
  errorToastText: { flex: 1, fontSize: 14, color: '#DC2626', fontWeight: '500' },

  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoGradient: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  logoPlus: { fontSize: 36, fontWeight: '700', color: '#fff' },
  welcomeTitle: { fontSize: 26, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 15 },

  form: { marginBottom: spacing.xl },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5, paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: { fontSize: 18, marginRight: spacing.sm },
  inputField: { flex: 1, fontSize: 15, height: '100%' },
  eyeBtn: { padding: spacing.xs },
  eyeIcon: { fontSize: 18 },

  forgotRow: { alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.xl },
  forgotText: { fontSize: 13, fontWeight: '600' },

  signInBtn: {
    borderRadius: borderRadius.lg, overflow: 'hidden',
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInGradient: { paddingVertical: 16, alignItems: 'center' },
  signInText: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, borderWidth: 1.5,
  },
  biometricIcon: { fontSize: 20, marginRight: spacing.sm },
  biometricText: { fontSize: 15, fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, marginHorizontal: spacing.md },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  socialBtn: {
    width: 56, height: 56, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  socialBtnText: { fontSize: 20, fontWeight: '700' },

  trustCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trustText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },

  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
  signUpText: { fontSize: 14 },
  signUpLink: { fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
