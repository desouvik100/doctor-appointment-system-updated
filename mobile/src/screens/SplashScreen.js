/**
 * SplashScreen - Premium app launch screen with heartbeat animation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const ecgAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // ECG animation
    Animated.loop(
      Animated.timing(ecgAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Heartbeat
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();

    // Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Text fade in
    setTimeout(() => {
      Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 500);

    // Finish after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onFinish && onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const ecgPath = "M 0 50 L 40 50 L 50 50 L 60 20 L 70 80 L 80 10 L 90 70 L 100 50 L 110 50 L 120 50 L 160 50 L 170 40 L 180 60 L 190 50 L 240 50";


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.gradient}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Logo with glow */}
          <View style={styles.logoSection}>
            <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: heartScale }] }]}>
              <Animated.Image
                source={require('../assets/logo_icon.png')}
                style={styles.logoImage}
              />
            </Animated.View>
          </View>

          {/* Brand name */}
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.brandName}>HealthSync</Text>
            <Text style={styles.tagline}>Your Health, Our Priority</Text>
          </Animated.View>

          {/* ECG Animation */}
          <View style={styles.ecgSection}>
            <Svg width={280} height={100} viewBox="0 0 240 100">
              <Defs>
                <SvgGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#4F46E5" stopOpacity="0.1" />
                  <Stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
                </SvgGradient>
              </Defs>
              <Path d={ecgPath} stroke="url(#ecgGrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            
            {/* Scan line */}
            <Animated.View style={[styles.scanLine, {
              transform: [{ translateX: ecgAnim.interpolate({ inputRange: [0, 1], outputRange: [-280, 280] }) }]
            }]}>
              <LinearGradient colors={['transparent', '#6366F1', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanGradient} />
            </Animated.View>
          </View>

          {/* BPM indicator */}
          <Animated.View style={[styles.bpmBox, { opacity: textFade }]}>
            <Animated.Text style={[styles.bpmHeart, { transform: [{ scale: heartScale }] }]}>❤️</Animated.Text>
            <Text style={styles.bpmValue}>72</Text>
            <Text style={styles.bpmLabel}>BPM</Text>
          </Animated.View>

          {/* Loading dots */}
          <Animated.View style={[styles.loadingDots, { opacity: glowAnim }]}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ in India</Text>
        </View>
      </LinearGradient>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  logoGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#4F46E5', top: -20, left: -20 },
  logoContainer: { zIndex: 1 },
  logoImage: { width: 100, height: 100, borderRadius: 32, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20 },
  brandName: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
  ecgSection: { marginVertical: 40, position: 'relative', overflow: 'hidden', width: 280, height: 100 },
  scanLine: { position: 'absolute', top: 0, left: 0, width: 60, height: '100%' },
  scanGradient: { width: 60, height: '100%' },
  bpmBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(79, 70, 229, 0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  bpmHeart: { fontSize: 24, marginRight: 8 },
  bpmValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginRight: 4 },
  bpmLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  loadingDots: { flexDirection: 'row', marginTop: 40, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(148, 163, 184, 0.3)' },
  dotActive: { backgroundColor: '#6366F1', width: 24 },
  footer: { position: 'absolute', bottom: 40 },
  footerText: { fontSize: 14, color: '#64748B' },
});

export default SplashScreen;