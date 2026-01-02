/**
 * WalletSummary Component - Display balance and loyalty points
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';

const WalletSummary = ({ 
  balance = 0, 
  loyaltyPoints = 0, 
  currency = '₹',
  navigation,
  onAddMoney 
}) => {
  const { colors } = useTheme();
  
  const formatBalance = (amount) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={[styles.balanceAmount, { color: colors.textInverse }]}>
              {currency}{formatBalance(balance)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pointsSection}>
            <View style={styles.pointsIcon}>
              <Text style={styles.pointsEmoji}>⭐</Text>
            </View>
            <View>
              <Text style={styles.pointsLabel}>Loyalty Points</Text>
              <Text style={[styles.pointsValue, { color: colors.textInverse }]}>{loyaltyPoints.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onAddMoney}
          >
            <Text style={styles.actionIcon}>+</Text>
            <Text style={[styles.actionText, { color: colors.textInverse }]}>Add Money</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Wallet', { tab: 'history' })}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={[styles.actionText, { color: colors.textInverse }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Wallet', { tab: 'rewards' })}
          >
            <Text style={styles.actionIcon}>🎁</Text>
            <Text style={[styles.actionText, { color: colors.textInverse }]}>Rewards</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
  },
  seeAll: {
    ...typography.labelMedium,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  cardContent: {
    marginBottom: spacing.lg,
  },
  balanceSection: {
    marginBottom: spacing.md,
  },
  balanceLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displayMedium,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: spacing.md,
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pointsEmoji: {
    fontSize: 20,
  },
  pointsLabel: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.7)',
  },
  pointsValue: {
    ...typography.headlineSmall,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.labelSmall,
  },
});

export default WalletSummary;
