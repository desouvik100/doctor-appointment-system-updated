/**
 * WalletSummary - Compact wallet card, less visual noise
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';

const WalletSummary = ({ balance = 0, loyaltyPoints = 0, currency = '₹', navigation, onAddMoney }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['#5B4ED1', '#6C5CE7', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Balance row */}
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {currency}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <View>
              <Text style={styles.pointsLabel}>Points</Text>
              <Text style={styles.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onAddMoney} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>+ Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={() => navigation.navigate('Wallet', { tab: 'history' })}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.headlineSmall },
  seeAll: { ...typography.labelMedium },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displaySmall,
    color: '#fff',
    fontWeight: '800',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pointsEmoji: { fontSize: 20 },
  pointsLabel: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.65)',
  },
  pointsValue: {
    ...typography.bodyLarge,
    color: '#fff',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionBtnText: {
    ...typography.labelMedium,
    color: '#5B4ED1',
    fontWeight: '700',
  },
  actionBtnOutlineText: {
    color: '#fff',
  },
});

export default WalletSummary;
