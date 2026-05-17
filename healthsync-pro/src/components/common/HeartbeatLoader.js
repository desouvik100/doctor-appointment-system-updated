/**
 * HeartbeatLoader - Premium Medical Loading Animation
 * ECG/BP style heartbeat animation for HealthSync
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Vibration, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const HeartbeatLoader = ({
  size = 'medium', // small, medium, large, fullscreen
  message = '',
  showText = true,
  variant = 'ecg', // ecg, heart, circular
  color = '#4F46E5',
  glowColor = '#818CF8',
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ecgAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // ECG line animation
    Animated.loop(
      Animated.timing(ecgAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Heartbeat pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();


    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Subtle haptic on heartbeat (only on real device)
    if (Platform.OS !== 'web') {
      const hapticInterval = setInterval(() => {
        Vibration.vibrate(10);
      }, 1000);
      return () => clearInterval(hapticInterval);
    }
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small': return { width: 60, height: 30, strokeWidth: 2 };
      case 'large': return { width: 200, height: 80, strokeWidth: 4 };
      case 'fullscreen': return { width: 280, height: 100, strokeWidth: 4 };
      default: return { width: 120, height: 50, strokeWidth: 3 };
    }
  };

  const dimensions = getSize();

  // ECG Path - realistic heartbeat waveform
  const ecgPath = `M 0 25 L 20 25 L 25 25 L 30 10 L 35 40 L 40 5 L 45 35 L 50 25 L 55 25 L 60 25 L 80 25 L 85 20 L 90 30 L 95 25 L 120 25`;

  const renderECGLoader = () => (
    <View style={styles.ecgContainer}>
      <Animated.View style={[styles.ecgWrapper, { opacity: glowAnim }]}>
        <Svg width={dimensions.width} height={dimensions.height} viewBox="0 0 120 50">
          <Defs>
            <SvgGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <Stop offset="50%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0.2" />
            </SvgGradient>
          </Defs>
          <Path
            d={ecgPath}
            stroke="url(#ecgGradient)"
            strokeWidth={dimensions.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
      {/* Animated scan line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            width: dimensions.width,
            transform: [{
              translateX: ecgAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-dimensions.width, dimensions.width],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['transparent', color, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scanGradient}
        />
      </Animated.View>
    </View>
  );


  const renderHeartLoader = () => (
    <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
      <Text style={[styles.heartIcon, { color }]}>❤️</Text>
      <Animated.View style={[styles.heartGlow, { opacity: glowAnim, backgroundColor: glowColor }]} />
    </Animated.View>
  );

  const renderCircularLoader = () => (
    <View style={styles.circularContainer}>
      <Animated.View style={[styles.circularOuter, { borderColor: color, transform: [{ rotate: ecgAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
        <View style={[styles.circularInner, { borderColor: glowColor }]} />
      </Animated.View>
      <Animated.View style={[styles.circularHeart, { transform: [{ scale: heartScale }] }]}>
        <Text style={styles.circularHeartIcon}>💓</Text>
      </Animated.View>
    </View>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'heart': return renderHeartLoader();
      case 'circular': return renderCircularLoader();
      default: return renderECGLoader();
    }
  };

  if (size === 'fullscreen') {
    return (
      <Animated.View style={[styles.fullscreenContainer, { opacity: fadeAnim }]}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.fullscreenGradient}>
          <View style={styles.fullscreenContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.logoBg}>
                <Text style={styles.logoText}>HS</Text>
              </LinearGradient>
              <Text style={styles.brandName}>HealthSync</Text>
            </View>
            
            {/* ECG Animation */}
            <View style={styles.ecgFullscreen}>
              {renderECGLoader()}
            </View>
            
            {/* Loading text */}
            {showText && (
              <Animated.Text style={[styles.loadingText, { opacity: glowAnim }]}>
                {message || 'Loading...'}
              </Animated.Text>
            )}
            
            {/* Heartbeat indicator */}
            <View style={styles.bpmContainer}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Text style={styles.bpmHeart}>❤️</Text>
              </Animated.View>
              <Text style={styles.bpmText}>72 BPM</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, styles[`container_${size}`], { opacity: fadeAnim }]}>
      {renderLoader()}
      {showText && message && <Text style={[styles.message, { color }]}>{message}</Text>}
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  container_small: { padding: 8 },
  container_large: { padding: 24 },
  ecgContainer: { position: 'relative', overflow: 'hidden' },
  ecgWrapper: {},
  scanLine: { position: 'absolute', top: 0, left: 0, height: '100%' },
  scanGradient: { width: 40, height: '100%' },
  heartContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heartIcon: { fontSize: 48 },
  heartGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, zIndex: -1 },
  circularContainer: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  circularOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderStyle: 'dashed', position: 'absolute' },
  circularInner: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, position: 'absolute', top: 10, left: 10 },
  circularHeart: { alignItems: 'center', justifyContent: 'center' },
  circularHeartIcon: { fontSize: 28 },
  message: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  // Fullscreen styles
  fullscreenContainer: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  fullscreenGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullscreenContent: { alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  brandName: { fontSize: 28, fontWeight: '700', color: '#fff' },
  ecgFullscreen: { marginVertical: 40 },
  loadingText: { fontSize: 16, color: '#94A3B8', marginTop: 20 },
  bpmContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 30, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  bpmHeart: { fontSize: 20, marginRight: 8 },
  bpmText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});

export default HeartbeatLoader;