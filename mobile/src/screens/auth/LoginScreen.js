/**
 * Login Screen - Modern Startup Design with Biometric Authentication
 */

import React, { useState, useEffect } from 'react';
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
import { shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoginSuccessAnimation from '../../components/common/LoginSuccessAnimation';
import authService from '../../services/api/authService';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import biometricService from '../../services/biometricService';
import socialAuthService from '../../services/socialAuthService';
import NotificationService from '../../services/notifications/NotificationService';

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'facebook' | 'apple' | null
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const { login } = useUser();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const { available, biometryName } = await biometricService.isBiometricAvailable();
    setBiometricAvailable(available);
    setBiometricType(biometryName);
    
    if (available) {
      const hasCredentials = await biometricService.hasStoredCredentials();
      setHasStoredCredentials(hasCredentials);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await login(user, token);
      
      // Register device for push notifications after successful login
      const userId = user?.id || user?._id;
      if (userId) {
        NotificationService.registerDeviceAfterLogin(userId).catch(err => {
          console.log('Device registration after login failed:', err.message);
        });
      }
      
      setLoggedInUser(user);
      setIsEmailLogin(true);
      setLoading(false);
      
      // Show success animation
      setShowSuccessAnimation(true);
    } catch (error) {
      console.log('Login error:', error);
      let message = 'Login failed. Please check your credentials.';
      
      if (error.statusCode === 0) {
        message = 'Network error. Please check your internet connection and try again.';
      } else if (error.statusCode === 401) {
        message = 'Invalid email or password.';
      } else if (error.message) {
        message = error.message;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Alert.alert('Login Failed', message);
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    
    // Check for biometric setup only for email/password login
    if (isEmailLogin && biometricAvailable && !hasStoredCredentials && email && password) {
      Alert.alert(
        `Enable ${biometricType}?`,
        `Would you like to use ${biometricType} for faster sign-in next time?`,
        [
          { text: 'Not Now', style: 'cancel', onPress: () => navigation.replace('Main') },
          { 
            text: 'Enable', 
            onPress: async () => {
              try {
                await biometricService.enableBiometricLogin(email.trim().toLowerCase(), password);
                navigation.replace('Main');
              } catch (error) {
                navigation.replace('Main');
              }
            }
          },
        ]
      );
    } else {
      navigation.replace('Main');
    }
    
    // Reset state
    setIsEmailLogin(false);
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const credentials = await biometricService.biometricLogin();
      
      const { user, token } = await authService.login({
        email: credentials.email,
        password: credentials.password,
      });
      await login(user, token);
      
      // Register device for push notifications
      const userId = user?.id || user?._id;
      if (userId) {
        NotificationService.registerDeviceAfterLogin(userId).catch(err => {
          console.log('Device registration after login failed:', err.message);
        });
      }
      
      setLoggedInUser(user);
      setBiometricLoading(false);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Biometric authentication failed') {
        Alert.alert('Login Failed', 'Unable to sign in with biometrics. Please use your password.');
      }
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      const { user, token } = await socialAuthService.signInWithGoogle();
      await login(user, token);
      
      // Register device for push notifications
      const userId = user?.id || user?._id;
      if (userId) {
        NotificationService.registerDeviceAfterLogin(userId).catch(err => {
          console.log('Device registration after login failed:', err.message);
        });
      }
      
      setLoggedInUser(user);
      setSocialLoading(null);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Google Sign-In Failed', error.message || 'Unable to sign in with Google. Please try again.');
      }
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading('facebook');
    try {
      const { user, token } = await socialAuthService.signInWithFacebook();
      await login(user, token);
      
      // Register device for push notifications
      const userId = user?.id || user?._id;
      if (userId) {
        NotificationService.registerDeviceAfterLogin(userId).catch(err => {
          console.log('Device registration after login failed:', err.message);
        });
      }
      
      setLoggedInUser(user);
      setSocialLoading(null);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Facebook Sign-In Failed', error.message || 'Unable to sign in with Facebook. Please try again.');
      }
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
      return;
    }
    
    setSocialLoading('apple');
    try {
      const { user, token } = await socialAuthService.signInWithApple();
      await login(user, token);
      
      // Register device for push notifications
      const userId = user?.id || user?._id;
      if (userId) {
        NotificationService.registerDeviceAfterLogin(userId).catch(err => {
          console.log('Device registration after login failed:', err.message);
        });
      }
      
      setLoggedInUser(user);
      setSocialLoading(null);
      setShowSuccessAnimation(true);
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Apple Sign-In Failed', error.message || 'Unable to sign in with Apple. Please try again.');
      }
      setSocialLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      
      {/* Login Success Animation */}
      <LoginSuccessAnimation
        visible={showSuccessAnimation}
        userName={loggedInUser?.name || 'User'}
        onAnimationComplete={handleAnimationComplete}
      />
      
      {/* Background gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(0, 212, 170, 0.3)', 'transparent']}
          style={[styles.orb, styles.orb1]}
        />
        <LinearGradient
          colors={['rgba(108, 92, 231, 0.25)', 'transparent']}
          style={[styles.orb, styles.orb2]}
        />
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
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.logoGradient}
              >
                <Text style={[styles.logoIcon, { color: colors.textInverse }]}>+</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>HealthSync</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your health, simplified</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="large"
              />

              {/* Biometric Login Button */}
              {biometricAvailable && hasStoredCredentials && (
                <TouchableOpacity
                  style={[styles.biometricButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                >
                  <View style={styles.biometricIconContainer}>
                    <Text style={styles.biometricIcon}>
                      {biometricType === 'Face ID' ? '👤' : '👆'}
                    </Text>
                  </View>
                  <Text style={[styles.biometricText, { color: colors.textPrimary }]}>
                    {biometricLoading ? 'Authenticating...' : `Sign in with ${biometricType}`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              </View>

              {/* Social Login */}
              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, socialLoading === 'google' && styles.socialBtnLoading]}
                  onPress={handleGoogleSignIn}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'google' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.socialIcon, { color: colors.textPrimary }]}>G</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, socialLoading === 'facebook' && styles.socialBtnLoading]}
                  onPress={handleFacebookSignIn}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'facebook' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, socialLoading === 'apple' && styles.socialBtnLoading]}
                  onPress={handleAppleSignIn}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'apple' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.socialIcon}>🍎</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
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
  container: {
    flex: 1,
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
  orb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge + spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  logoIcon: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  appName: {
    ...typography.displayMedium,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodyLarge,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    ...typography.headlineLarge,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...typography.labelMedium,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  biometricIconContainer: {
    marginRight: spacing.sm,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.labelMedium,
    marginHorizontal: spacing.lg,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnLoading: {
    opacity: 0.7,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    ...typography.bodyMedium,
  },
  signUpLink: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});

export default LoginScreen;
