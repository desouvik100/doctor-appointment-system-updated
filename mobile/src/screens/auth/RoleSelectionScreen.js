/**
 * Welcome Screen — Patient-first landing page
 * Replaces the old multi-role selection screen.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      {/* Soft green background blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.logoGradient}>
            <Text style={styles.logoPlus}>+</Text>
          </LinearGradient>
          <View style={styles.logoRing} />
        </Animated.View>

        <Text style={styles.appName}>HealthSync</Text>
        <Text style={styles.tagline}>Your health, simplified 💚</Text>

        {/* Illustration placeholder — friendly healthcare card */}
        <View style={styles.illustrationCard}>
          <Text style={styles.illustrationEmoji}>🩺</Text>
          <View style={styles.illustrationText}>
            <Text style={styles.illustrationTitle}>Your personal health companion</Text>
            <Text style={styles.illustrationSub}>Book doctors · Store records · Get reminders</Text>
          </View>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {[
            { icon: '🔒', label: 'Secure data' },
            { icon: '🏥', label: 'Verified doctors' },
            { icon: '📄', label: 'Private records' },
          ].map(b => (
            <View key={b.label} style={styles.trustBadge}>
              <Text style={styles.trustIcon}>{b.icon}</Text>
              <Text style={styles.trustLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.primaryBtnGradient}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Create a free account</Text>
        </TouchableOpacity>

        {/* Pro app link */}
        <TouchableOpacity style={styles.proLink} activeOpacity={0.7}>
          <Text style={styles.proLinkText}>
            Are you a doctor or staff?{' '}
            <Text style={styles.proLinkHighlight}>Open HealthSync Pro →</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },

  blobTop: {
    position: 'absolute', top: -80, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  blobBottom: {
    position: 'absolute', bottom: -60, left: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(22,163,74,0.08)',
  },

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
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  logoPlus: { fontSize: 42, fontWeight: '700', color: '#fff' },
  logoRing: {
    position: 'absolute', width: 96, height: 96,
    borderRadius: 28, borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.3)', top: -8, left: -8,
  },

  appName: {
    fontSize: 34, fontWeight: '800', color: '#14532D',
    letterSpacing: -0.5, marginBottom: 6,
  },
  tagline: { fontSize: 16, color: '#4ADE80', fontWeight: '500', marginBottom: spacing.xxl },

  illustrationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: borderRadius.xl,
    padding: spacing.lg, width: '100%', marginBottom: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)',
  },
  illustrationEmoji: { fontSize: 44, marginRight: spacing.lg },
  illustrationText: { flex: 1 },
  illustrationTitle: { fontSize: 15, fontWeight: '700', color: '#14532D', marginBottom: 4 },
  illustrationSub: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  trustRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: spacing.xxl,
  },
  trustBadge: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#fff', borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  trustIcon: { fontSize: 20, marginBottom: 4 },
  trustLabel: { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center' },

  primaryBtn: {
    width: '100%', borderRadius: borderRadius.lg,
    overflow: 'hidden', marginBottom: spacing.md,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  secondaryBtn: {
    width: '100%', paddingVertical: 15, borderRadius: borderRadius.lg,
    borderWidth: 2, borderColor: '#22C55E', alignItems: 'center',
    marginBottom: spacing.xl, backgroundColor: '#fff',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#16A34A' },

  proLink: { paddingVertical: spacing.sm },
  proLinkText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  proLinkHighlight: { color: '#22C55E', fontWeight: '600' },
});

export default WelcomeScreen;
