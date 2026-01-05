/**
 * Modern Input Component
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, borderRadius, spacing } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.surfaceBorder;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <View style={[
        styles.inputWrapper,
        { borderColor: getBorderColor(), backgroundColor: colors.surface },
        isFocused && [styles.focused, { backgroundColor: colors.backgroundCard }],
        error && styles.errorBorder,
        !editable && [styles.disabled, { backgroundColor: colors.surfaceLight }],
        multiline && { height: 24 * numberOfLines + spacing.lg * 2 },
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary },
            multiline && styles.multiline,
            leftIcon && { paddingLeft: 0 },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Text style={[styles.toggleText, { color: colors.primary }]}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helper) && (
        <Text style={[styles.helper, { color: colors.textMuted }, error && { color: colors.error }]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelMedium,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  focused: {
    borderWidth: 2,
  },
  errorBorder: {
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: spacing.md + 2,
  },
  multiline: {
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.md,
  },
  rightIcon: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
  toggleText: {
    ...typography.labelMedium,
  },
  helper: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
