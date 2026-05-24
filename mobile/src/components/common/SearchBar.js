/**
 * Enterprise Search Bar
 * Smart search with suggestions and filters
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { lightTheme } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const SearchBar = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  placeholder = 'Search...',
  showFilter = false,
  onFilterPress,
  autoFocus = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isFocused, scaleAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={lightTheme.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
      
      {showFilter && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightTheme.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  
  containerFocused: {
    ...shadows.lg,
    borderWidth: 2,
    borderColor: lightTheme.primary,
  },
  
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  
  input: {
    flex: 1,
    ...typography.bodyLarge,
    color: lightTheme.text,
    paddingVertical: 0,
  },
  
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lightTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  
  clearIcon: {
    fontSize: 14,
    color: lightTheme.textSecondary,
    fontWeight: '600',
  },
  
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: lightTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  
  filterIcon: {
    fontSize: 18,
  },
});

export default SearchBar;
