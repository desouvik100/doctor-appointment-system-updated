/**
 * Staff Login Screen - Hospital Operations Portal
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
import whatsappService from '../../services/whatsappService';

const StaffLoginScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { login } = useUser();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const departments = [
    { id: 'reception', name: 'Reception', icon: '🏥' },
    { id: 'nursing', name: 'Nursing', icon: '👩‍⚕️' },
    { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
    { id: 'lab', name: 'Laboratory', icon: '🔬' },
  ];

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

    // Rotate animation for the icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    if (!employeeId.trim() || !password) {
      Alert.alert('Error', 'Please enter employee ID and password');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authService.login({
        email: employeeId.trim(),
        password,
        role: 'staff',
      });
      
      await login(user, token);
      navigation.replace('Main');
    } catch (error) {
      let message = 'Login failed. Please check your credentials.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      Alert.alert('Login Failed', message);
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
            colors={['rgba(255, 107, 107, 0.4)', 'transparent']}
            style={styles.orbGradient}
          />
        </View>
        <View style={[styles.orb, styles.orb2]}>
          <LinearGradient
            colors={['rgba(255, 142, 142, 0.2)', 'transparent']}
            style={styles.orbGradient}
          />
        </View>
        
        {/* Animated Grid */}
        <Animated.View style={[styles.gridOverlay, { transform: [{ rotate: spin }] }]}>
          <View style={styles.gridCircle} />
          <View style={[styles.gridCircle, styles.gridCircle2]} />
        </Animated.View>
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
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E8E']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.icon}>👩‍💼</Text>
                </LinearGradient>
                <View style={styles.iconBadge}>
                  <Text style={styles.badgeText}>STAFF</Text>
                </View>
              </View>
              
              <Text style={styles.title}>Staff Portal</Text>
              <Text style={styles.subtitle}>Hospital Operations Access</Text>
              
              {/* Live Clock */}
              <View style={styles.clockContainer}>
                <Text style={styles.clockIcon}>🕐</Text>
                <Text style={styles.clockText}>
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
                <View style={styles.shiftBadge}>
                  <Text style={styles.shiftText}>Day Shift</Text>
                </View>
              </View>
            </View>

            {/* Department Selection */}
            <View style={styles.departmentSection}>
              <Text style={styles.sectionLabel}>Select Department</Text>
              <View style={styles.departmentGrid}>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.departmentCard,
                      selectedDepartment === dept.id && styles.departmentCardSelected,
                    ]}
                    onPress={() => setSelectedDepartment(dept.id)}
                  >
                    <Text style={styles.departmentIcon}>{dept.icon}</Text>
                    <Text style={[
                      styles.departmentName,
                      selectedDepartment === dept.id && styles.departmentNameSelected,
                    ]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Employee ID</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🆔</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your employee ID"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔐</Text>
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

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#4A4A5A', '#3A3A4A'] : ['#FF6B6B', '#FF8E8E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  {loading ? (
                    <Text style={styles.loginText}>Clocking In...</Text>
                  ) : (
                    <>
                      <Text style={styles.loginText}>Clock In & Access</Text>
                      <Text style={styles.loginArrow}>→</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>24</Text>
                  <Text style={styles.statLabel}>Patients Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>8</Text>
                  <Text style={styles.statLabel}>Pending Tasks</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Alerts</Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => whatsappService.contactSupport('Hi! I need help with Staff Portal login.')}
              >
                <Text style={styles.helpIcon}>💬</Text>
                <Text style={styles.helpText}>Need Help?</Text>
              </TouchableOpacity>
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
    width: 300,
    height: 300,
    top: -80,
    left: -100,
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 150,
    right: -50,
  },
  gridOverlay: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
  },
  gridCircle2: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderColor: 'rgba(255, 107, 107, 0.05)',
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
    marginBottom: spacing.xl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.md,
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
  iconBadge: {
    position: 'absolute',
    bottom: -5,
    right: -10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.md,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  clockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  shiftBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  shiftText: {
    color: '#FF8E8E',
    fontSize: 11,
    fontWeight: '500',
  },
  departmentSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  departmentCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  departmentCardSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#FF6B6B',
  },
  departmentIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  departmentName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  departmentNameSelected: {
    color: '#fff',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.md,
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
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    height: 52,
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
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginArrow: {
    color: '#fff',
    fontSize: 20,
    marginLeft: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: spacing.lg,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  helpIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  helpText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default StaffLoginScreen;
