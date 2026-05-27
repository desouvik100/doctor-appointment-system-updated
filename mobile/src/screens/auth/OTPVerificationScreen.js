/**
 * OTP Verification Screen - Phone Number Verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import authService from '../../services/api/authService';
import { useUser } from '../../context/UserContext';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;

const OTPVerificationScreen = ({ navigation, route }) => {
  const { phone, email, name, password, isRegistration } = route.params || {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const { login } = useUser();
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
    
    // Start resend timer
    startResendTimer();
  }, []);

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);
    
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste
    if (value.length > 1) {
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      pastedOtp.forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedOtp.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    try {
      if (isRegistration) {
        // Registration flow: Verify OTP then register user
        console.log('✅ Verifying registration OTP for:', email);
        await authService.verifyRegistrationOTP(email, otpString);
        
        // Now register the user with otpVerified flag
        console.log('📝 Registering user:', { name, email, phone });
        const response = await authService.register({
          name,
          email,
          phone,
          password,
          otpVerified: true,
        });
        
        // Login the user
        if (response.user && response.token) {
          await login(response.user, response.token);
          Alert.alert(
            'Welcome!',
            'Your account has been created successfully.',
            [{ text: 'OK', onPress: () => navigation.replace('Main') }]
          );
        }
      } else {
        // Phone verification flow (existing)
        const { user, token } = await authService.verifyOTP(phone, otpString);
        
        if (user && token) {
          await login(user, token);
          navigation.replace('Main');
        } else {
          Alert.alert('Success', 'Phone number verified successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', message);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      if (isRegistration) {
        await authService.sendRegistrationOTP(email);
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      } else {
        await authService.sendOTP(phone);
        Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
      }
      startResendTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const maskedContact = isRegistration 
    ? (email ? `${email.slice(0, 3)}***@${email.split('@')[1]}` : 'your email')
    : (phone ? `******${phone.slice(-4)}` : 'your phone');

  const bgColors = isDarkMode
    ? ['#0A0E17', '#121826', '#1A1F2E']
    : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  const orb1Colors = isDarkMode
    ? ['rgba(0, 212, 170, 0.12)', 'transparent']
    : ['rgba(0, 212, 170, 0.06)', 'transparent'];

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>📱</Text>
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isRegistration ? 'Verify Email' : 'Verify Phone'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={[styles.phoneNumber, { color: colors.primary }]}>{maskedContact}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit ? colors.primary : colors.surfaceBorder,
                    color: colors.textPrimary,
                  },
                  digit && {
                    backgroundColor: isDarkMode ? 'rgba(0, 212, 170, 0.15)' : colors.primaryLight,
                  }
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Timer */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendLink, { color: colors.primary }]}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                Resend OTP in <Text style={[styles.timerText, { color: colors.primary }]}>{resendTimer}s</Text>
              </Text>
            )}
          </View>

          {/* Verify Button */}
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            fullWidth
            size="large"
            disabled={otp.join('').length !== OTP_LENGTH}
          />

          {/* Change Contact */}
          <TouchableOpacity 
            style={styles.changeNumber}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.changeNumberText, { color: colors.textMuted }]}>
              {isRegistration ? 'Change email address' : 'Change phone number'}
            </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  iconContainer: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
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
  phoneNumber: {
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  resendText: {
    ...typography.bodyMedium,
  },
  timerText: {
    fontWeight: '600',
  },
  resendLink: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  changeNumber: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  changeNumberText: {
    ...typography.bodyMedium,
  },
});

export default OTPVerificationScreen;