/**
 * Enterprise Input Component
 * Accessible, validated text input with consistent styling
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const containerStyles = [
    styles.container,
    {
      backgroundColor: colors.surface || colors.backgroundCard || '#fff',
      borderColor: colors.surfaceBorder || '#E2E8F0',
    },
    isFocused && { borderColor: colors.primary || '#00D4AA', borderWidth: 2 },
    error && { borderColor: colors.error || '#EF4444' },
    disabled && { opacity: 0.6 },
    style,
  ];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      
      <View style={containerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted || '#94A3B8'}
          secureTextEntry={isSecure}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            { color: colors.textPrimary },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.rightIcon}
          >
            <Text style={styles.eyeIcon}>{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, { color: colors.textSecondary }, error && { color: colors.error }]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  
  label: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  
  input: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: spacing.md,
  },
  
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  
  leftIcon: {
    marginRight: spacing.sm,
  },
  
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  
  eyeIcon: {
    fontSize: 20,
  },
  
  helperText: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default Input;

