/**
 * Enterprise Button Component
 * Accessible, consistent, and flexible button system
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/shadows';

const Button = ({
  children,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'medium', // small, medium, large
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  gradient = false,
  style,
  textStyle,
  ...props
}) => {
  const { colors } = useTheme();

  const buttonStyles = [
    styles.base,
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    
    // Dynamic styling
    variant === 'primary' && !gradient && { backgroundColor: colors.primary, ...shadows.sm },
    variant === 'secondary' && { backgroundColor: colors.secondary, ...shadows.sm },
    variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'danger' && { backgroundColor: colors.error, ...shadows.sm },
    
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    
    // Dynamic text colors
    variant === 'primary' && { color: colors.textInverse || '#fff' },
    variant === 'secondary' && { color: '#fff' },
    variant === 'outline' && { color: colors.primary },
    variant === 'ghost' && { color: colors.primary },
    variant === 'danger' && { color: '#fff' },
    
    textStyle,
  ];

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={textStyles}>{children}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (gradient && variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[buttonStyles, { overflow: 'hidden' }]}
        {...props}
      >
        <LinearGradient
          colors={colors.primaryGradient || colors.gradientPrimary || ['#00D4AA', '#00B894']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={buttonStyles}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Sizes
  small: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
    ...shadows.none,
  },

  // Text styles
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  text_small: {
    ...typography.buttonSmall,
  },
  text_medium: {
    ...typography.button,
  },
  text_large: {
    fontSize: 18,
    lineHeight: 26,
  },
  textDisabled: {
    opacity: 1,
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },

  // Gradient
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;

