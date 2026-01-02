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
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import { authService } from '../../services/api';
import { useUser } from '../../context/UserContext';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;

const OTPVerificationScreen = ({ navigation, route }) => {
  const { phone, email } = route.params || {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const { login } = useUser();

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
      const { user, token } = await authService.verifyOTP(phone, otpString);
      
      if (user && token) {
        await login(user, token);
        navigation.replace('Main');
      } else {
        Alert.alert('Success', 'Phone number verified successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
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
      await authService.sendOTP(phone);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
      startResendTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const maskedPhone = phone ? `******${phone.slice(-4)}` : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Background gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(0, 212, 170, 0.3)', 'transparent']}
          style={[styles.orb, styles.orb1]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>📱</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{maskedPhone}</Text>
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
                  digit && styles.otpInputFilled,
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
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendText}>
                Resend OTP in <Text style={styles.timerText}>{resendTimer}s</Text>
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

          {/* Change Number */}
          <TouchableOpacity 
            style={styles.changeNumber}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.changeNumberText}>Change phone number</Text>
          </TouchableOpacity>
        </View>
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
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    color: colors.primary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  resendText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  timerText: {
    color: colors.primary,
    fontWeight: '600',
  },
  resendLink: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  changeNumber: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  changeNumberText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
});

export default OTPVerificationScreen;