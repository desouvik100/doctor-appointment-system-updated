/**
 * Enterprise Badge Component
 * Status indicators, labels, and counts
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { lightTheme, colors } from '../../theme/colors';

const Badge = ({
  children,
  variant = 'primary', // primary, secondary, success, warning, error, info, neutral
  size = 'medium', // small, medium, large
  dot = false,
  style,
  textStyle,
}) => {
  const badgeStyles = [
    styles.base,
    styles[variant],
    styles[size],
    dot && styles.dot,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    textStyle,
  ];

  if (dot) {
    return <View style={badgeStyles} />;
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

  // Variants
  primary: {
    backgroundColor: colors.primary[100],
  },
  secondary: {
    backgroundColor: colors.secondary[100],
  },
  success: {
    backgroundColor: colors.success[100],
  },
  warning: {
    backgroundColor: colors.warning[100],
  },
  error: {
    backgroundColor: colors.error[100],
  },
  info: {
    backgroundColor: colors.info[100],
  },
  neutral: {
    backgroundColor: colors.neutral[200],
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
  text_primary: {
    color: colors.primary[700],
  },
  text_secondary: {
    color: colors.secondary[700],
  },
  text_success: {
    color: colors.success[700],
  },
  text_warning: {
    color: colors.warning[700],
  },
  text_error: {
    color: colors.error[700],
  },
  text_info: {
    color: colors.info[700],
  },
  text_neutral: {
    color: colors.neutral[700],
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
