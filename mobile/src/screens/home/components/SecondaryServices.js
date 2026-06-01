/**
 * SecondaryServices - Auxiliary support options for diagnostics, pharmacy, and emergency care
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const SERVICES = [
  { id: 'lab', label: 'Lab Tests', icon: '🧪', screen: 'LabTests', color: '#FF7675', desc: 'Home sample pickup' },
  { id: 'meds', label: 'Medicines', icon: '💊', screen: 'Medicine', color: '#0984E3', desc: 'Express pharmacy delivery' },
  { id: 'records', label: 'Medical Records', icon: '📄', screen: 'Records', color: '#FDCB6E', desc: 'E-prescriptions & reports' },
  { id: 'emergency', label: 'Emergency SOS', icon: '🚑', screen: 'Emergency', color: '#D63031', desc: '24/7 ambulance dispatch' },
];

const ServiceCard = ({ item, index }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    navigation.navigate(item.screen);
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80)}
      style={[animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            ...shadows.sm,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
          <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>{item.desc}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SecondaryServices = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Other Health Services</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Diagnostics, pharmacy, and urgent support</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {SERVICES.map((item, index) => (
          <ServiceCard key={item.id} item={item} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...typography.labelSmall,
    fontSize: 11,
    marginTop: 2,
  },
  horizontalScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    width: 210,
    height: 64,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 11.5,
  },
  desc: {
    ...typography.labelSmall,
    fontSize: 8.5,
    marginTop: 1,
  },
});

export default React.memo(SecondaryServices);
