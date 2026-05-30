/**
 * Enterprise Badge Component
 * Status indicators, labels, and counts - Dynamic Theme Edition
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const Badge = ({
  children,
  variant = 'primary', // primary, secondary, success, warning, error, info, neutral
  size = 'medium', // small, medium, large
  dot = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primaryLight || 'rgba(0, 212, 170, 0.15)',
          color: colors.primary,
        };
      case 'secondary':
        return {
          bg: colors.secondaryLight || 'rgba(108, 92, 231, 0.15)',
          color: colors.secondary,
        };
      case 'success':
        return {
          bg: colors.successLight || 'rgba(16, 185, 129, 0.15)',
          color: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningLight || 'rgba(245, 158, 11, 0.15)',
          color: colors.warning,
        };
      case 'error':
        return {
          bg: colors.errorLight || 'rgba(239, 68, 68, 0.15)',
          color: colors.error,
        };
      case 'info':
        return {
          bg: colors.infoLight || 'rgba(59, 130, 246, 0.15)',
          color: colors.info,
        };
      case 'neutral':
      default:
        return {
          bg: colors.neutralLight || 'rgba(255, 255, 255, 0.08)',
          color: colors.textSecondary,
        };
    }
  };

  const activeStyles = getVariantStyles();

  const badgeStyles = [
    styles.base,
    { backgroundColor: activeStyles.bg },
    styles[size],
    dot && styles.dot,
    style,
  ];

  const textStyles = [
    styles.text,
    { color: activeStyles.color },
    styles[`text_${size}`],
    textStyle,
  ];

  if (dot) {
    return <View style={[badgeStyles, { backgroundColor: activeStyles.color }]} />;
  }

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Sizes
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minHeight: 20,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 24,
  },
  large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },

  // Dot variant
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    padding: 0,
    minHeight: 0,
  },

  // Text styles
  text: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  text_small: {
    fontSize: 10,
    lineHeight: 14,
  },
  text_medium: {
    fontSize: 11,
    lineHeight: 16,
  },
  text_large: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default Badge;
