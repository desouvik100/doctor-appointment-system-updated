/**
 * Login Screen — Premium patient-first design
 * Light theme · icon inputs · focus states · trust badges · proper error handling
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

const { height } = Dimensions.get('window');

// ─── Inline Input with icon + focus glow ────────────────────────────────────
const FancyInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightElement }) => {
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

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['#E5E7EB', '#22C55E'] });
  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor, shadowOpacity, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: focused ? 3 : 0 }]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.inputField}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
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
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(() => {});
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
      // Offer biometric setup — handled silently, no blocking alert
      biometricService.enableBiometricLogin(email.trim().toLowerCase(), password).catch(() => {});
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
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(() => {});
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
      if (userId) NotificationService.registerDeviceAfterLogin(userId).catch(() => {});
      setLoggedInUser(user);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Sign in cancelled') setErrorMsg(error.message || `${provider} sign-in failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      <LoginSuccessAnimation
        visible={showSuccessAnimation}
        userName={loggedInUser?.name || 'User'}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Soft blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Error toast */}
          <ErrorToast message={errorMsg} />

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.logoGradient}>
              <Text style={styles.logoPlus}>+</Text>
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Welcome back 👋</Text>
            <Text style={styles.welcomeSub}>Sign in to your HealthSync account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <FancyInput
              icon="✉️"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              keyboardType="email-address"
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Password</Text>
            <FancyInput
              icon="🔒"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              secureTextEntry={!showPass}
              rightElement={
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={loading ? ['#86EFAC', '#86EFAC'] : ['#22C55E', '#16A34A']} style={styles.signInGradient}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.signInText}>Sign In →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Biometric */}
            {biometricAvailable && hasStoredCredentials ? (
              <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin}>
                <Text style={styles.biometricIcon}>{biometricType === 'Face ID' ? '👤' : '👆'}</Text>
                <Text style={styles.biometricText}>Sign in with {biometricType}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              {[
                { id: 'google',   label: 'G',  color: '#EA4335', bg: '#FEF2F2' },
                { id: 'facebook', label: 'f',  color: '#1877F2', bg: '#EFF6FF' },
                { id: 'apple',    label: '🍎', color: '#000',    bg: '#F9FAFB' },
              ].map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.socialBtn, { backgroundColor: s.bg }]}
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

          {/* Why HealthSync */}
          <View style={styles.whyCard}>
            <Text style={styles.whyTitle}>Why HealthSync?</Text>
            <View style={styles.whyRow}>
              {[
                { icon: '📅', text: 'Book doctors instantly' },
                { icon: '📁', text: 'Store health records' },
                { icon: '🔔', text: 'Get reminders' },
              ].map(w => (
                <View key={w.text} style={styles.whyItem}>
                  <Text style={styles.whyIcon}>{w.icon}</Text>
                  <Text style={styles.whyText}>{w.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },

  blobTop: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  blobBottom: {
    position: 'absolute', bottom: -40, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(22,163,74,0.07)',
  },

  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: 40, paddingTop: spacing.xl },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  backIcon: { fontSize: 20, color: '#374151' },

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
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoPlus: { fontSize: 36, fontWeight: '700', color: '#fff' },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: '#14532D', marginBottom: 6 },
  welcomeSub: { fontSize: 15, color: '#6B7280' },

  form: { marginBottom: spacing.xl },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: spacing.sm },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: borderRadius.lg,
    borderWidth: 1.5, paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: { fontSize: 18, marginRight: spacing.sm },
  inputField: { flex: 1, fontSize: 15, color: '#111827', height: '100%' },
  eyeBtn: { padding: spacing.xs },
  eyeIcon: { fontSize: 18 },

  forgotRow: { alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.xl },
  forgotText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },

  signInBtn: {
    borderRadius: borderRadius.lg, overflow: 'hidden',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  signInBtnDisabled: { shadowOpacity: 0 },
  signInGradient: { paddingVertical: 16, alignItems: 'center' },
  signInText: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  biometricIcon: { fontSize: 20, marginRight: spacing.sm },
  biometricText: { fontSize: 15, color: '#16A34A', fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF', marginHorizontal: spacing.md },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  socialBtn: {
    width: 56, height: 56, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  socialBtnText: { fontSize: 20, fontWeight: '700' },

  whyCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: '#D1FAE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  whyTitle: { fontSize: 14, fontWeight: '700', color: '#14532D', marginBottom: spacing.md },
  whyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  whyItem: { flex: 1, alignItems: 'center' },
  whyIcon: { fontSize: 22, marginBottom: 4 },
  whyText: { fontSize: 11, color: '#6B7280', textAlign: 'center', fontWeight: '500' },

  signUpRow: { flexDirection: 'row', justifyContent: 'center' },
  signUpText: { fontSize: 14, color: '#6B7280' },
  signUpLink: { fontSize: 14, color: '#22C55E', fontWeight: '700' },
});

export default LoginScreen;
