/**
 * NetworkBanner — Shows an offline/online status banner
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOnlineStatus } from '../../hooks/useOffline';
import { typography, spacing } from '../../theme/typography';

const NetworkBanner = () => {
  const isOnline = useOnlineStatus();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const prevOnline = useRef(true);

  useEffect(() => {
    // Show banner when going offline, or briefly when coming back online
    if (!isOnline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (prevOnline.current === false) {
      // Was offline, now online — show briefly then hide
      Animated.sequence([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.spring(slideAnim, { toValue: -50, useNativeDriver: true }),
      ]).start();
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        isOnline ? styles.online : styles.offline,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.dot}>{isOnline ? '🟢' : '🔴'}</Text>
      <Text style={styles.text}>
        {isOnline ? 'Back online' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 9999,
    gap: spacing.xs,
  },
  offline: {
    backgroundColor: '#EF4444',
  },
  online: {
    backgroundColor: '#10B981',
  },
  dot: {
    fontSize: 10,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontFamily: typography.semiBold,
  },
});

export default NetworkBanner;
