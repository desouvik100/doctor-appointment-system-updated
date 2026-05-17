/**
 * Modern Button Component
 * Glassmorphism + Gradient styling
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../../theme/colors';
import { typography, borderRadius, spacing } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const { colors } = useTheme();

  const getGradient = () => {
    if (disabled) return [colors.surfaceLight, colors.surface];
    switch (variant) {
      case 'primary': return colors.gradientPrimary;
      case 'secondary': return colors.gradientSecondary;
      case 'accent': return colors.gradientAccent;
      default: return ['transparent', 'transparent'];
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'accent':
        return colors.textInverse;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.textPrimary;
      default:
        return colors.textPrimary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 36 };
      case 'large':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 56 };
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 48 };
    }
  };

  const isGradient = ['primary', 'secondary', 'accent'].includes(variant) && !disabled;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[
            size === 'small' ? typography.buttonSmall : typography.button,
            { color: getTextColor() }
          ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            getSizeStyles(),
            shadows.medium,
            disabled && styles.disabled,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getSizeStyles(),
        variant === 'outline' && [styles.outline, { borderColor: colors.primary }],
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
