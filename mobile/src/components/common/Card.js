/**
 * Glassmorphism Card Component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const Card = ({
  children,
  variant = 'default', // default, elevated, gradient, glass
  onPress,
  style,
  padding = 'medium',
}) => {
  const { colors, isDarkMode } = useTheme();

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
    { padding: getPadding(), backgroundColor: colors.backgroundCard, borderColor: colors.surfaceBorder },
    variant === 'elevated' && [styles.elevated, shadows.medium, { backgroundColor: colors.backgroundElevated }],
    variant === 'glass' && [styles.glass, { 
      backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
    }],
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
          style={[styles.card, { padding: getPadding(), borderColor: colors.surfaceBorder }, shadows.small, style]}
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
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  elevated: {
  },
  glass: {
  },
});

export default Card;
