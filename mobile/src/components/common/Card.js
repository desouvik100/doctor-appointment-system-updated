/**
 * Enterprise Card Component
 * Flexible, accessible card container with consistent styling
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, borderRadius } from '../../theme/typography';
import { lightTheme } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const Card = ({
  children,
  onPress,
  variant = 'elevated', // elevated, outlined, flat
  padding = 'medium', // none, small, medium, large
  style,
  ...props
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={cardStyles}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  // Variants
  elevated: {
    backgroundColor: lightTheme.card,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: lightTheme.card,
    borderWidth: 1,
    borderColor: lightTheme.cardBorder,
  },
  flat: {
    backgroundColor: lightTheme.surface,
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: spacing.md,
  },
  padding_medium: {
    padding: spacing.lg,
  },
  padding_large: {
    padding: spacing.xl,
  },
});

export default Card;
