/**
 * LoadingOverlay - Global loading overlay with HeartbeatLoader
 * Shows after 300ms delay to avoid flash for fast loads
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import HeartbeatLoader from './HeartbeatLoader';

const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
  fullscreen = false,
  delay = 300, // Only show if loading takes > 300ms
  variant = 'ecg',
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let timeout;
    if (visible) {
      timeout = setTimeout(() => {
        setShouldShow(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, delay);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShouldShow(false));
    }
    return () => clearTimeout(timeout);
  }, [visible, delay]);

  if (!shouldShow && !visible) return null;

  if (fullscreen) {
    return <HeartbeatLoader size="fullscreen" message={message} variant={variant} />;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.loaderBox}>
        <HeartbeatLoader size="medium" message={message} variant={variant} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loaderBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default LoadingOverlay;