/**
 * EmptyState Component - Beautiful empty state illustrations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../theme/typography';
import Button from './Button';

const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  message = 'Start by adding something new',
  actionLabel,
  onAction,
  colors,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          onPress={onAction}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
});

export default EmptyState;
