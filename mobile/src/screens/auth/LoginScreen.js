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
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import authService from '../../services/api/authService';
import { useUser } from '../../context/UserContext';
import biometricService from '../../services/biometricService';
import socialAuthService from '../../services/socialAuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'facebook' | 'apple' | null
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
      
      // Offer to enable biometric login if available and not already set up
      if (biometricAvailable && !hasStoredCredentials) {
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
    } finally {
      setLoading(false);
    }
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
      navigation.replace('Main');
    } catch (error) {
      if (error.message !== 'Biometric authentication failed') {
        Alert.alert('Login Failed', 'Unable to sign in with biometrics. Please use your password.');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      const { user, token, isNewUser } = await socialAuthService.signInWithGoogle();
      await login(user, token);
      
      if (isNewUser) {
        Alert.alert('Welcome!', 'Your account has been created successfully.', [
          { text: 'OK', onPress: () => navigation.replace('Main') }
        ]);
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Google Sign-In Failed', error.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading('facebook');
    try {
      const { user, token, isNewUser } = await socialAuthService.signInWithFacebook();
      await login(user, token);
      
      if (isNewUser) {
        Alert.alert('Welcome!', 'Your account has been created successfully.', [
          { text: 'OK', onPress: () => navigation.replace('Main') }
        ]);
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Facebook Sign-In Failed', error.message || 'Unable to sign in with Facebook. Please try again.');
      }
    } finally {
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
      const { user, token, isNewUser } = await socialAuthService.signInWithApple();
      await login(user, token);
      
      if (isNewUser) {
        Alert.alert('Welcome!', 'Your account has been created successfully.', [
          { text: 'OK', onPress: () => navigation.replace('Main') }
        ]);
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.message !== 'Sign in cancelled') {
        Alert.alert('Apple Sign-In Failed', error.message || 'Unable to sign in with Apple. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
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
                <Text style={styles.logoIcon}>+</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>HealthSync</Text>
            <Text style={styles.tagline}>Your health, simplified</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

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
                <Text style={styles.forgotText}>Forgot password?</Text>
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
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                >
                  <View style={styles.biometricIconContainer}>
                    <Text style={styles.biometricIcon}>
                      {biometricType === 'Face ID' ? '👤' : '👆'}
                    </Text>
                  </View>
                  <Text style={styles.biometricText}>
                    {biometricLoading ? 'Authenticating...' : `Sign in with ${biometricType}`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={[styles.socialBtn, socialLoading === 'google' && styles.socialBtnLoading]}
                  onPress={handleGoogleSignIn}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === 'google' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.socialIcon}>G</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialBtn, socialLoading === 'facebook' && styles.socialBtnLoading]}
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
                  style={[styles.socialBtn, socialLoading === 'apple' && styles.socialBtnLoading]}
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
            <Text style={styles.footerText}>Don't have an account? </Text>
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
    color: colors.textInverse,
  },
  appName: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  welcomeText: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
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
    color: colors.primary,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  biometricIconContainer: {
    marginRight: spacing.sm,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
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
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...typography.labelMedium,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnLoading: {
    opacity: 0.7,
  },
  socialIcon: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  signUpLink: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
