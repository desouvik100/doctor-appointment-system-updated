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
import { useTheme } from '../../context/ThemeContext';
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
  const { colors } = useTheme();
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
        {
          backgroundColor: colors.backgroundCard || '#fff',
          borderColor: isFocused ? colors.primary : colors.surfaceBorder,
          borderWidth: isFocused ? 2 : 0,
        },
        isFocused ? shadows.lg : shadows.md,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted || '#6B7280'}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[styles.input, { color: colors.textPrimary }]}
      />
      
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={[styles.clearButton, { backgroundColor: colors.surface }]}>
          <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      )}
      
      {showFilter && (
        <TouchableOpacity onPress={onFilterPress} style={[styles.filterButton, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.filterIcon, { color: colors.primary }]}>⚙️</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  
  input: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: 0,
  },
  
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  
  clearIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  
  filterIcon: {
    fontSize: 18,
  },
});

export default SearchBar;

