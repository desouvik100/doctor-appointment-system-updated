/**
 * QueueTracker - Live queue position and estimated wait time
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../theme/colors';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import Card from '../../../components/common/Card';

const QueueTracker = ({ position, estimatedWait }) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentWait, setCurrentWait] = useState(estimatedWait);

  // Simulate live updates (in real app, use WebSocket or polling)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate queue movement
      if (currentPosition > 1 && Math.random() > 0.7) {
        setCurrentPosition(prev => Math.max(1, prev - 1));
        setCurrentWait(prev => Math.max(0, prev - 5));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentPosition]);

  const getStatusColor = () => {
    if (currentPosition === 1) return ['#10B981', '#059669'];
    if (currentPosition <= 3) return ['#F59E0B', '#D97706'];
    return colors.gradientPrimary;
  };

  const getStatusText = () => {
    if (currentPosition === 1) return "You're next!";
    if (currentPosition <= 3) return 'Almost there';
    return 'In queue';
  };

  return (
    <Card variant="default" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Queue Status</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.content}>
        <LinearGradient colors={getStatusColor()} style={styles.positionCircle}>
          <Text style={styles.positionNumber}>{currentPosition}</Text>
          <Text style={styles.positionLabel}>in queue</Text>
        </LinearGradient>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <View>
              <Text style={styles.detailLabel}>Estimated Wait</Text>
              <Text style={styles.detailValue}>{currentWait} mins</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📊</Text>
            <View>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, styles.statusText]}>{getStatusText()}</Text>
            </View>
          </View>
        </View>
      </View>

      {currentPosition === 1 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>🔔</Text>
          <Text style={styles.alertText}>Please proceed to the consultation room</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.headlineSmall, color: colors.textPrimary },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, marginRight: spacing.xs },
  liveText: { ...typography.labelSmall, color: colors.error, fontWeight: '600' },
  content: { flexDirection: 'row', alignItems: 'center' },
  positionCircle: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg,
  },
  positionNumber: { ...typography.displaySmall, color: 'white', fontWeight: '700' },
  positionLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)' },
  details: { flex: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  detailIcon: { fontSize: 20, marginRight: spacing.md },
  detailLabel: { ...typography.labelSmall, color: colors.textMuted },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  statusText: { color: colors.primary },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg,
  },
  alertIcon: { fontSize: 18, marginRight: spacing.sm },
  alertText: { ...typography.bodyMedium, color: colors.success, flex: 1 },
});

export default QueueTracker;
