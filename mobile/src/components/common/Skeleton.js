/**
 * Enterprise Skeleton Loader
 * Smooth loading states for better perceived performance
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { borderRadius } from '../../theme/typography';
import { lightTheme } from '../../theme/colors';

const Skeleton = ({
  width = '100%',
  height = 20,
  variant = 'rect', // rect, circle, text
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyles = [
    styles.base,
    variant === 'circle' && styles.circle,
    variant === 'text' && styles.text,
    { width, height, opacity },
    style,
  ];

  return <Animated.View style={skeletonStyles} />;
};

// Preset skeleton components
export const SkeletonText = ({ lines = 3, style }) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? '70%' : '100%'}
        height={16}
        style={{ marginBottom: 8 }}
      />
    ))}
  </View>
);

export const SkeletonCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <Skeleton variant="circle" width={48} height={48} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
    <SkeletonText lines={2} style={{ marginTop: 16 }} />
  </View>
);

export const SkeletonList = ({ items = 3, style }) => (
  <View style={style}>
    {Array.from({ length: items }).map((_, index) => (
      <SkeletonCard key={index} style={{ marginBottom: 16 }} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: lightTheme.surface,
    borderRadius: borderRadius.sm,
  },
  circle: {
    borderRadius: 9999,
  },
  text: {
    borderRadius: borderRadius.xs,
  },
  card: {
    backgroundColor: lightTheme.card,
    borderRadius: borderRadius.lg,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
});

export default Skeleton;
