/**
 * Glassmorphism Card Component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/typography';

const Card = ({
  children,
  variant = 'default', // default, elevated, gradient, glass
  onPress,
  style,
  padding = 'medium',
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return spacing.md;
      case 'large': return spacing.xxl;
      default: return spacing.lg;
    }
  };

  const cardStyle = [
    styles.card,
    { padding: getPadding() },
    variant === 'elevated' && [styles.elevated, shadows.medium],
    variant === 'glass' && styles.glass,
    style,
  ];

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.8 } : {};

  if (variant === 'gradient') {
    return (
      <Wrapper {...wrapperProps}>
        <LinearGradient
          colors={colors.gradientCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { padding: getPadding() }, shadows.small, style]}
        >
          {children}
        </LinearGradient>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} style={cardStyle}>
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  elevated: {
    backgroundColor: colors.backgroundElevated,
  },
  glass: {
    backgroundColor: 'rgba(26, 31, 46, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Card;
