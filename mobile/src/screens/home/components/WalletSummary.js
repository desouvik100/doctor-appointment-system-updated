/**
 * WalletSummary - Stripe-Inspired Premium Health Wallet Snapshot
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  FadeInDown,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';
import { shadows } from '../../../theme/shadows';

const { width } = Dimensions.get('window');

const WalletSummary = ({ balance = 0, loyaltyPoints = 280, currency = '₹', onAddMoney }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  // Defensive coercion — parent may pass null/undefined despite default props
  const safeBalance = Number(balance) || 0;
  const safePoints  = Number(loyaltyPoints) || 0;

  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const targetPoints = 1000;
  const progressRatio = Math.min(safePoints / targetPoints, 1);

  useEffect(() => {
    progressWidth.value = withTiming(progressRatio, { duration: 1200 });
  }, [safePoints]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Balance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Authorize Topup</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={isDarkMode ? ['#171B26', '#1E253A', '#232D48'] : ['#2D3748', '#1A202C', '#10141D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadows.lg]}
      >
        {/* Top metrics row */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Available Credits</Text>
            <Text style={styles.balanceAmount}>
              {currency}{safeBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <View>
              <Text style={styles.pointsLabel}>Loyalty Tier</Text>
              <Text style={styles.pointsValue}>{safePoints.toLocaleString()} pts</Text>
            </View>
          </View>
        </View>

        {/* Milestone tracking progress */}
        <View style={styles.milestoneContainer}>
          <View style={styles.milestoneTextRow}>
            <Text style={styles.milestoneLabel}>Milestone: Free Consultation</Text>
            <Text style={styles.milestoneProgress}>{safePoints}/{targetPoints} pts</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
            <Animated.View style={[styles.progressBarFill, { backgroundColor: '#00D4AA' }, progressStyle]} />
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#00D4AA' }]} 
            onPress={onAddMoney} 
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>+ Instant Refill</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={() => navigation.navigate('Wallet', { tab: 'history' })}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Statements</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { 
    ...typography.headlineSmall,
    fontSize: 16,
    fontWeight: '800',
  },
  seeAll: { 
    ...typography.labelMedium,
    fontWeight: '700',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: spacing.xs,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontWeight: '850',
    fontSize: 22,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pointsEmoji: { fontSize: 14 },
  pointsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8.5,
    fontWeight: '600',
  },
  pointsValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  // Milestone Progress styles
  milestoneContainer: {
    marginBottom: spacing.lg,
  },
  milestoneTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9.5,
    fontWeight: '650',
  },
  milestoneProgress: {
    color: '#00D4AA',
    fontSize: 9.5,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnOutlineText: {
    color: '#FFFFFF',
  },
});

export default React.memo(WalletSummary);
