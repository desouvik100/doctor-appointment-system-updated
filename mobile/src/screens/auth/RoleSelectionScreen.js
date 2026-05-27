/**
 * Welcome Screen — Patient-first landing page
 * Replaces the old multi-role selection screen with modern 2026 branding.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const bgColors = isDarkMode
    ? ['#0A0E17', '#121826', '#1A1F2E']
    : ['#F8FAFC', '#F1F5F9', '#E2E8F0'];
  const orb1Colors = isDarkMode
    ? ['rgba(0, 212, 170, 0.12)', 'transparent']
    : ['rgba(0, 212, 170, 0.06)', 'transparent'];
  const orb2Colors = isDarkMode
    ? ['rgba(108, 92, 231, 0.1)', 'transparent']
    : ['rgba(108, 92, 231, 0.05)', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
        <View style={styles.orb1}>
          <LinearGradient colors={orb1Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
        <View style={styles.orb2}>
          <LinearGradient colors={orb2Colors} style={{ flex: 1, borderRadius: 150 }} />
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
          <LinearGradient colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']} style={styles.logoGradient}>
            <Text style={styles.logoPlus}>+</Text>
          </LinearGradient>
          <View style={[styles.logoRing, { borderColor: colors.primaryLight }]} />
        </Animated.View>

        <Text style={[styles.appName, { color: colors.textPrimary }]}>HealthSync</Text>
        <Text style={[styles.tagline, { color: colors.primary }]}>Your health, simplified 💚</Text>

        {/* Illustration placeholder — friendly healthcare card */}
        <View style={[styles.illustrationCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.illustrationEmoji}>🩺</Text>
          <View style={styles.illustrationText}>
            <Text style={[styles.illustrationTitle, { color: colors.textPrimary }]}>Your personal health companion</Text>
            <Text style={[styles.illustrationSub, { color: colors.textSecondary }]}>Book doctors · Store records · Get reminders</Text>
          </View>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {[
            { icon: '🔒', label: 'Secure data' },
            { icon: '🏥', label: 'Verified doctors' },
            { icon: '📄', label: 'Private records' },
          ].map(b => (
            <View key={b.label} style={[styles.trustBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.trustIcon}>{b.icon}</Text>
              <Text style={[styles.trustLabel, { color: colors.textSecondary }]}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <LinearGradient colors={colors.gradientPrimary || colors.primaryGradient || ['#00D4AA', '#00B894']} style={styles.primaryBtnGradient}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Create a free account</Text>
        </TouchableOpacity>

        {/* Pro app link */}
        <TouchableOpacity style={styles.proLink} activeOpacity={0.7} onPress={() => navigation.navigate('DoctorLogin')}>
          <Text style={styles.proLinkText}>
            Are you a doctor or staff?{' '}
            <Text style={[styles.proLinkHighlight, { color: colors.primary }]}>Open HealthSync Pro →</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -50, right: -100 },
  orb2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, bottom: -50, left: -100 },

  content: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: height * 0.1,
    paddingBottom: spacing.xxl,
  },

  logoWrap: { position: 'relative', marginBottom: spacing.lg },
  logoGradient: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00D4AA', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  logoPlus: { fontSize: 42, fontWeight: '700', color: '#fff' },
  logoRing: {
    position: 'absolute', width: 96, height: 96,
    borderRadius: 28, borderWidth: 2, top: -8, left: -8,
  },

  appName: {
    fontSize: 34, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 6,
  },
  tagline: { fontSize: 16, fontWeight: '500', marginBottom: spacing.xxl },

  illustrationCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.lg, width: '100%', marginBottom: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
    borderWidth: 1,
  },
  illustrationEmoji: { fontSize: 44, marginRight: spacing.lg },
  illustrationText: { flex: 1 },
  illustrationTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  illustrationSub: { fontSize: 13, lineHeight: 18 },

  trustRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: spacing.xxl,
  },
  trustBadge: {
    flex: 1, alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
    borderWidth: 1,
  },
  trustIcon: { fontSize: 20, marginBottom: 4 },
  trustLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

  primaryBtn: {
    width: '100%', borderRadius: borderRadius.lg,
    overflow: 'hidden', marginBottom: spacing.md,
    shadowColor: '#00D4AA', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  secondaryBtn: {
    width: '100%', paddingVertical: 15, borderRadius: borderRadius.lg,
    borderWidth: 2, alignItems: 'center',
    marginBottom: spacing.xl,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },

  proLink: { paddingVertical: spacing.sm },
  proLinkText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  proLinkHighlight: { fontWeight: '600' },
});

export default WelcomeScreen;
