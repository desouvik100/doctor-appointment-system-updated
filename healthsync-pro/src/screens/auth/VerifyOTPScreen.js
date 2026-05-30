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
  const styles = makeStyles(colors);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(0, 212, 170, 0.25)', 'transparent'] : ['rgba(0, 212, 170, 0.1)', 'transparent']}
          style={[styles.orb, styles.orb1]}
        />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>🔢</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
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

        <Button
          title="Verify OTP"
          onPress={handleVerify}
          loading={loading}
          fullWidth
          size="large"
        />

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
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
  emailText: {
    color: colors.primary,
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
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  timerText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  resendText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default VerifyOTPScreen;
