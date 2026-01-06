/**
 * LocationDisplay - Shows user location with animated detection
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';

const LocationDisplay = () => {
  const { colors } = useTheme();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startDetectingAnimation();
    requestLocation();
  }, []);

  const startDetectingAnimation = () => {
    // Pulse animation for the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Ripple animations
    startRippleAnimation(ripple1, 0);
    startRippleAnimation(ripple2, 600);
    startRippleAnimation(ripple3, 1200);
  };

  const startRippleAnimation = (anim, delay) => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  };

  const showLocationFound = () => {
    setDetecting(false);
    
    // Stop pulse and rotate
    pulseAnim.stopAnimation();
    rotateAnim.stopAnimation();
    pulseAnim.setValue(1);

    // Animate in the location info
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const requestLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setError('Location permission denied');
          setDetecting(false);
        }
      } catch (err) {
        setError('Permission error');
        setDetecting(false);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'HealthSync-Mobile-App' } }
          );
          const data = await response.json();
          
          if (data.address) {
            const addr = data.address;
            const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || '';
            const city = addr.city || addr.state_district || addr.county || '';
            const state = addr.state || '';
            
            setAddress({
              locality: locality || city,
              city: city,
              state: state,
              full: `${locality}${locality && city ? ', ' : ''}${city}`,
            });
          }
        } catch (e) {
          // Fallback to coordinates
          setAddress({
            locality: 'Location detected',
            city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            full: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        }
        
        showLocationFound();
      },
      (err) => {
        console.log('Location error:', err);
        setError('Unable to get location');
        setDetecting(false);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rippleScale = (anim) => anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const rippleOpacity = (anim) => anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  if (error) {
    return (
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        onPress={() => Linking.openSettings()}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}20` }]}>
          <Text style={styles.icon}>📍</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.errorText, { color: colors.warning }]}>Location unavailable</Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>Tap to enable in settings</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      {detecting ? (
        // Detecting Animation
        <View style={styles.detectingContainer}>
          <View style={styles.animatedIconWrapper}>
            {/* Ripple effects */}
            <Animated.View style={[
              styles.ripple,
              { 
                backgroundColor: colors.primary,
                transform: [{ scale: rippleScale(ripple1) }],
                opacity: rippleOpacity(ripple1),
              }
            ]} />
            <Animated.View style={[
              styles.ripple,
              { 
                backgroundColor: colors.primary,
                transform: [{ scale: rippleScale(ripple2) }],
                opacity: rippleOpacity(ripple2),
              }
            ]} />
            <Animated.View style={[
              styles.ripple,
              { 
                backgroundColor: colors.primary,
                transform: [{ scale: rippleScale(ripple3) }],
                opacity: rippleOpacity(ripple3),
              }
            ]} />
            
            {/* Animated icon */}
            <Animated.View style={[
              styles.iconContainer,
              { 
                backgroundColor: `${colors.primary}20`,
                transform: [
                  { scale: pulseAnim },
                  { rotate: spin },
                ],
              }
            ]}>
              <Text style={styles.icon}>📍</Text>
            </Animated.View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.detectingText, { color: colors.primary }]}>Detecting location...</Text>
            <View style={styles.dotsContainer}>
              <Animated.Text style={[styles.dots, { color: colors.primary, opacity: pulseAnim }]}>
                ● ● ●
              </Animated.Text>
            </View>
          </View>
        </View>
      ) : (
        // Location Found
        <Animated.View style={[
          styles.foundContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          }
        ]}>
          <LinearGradient
            colors={[`${colors.success}15`, `${colors.success}05`]}
            style={styles.successGradient}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.success}20` }]}>
              <Text style={styles.icon}>📍</Text>
              <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
                {address?.locality || 'Location found'}
              </Text>
              {address?.city && address.city !== address.locality && (
                <Text style={[styles.locationSubtitle, { color: colors.textSecondary }]}>
                  {address.city}{address.state ? `, ${address.state}` : ''}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.refreshBtn, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => {
                setDetecting(true);
                setLocation(null);
                setAddress(null);
                startDetectingAnimation();
                requestLocation();
              }}
            >
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  detectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  animatedIconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detectingText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  dotsContainer: {
    marginTop: 2,
  },
  dots: {
    fontSize: 8,
    letterSpacing: 2,
  },
  foundContainer: {
    overflow: 'hidden',
  },
  successGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  locationTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  locationSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 16,
  },
  errorText: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  subText: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});

export default LocationDisplay;
