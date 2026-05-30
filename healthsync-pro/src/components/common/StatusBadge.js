/**
 * StatusBadge — Reusable status indicator pill - Dynamic Theme Edition
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

const StatusBadge = ({ status, label, size = 'md', style }) => {
  const { colors } = useTheme();

  const getStatusStyles = (key) => {
    switch (key) {
      case 'pending':
      case 'unpaid':
        return { bg: colors.warningLight, color: colors.warning };
      case 'confirmed':
      case 'active':
      case 'approved':
      case 'paid':
      case 'online':
        return { bg: colors.successLight, color: colors.success };
      case 'completed':
        return { bg: colors.infoLight, color: colors.info };
      case 'cancelled':
      case 'rejected':
        return { bg: colors.errorLight, color: colors.error };
      case 'in_progress':
      case 'checked-in':
      case 'refunded':
        return { bg: colors.secondaryLight || 'rgba(108, 92, 231, 0.15)', color: colors.secondary };
      case 'inactive':
      case 'offline':
      default:
        return { bg: colors.neutralLight || 'rgba(255, 255, 255, 0.08)', color: colors.textSecondary };
    }
  };

  const statusKey = status?.toLowerCase() || 'unknown';
  const themeStyles = getStatusStyles(statusKey);
  const displayLabel = label || statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: themeStyles.bg },
        isSmall && styles.badgeSm,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: themeStyles.color },
          isSmall && styles.textSm,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontFamily: typography.semiBold,
  },
  textSm: {
    fontSize: 10,
  },
});

export default StatusBadge;
