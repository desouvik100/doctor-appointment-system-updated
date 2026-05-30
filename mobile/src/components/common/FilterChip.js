/**
 * FilterChip Component - Animated filter chips - Dynamic Theme Edition
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const FilterChip = ({ 
  label, 
  selected = false, 
  onPress, 
  icon,
  style 
}) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 3,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.divider,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text
          style={[
            styles.label,
            { color: selected ? colors.textInverse || '#fff' : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chipUnselected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
});

export default FilterChip;
