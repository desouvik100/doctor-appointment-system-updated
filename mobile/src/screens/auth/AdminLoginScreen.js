/**
 * Admin Login Screen - System Control Center
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
import { spacing, borderRadius } from '../../theme/typography';
import { authService } from '../../services/api';
import { useUser } from '../../context/UserContext';

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
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
    try {
      const { user, token } = await authService.adminLogin({
        email: email.trim().toLowerCase(),
        password,
      });
      
      await login(user, token);
      navigation.replace('Main');
    } catch (error) {
      let message = 'Login failed. Please check your credentials.';
      let title = 'Login Failed';
      
      // Check for network/connection errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        title = 'Server Starting Up';
        message = 'The server is waking up (free tier hosting). Please wait 30-60 seconds and try again.';
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        title = 'Connection Error';
        message = 'Cannot connect to server. The server may be starting up. Please wait a moment and try again.';
      } else if (error.response?.status === 400) {
        message = error.response.data?.message || 'Invalid admin credentials. Please check your email and password.';
      } else if (error.response?.status === 403) {
        message = error.response.data?.message || 'Your admin account has been suspended.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Alert.alert(title, message, [
        { text: 'OK' },
        { 
          text: 'Retry', 
          onPress: () => setTimeout(handleLogin, 1000) 
        }
      ]);
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
          colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']}
          style={StyleSheet.absoluteFill}
        />
        
        <Animated.View style={[styles.orb, styles.orb1, { opacity: glowAnim }]}>
          <LinearGradient
            colors={['rgba(243, 156, 18, 0.5)', 'transparent']}
            style={styles.orbGradient}
          />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orb2, { opacity: glowAnim }]}>
          <LinearGradient
            colors={['rgba(241, 196, 15, 0.3)', 'transparent']}
            style={styles.orbGradient}
          />
        </Animated.View>

        <View style={styles.hexGrid}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={[styles.hexDot, { 
              left: `${(i % 5) * 25}%`, 
              top: `${Math.floor(i / 5) * 25}%` 
            }]} />
          ))}
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
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#F39C12', '#F1C40F']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.icon}>🛡️</Text>
                </LinearGradient>
                <View style={styles.iconRing} />
              </View>
              
              <Text style={styles.title}>Admin Login</Text>
              <Text style={styles.subtitle}>Access the control center</Text>
              
              <View style={styles.securityBadge}>
                <Text style={styles.lockIcon}>🔐</Text>
                <Text style={styles.securityText}>Secure Authentication</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Admin Email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="admin@healthsync.com"
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
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin password"
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

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#4A4A5A', '#3A3A4A'] : ['#F39C12', '#F1C40F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginText}>
                    {loading ? 'Authenticating...' : 'Access System'}
                  </Text>
                  {!loading && <Text style={styles.loginArrow}>🔓</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.systemStatus}>
                <View style={styles.statusRow}>
                  <View style={styles.statusItem}>
                    <View style={[styles.statusIndicator, styles.statusGreen]} />
                    <Text style={styles.statusLabel}>System Online</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <View style={[styles.statusIndicator, styles.statusGreen]} />
                    <Text style={styles.statusLabel}>Database Active</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>🔒 256-bit Encrypted Connection</Text>
              <Text style={styles.versionText}>Admin Console v3.0</Text>
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
    right: -100,
  },
  orb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
  },
  hexGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  hexDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F39C12',
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
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 45,
  },
  iconRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(243, 156, 18, 0.4)',
    top: -10,
    left: -10,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.md,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  lockIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  securityText: {
    fontSize: 12,
    color: '#F1C40F',
    fontWeight: '600',
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.2)',
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    fontSize: 18,
    padding: spacing.sm,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loginText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
  },
  loginArrow: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  systemStatus: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusGreen: {
    backgroundColor: '#00D4AA',
  },
  statusLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.xs,
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
});

export default AdminLoginScreen;
