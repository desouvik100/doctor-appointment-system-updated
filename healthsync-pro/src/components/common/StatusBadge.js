/**
 * StatusBadge — Reusable status indicator pill
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',     bg: '#FEF3C7', color: '#92400E' },
  confirmed:    { label: 'Confirmed',   bg: '#D1FAE5', color: '#065F46' },
  completed:    { label: 'Completed',   bg: '#DBEAFE', color: '#1E40AF' },
  cancelled:    { label: 'Cancelled',   bg: '#FEE2E2', color: '#991B1B' },
  'in_progress':{ label: 'In Progress', bg: '#EDE9FE', color: '#5B21B6' },
  'checked-in': { label: 'Checked In',  bg: '#EDE9FE', color: '#5B21B6' },
  active:       { label: 'Active',      bg: '#D1FAE5', color: '#065F46' },
  inactive:     { label: 'Inactive',    bg: '#F1F5F9', color: '#475569' },
  approved:     { label: 'Approved',    bg: '#D1FAE5', color: '#065F46' },
  rejected:     { label: 'Rejected',    bg: '#FEE2E2', color: '#991B1B' },
  paid:         { label: 'Paid',        bg: '#D1FAE5', color: '#065F46' },
  unpaid:       { label: 'Unpaid',      bg: '#FEF3C7', color: '#92400E' },
  refunded:     { label: 'Refunded',    bg: '#EDE9FE', color: '#5B21B6' },
  online:       { label: 'Online',      bg: '#D1FAE5', color: '#065F46' },
  offline:      { label: 'Offline',     bg: '#F1F5F9', color: '#475569' },
};

const StatusBadge = ({ status, label, size = 'md', style }) => {
  const config = STATUS_CONFIG[status?.toLowerCase()] || {
    label: label || status || 'Unknown',
    bg: '#F1F5F9',
    color: '#475569',
  };

  const displayLabel = label || config.label;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSm,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color },
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
