/**
 * QuickActions - Enterprise-grade design with press animations
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  InteractionManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLS = 4;
const GAP = spacing.md;
const ITEM_SIZE = (width - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;

const ACTIONS = [
  { id: 'book',      icon: '📅', label: 'Book',      gradient: ['#00D4AA', '#00B894'], screen: 'Booking' },
  { id: 'video',     icon: '📹', label: 'Video',     gradient: ['#3B82F6', '#00D4AA'], screen: 'VideoConsult' },
  { id: 'lab',       icon: '🧪', label: 'Lab Tests', gradient: ['#FF9F43', '#FF6B6B'], screen: 'LabTests' },
  { id: 'records',   icon: '📋', label: 'Records',   gradient: ['#6C5CE7', '#A29BFE'], screen: 'Records' },
  { id: 'meds',      icon: '💊', label: 'Medicine',  gradient: ['#4E65FF', '#92EFFD'], screen: 'Medicine' },
  { id: 'imaging',   icon: '🩻', label: 'Imaging',   gradient: ['#FF6B6B', '#FF8E8E'], screen: 'MedicalImaging' },
  { id: 'emergency', icon: '🚑', label: 'Emergency', gradient: ['#FF416C', '#FF4B2B'], screen: 'Emergency' },
  { id: 'wallet',    icon: '💳', label: 'Wallet',    gradient: ['#834D9B', '#D04ED6'], screen: 'Wallet' },
];

const ActionItem = React.memo(({ action, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 4 }),
      Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    // Defer navigation until after animation completes — reduces perceived lag
    InteractionManager.runAfterInteractions(() => {
      onPress(action.screen);
    });
  }, [action.screen, onPress]);

  return (
    <Animated.View style={[styles.itemWrapper, { transform: [{ scale }], opacity }]}>
      <TouchableOpacity
        style={styles.item}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient colors={action.gradient} style={styles.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Inner highlight for depth */}
          <View style={styles.iconHighlight} />
          <Text style={styles.icon}>{action.icon}</Text>
        </LinearGradient>
        <Text style={styles.label} numberOfLines={1}>{action.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const QuickActions = ({ navigation }) => {
  const { colors } = useTheme();
  const navigate = useCallback((screen) => navigation.navigate(screen), [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>8 services</Text>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.grid}>
          {ACTIONS.map(action => (
            <ActionItem key={action.id} action={action} onPress={navigate} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '700' },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: { ...typography.labelSmall, fontWeight: '600' },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: 'rgba(26, 31, 46, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    // Elevation / shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  itemWrapper: { width: ITEM_SIZE },
  item: { alignItems: 'center' },
  iconBox: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    // Strong shadow per icon
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  iconHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  icon: { fontSize: 26 },
  label: {
    ...typography.labelSmall,
    textAlign: 'center',
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default QuickActions;
