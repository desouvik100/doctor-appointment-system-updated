/**
 * Doctor Login Screen - Futuristic Medical Professional Portal
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
// Direct import to avoid circular dependency issues
import { doctorLogin } from '../../services/api/authService';
import { useUser } from '../../context/UserContext';
import whatsappService from '../../services/whatsappService';

const DoctorLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    
    // DEBUG: Log payload and URL
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    console.log('🔵 [DOCTOR LOGIN] PAYLOAD:', { email: payload.email, password: '***' });
    console.log('🔵 [DOCTOR LOGIN] ENDPOINT: /auth/doctor/login');
    
    try {
      // Use direct import of doctorLogin function
      const { user, token } = await doctorLogin(payload);
      
      // DEBUG: Log success
      console.log('✅ [DOCTOR LOGIN] SUCCESS');
      console.log('✅ [DOCTOR LOGIN] TOKEN RECEIVED:', token ? 'YES' : 'NO');
      console.log('✅ [DOCTOR LOGIN] USER:', user?.email, user?.role);
      
      await login(user, token);
      navigation.replace('Main');
    } catch (error) {
      // DEBUG: Log full error details
      console.log('❌ [DOCTOR LOGIN] ERROR STATUS:', error.statusCode);
      console.log('❌ [DOCTOR LOGIN] ERROR MESSAGE:', error.message);
      console.log('❌ [DOCTOR LOGIN] ERROR CODE:', error.code);
      console.log('❌ [DOCTOR LOGIN] FULL ERROR:', JSON.stringify(error, null, 2));
      
      let message = 'Login failed. Please check your credentials.';
      let title = 'Login Failed';
      
      // Check for network/connection errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        title = 'Server Starting Up';
        message = 'The server is waking up (free tier hosting). Please wait 30-60 seconds and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.statusCode === 0) {
        title = 'Connection Error';
        message = 'Cannot connect to server. The server may be starting up. Please wait a moment and try again.';
      } else if (error.statusCode === 403) {
        // Handle suspended/pending/rejected accounts
        if (error.message?.includes('suspended')) {
          title = 'Account Suspended';
        } else if (error.message?.includes('pending')) {
          title = 'Pending Approval';
        } else if (error.message?.includes('rejected')) {
          title = 'Account Rejected';
        }
        message = error.message;
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.orb, styles.orb1]}>
          <LinearGradient
            colors={['rgba(108, 92, 231, 0.4)', 'transparent']}
            style={styles.orbGradient}
          />
        </View>
        <View style={[styles.orb, styles.orb2]}>
          <LinearGradient
            colors={['rgba(162, 155, 254, 0.2)', 'transparent']}
            style={styles.orbGradient}
          />
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
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Animated.View 
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#6C5CE7', '#A29BFE']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.icon}>👨‍⚕️</Text>
                </LinearGradient>
                <View style={styles.iconRing} />
                <View style={styles.iconRing2} />
              </Animated.View>
              
              <Text style={styles.title}>Doctor Portal</Text>
              <Text style={styles.subtitle}>Access your medical dashboard</Text>
              
              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Secure Connection</Text>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Medical ID / Email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="doctor@hospital.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotText}>Forgot credentials?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#4A4A5A', '#3A3A4A'] : ['#6C5CE7', '#A29BFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  {loading ? (
                    <Text style={styles.loginText}>Authenticating...</Text>
                  ) : (
                    <>
                      <Text style={styles.loginText}>Access Dashboard</Text>
                      <Text style={styles.loginArrow}>→</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(108, 92, 231, 0.2)' }]}>
                    <Text>🆔</Text>
                  </View>
                  <Text style={styles.quickText}>ID Card Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(108, 92, 231, 0.2)' }]}>
                    <Text>👆</Text>
                  </View>
                  <Text style={styles.quickText}>Biometric</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickIcon, { backgroundColor: 'rgba(108, 92, 231, 0.2)' }]}>
                    <Text>📱</Text>
                  </View>
                  <Text style={styles.quickText}>OTP Login</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => whatsappService.contactSupport('Hi! I need IT support for Doctor Portal.')}>
                <Text style={styles.footerText}>
                  Need help? Contact IT Support
                </Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>v2.0.0 • HIPAA Compliant</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  orb1: {
    width: 350,
    height: 350,
    top: -100,
    right: -150,
  },
  orb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 50,
  },
  iconRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    top: -10,
    left: -10,
  },
  iconRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.15)',
    top: -20,
    left: -20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: '#00D4AA',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.lg,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    fontSize: 18,
    padding: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotText: {
    color: '#A29BFE',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginArrow: {
    color: '#fff',
    fontSize: 20,
    marginLeft: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxl,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.xs,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
});

export default DoctorLoginScreen;
