/**
 * Verify OTP Screen - For password reset
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Button from '../../components/common/Button';
import authService from '../../services/api/authService';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    // Navigate directly to reset password screen with OTP
    // Backend will verify OTP when resetting password
    navigation.navigate('ResetPassword', { email, otp: otpCode });
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.requestPasswordReset(email);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Success', 'OTP sent again!');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

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

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>🔢</Text>
            </LinearGradient>
          </View>
          
          <Text style={[styles.title, { color: colors.textPrimary }]}>Enter OTP</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a 6-digit code to{'\n'}
            <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
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

        <Button
          title="Verify OTP"
          onPress={handleVerify}
          loading={loading}
          fullWidth
          size="large"
        />

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={[styles.timerText, { color: colors.textMuted }]}>
              Resend OTP in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={[styles.resendText, { color: colors.primary }]}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
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
  emailText: {
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
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
    marginTop: spacing.xl,
  },
  timerText: {
    ...typography.bodyMedium,
  },
  resendText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});

export default VerifyOTPScreen;
