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
import { lightTheme } from '../../theme/colors';

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
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const containerStyles = [
    styles.container,
    isFocused && styles.containerFocused,
    error && styles.containerError,
    disabled && styles.containerDisabled,
    style,
  ];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={containerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={lightTheme.textTertiary}
          secureTextEntry={isSecure}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
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
        <Text style={[styles.helperText, error && styles.errorText]}>
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
    color: lightTheme.text,
    marginBottom: spacing.sm,
  },
  
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.input,
    borderWidth: 1,
    borderColor: lightTheme.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  
  containerFocused: {
    borderColor: lightTheme.inputFocused,
    borderWidth: 2,
  },
  
  containerError: {
    borderColor: lightTheme.error,
  },
  
  containerDisabled: {
    backgroundColor: lightTheme.surface,
    opacity: 0.6,
  },
  
  input: {
    flex: 1,
    ...typography.bodyLarge,
    color: lightTheme.text,
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
    color: lightTheme.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  
  errorText: {
    color: lightTheme.error,
  },
});

export default Input;
