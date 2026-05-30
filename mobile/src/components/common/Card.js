/**
 * Enterprise Card Component
 * Flexible, accessible card container with consistent styling
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/shadows';

const Card = ({
  children,
  onPress,
  variant = 'elevated', // elevated, outlined, flat, default, gradient, glass
  padding = 'medium', // none, small, medium, large
  style,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'small': return spacing.md;
      case 'large': return spacing.xl;
      default: return spacing.lg;
    }
  };

  const borderStyle = {
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  };

  const getCardStyles = () => {
    const base = [
      styles.base,
      { padding: getPadding() }
    ];

    if (variant === 'elevated' || variant === 'default') {
      return [
        ...base,
        {
          backgroundColor: colors.backgroundCard,
          ...borderStyle,
          ...shadows.sm,
        }
      ];
    }

    if (variant === 'outlined') {
      return [
        ...base,
        {
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.divider || '#E2E8F0',
        }
      ];
    }

    if (variant === 'flat') {
      return [
        ...base,
        {
          backgroundColor: colors.surface,
          ...borderStyle,
        }
      ];
    }

    if (variant === 'glass') {
      return [
        ...base,
        {
          backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.95)',
          borderWidth: isDarkMode ? 1 : 0,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          ...shadows.sm,
        }
      ];
    }

    return base;
  };

  const finalStyles = [getCardStyles(), style];
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.9 } : {};

  if (variant === 'gradient') {
    return (
      <Wrapper {...wrapperProps} style={finalStyles} {...props}>
        <LinearGradient
          colors={colors.gradientCard || ['#232A3D', '#1A1F2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.lg }]}
        />
        {children}
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} style={finalStyles} {...props}>
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
});

export default Card;

