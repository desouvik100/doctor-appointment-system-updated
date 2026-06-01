/**
 * QueueTracker — Live queue position with real-time socket updates
 *
 * Uses existing backend infrastructure:
 *   API:    GET /api/appointments/my-queue/:appointmentId
 *   Socket: queue:position_changed  (personal update)
 *           queue:your_turn         (turn alert)
 *           queue:updated           (room-level update)
 *
 * NO polling. NO fake simulation. Pure socket + one initial fetch.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { useSocket, SOCKET_EVENTS } from '../../../context/SocketContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import apiClient from '../../../services/api/apiClient';

const QueueTracker = ({ appointmentId, clinicId, doctorId, initialPosition, initialWait }) => {
  const { colors } = useTheme();
  const { subscribe, joinRoom, leaveRoom, isConnected } = useSocket();

  const [queueData, setQueueData] = useState({
    position:       initialPosition || null,
    patientsAhead:  null,
    estimatedWait:  initialWait    || null,
    estimatedTime:  null,
    isYourTurn:     false,
    isAlmostTurn:   false,
    doctorStatus:   null,   // 'in_progress' | 'waiting' | null
    currentToken:   null,
    totalInQueue:   null,
    recommendation: null,
    serverTime:     null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const fetchQueueStatus = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await apiClient.get(`/appointments/my-queue/${appointmentId}`);
      if (!mountedRef.current) return;
      if (res.data?.success) {
        applyQueueData(res.data);
      }
    } catch (err) {
      if (mountedRef.current) setError('Could not load queue status');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [appointmentId]);

  const applyQueueData = (data) => {
    setQueueData({
      position:       data.userPosition       ?? null,
      patientsAhead:  data.patientsAhead      ?? null,
      estimatedWait:  data.estimatedWaitMinutes ?? null,
      estimatedTime:  data.estimatedArrivalTime ?? null,
      isYourTurn:     data.isYourTurn          ?? false,
      isAlmostTurn:   data.isAlmostTurn        ?? false,
      doctorStatus:   data.currentlySeeing ? 'in_progress' : 'waiting',
      currentToken:   data.currentToken        ?? null,
      totalInQueue:   data.totalInQueue        ?? null,
      recommendation: data.recommendation      ?? null,
      serverTime:     data.serverTime          ?? null,
    });
    setError(null);
  };

  // ── Socket subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    fetchQueueStatus();

    return () => { mountedRef.current = false; };
  }, [fetchQueueStatus]);

  useEffect(() => {
    if (!isConnected) return;

    // Join the queue room so we receive room-level updates
    const queueRoom = clinicId && doctorId ? `queue:${clinicId}:${doctorId}` : null;
    if (queueRoom) joinRoom(queueRoom);

    // Personal position update — most precise
    const unsubPosition = subscribe(SOCKET_EVENTS.QUEUE_POSITION_CHANGED, (data) => {
      if (!mountedRef.current) return;
      // Only apply if this event is for our appointment
      if (data.appointmentId && data.appointmentId !== appointmentId) return;
      applyQueueData(data);
    });

    // "Your turn" alert
    const unsubTurn = subscribe(SOCKET_EVENTS.QUEUE_YOUR_TURN, (data) => {
      if (!mountedRef.current) return;
      if (data.appointmentId && data.appointmentId !== appointmentId) return;
      setQueueData(prev => ({
        ...prev,
        isYourTurn:    true,
        isAlmostTurn:  true,
        estimatedWait: 0,
        position:      1,
        patientsAhead: 0,
      }));
    });

    // Room-level queue update — re-fetch our position
    const unsubUpdated = subscribe(SOCKET_EVENTS.QUEUE_UPDATED, () => {
      if (!mountedRef.current) return;
      fetchQueueStatus();
    });

    return () => {
      unsubPosition();
      unsubTurn();
      unsubUpdated();
      if (queueRoom) leaveRoom(queueRoom);
    };
  }, [isConnected, appointmentId, clinicId, doctorId, subscribe, joinRoom, leaveRoom, fetchQueueStatus]);

  // ── Derived display values ─────────────────────────────────────────────────
  const getGradient = () => {
    if (queueData.isYourTurn)   return ['#10B981', '#059669'];
    if (queueData.isAlmostTurn) return ['#F59E0B', '#D97706'];
    return colors.gradientPrimary || ['#00D4AA', '#00B894'];
  };

  const getStatusLabel = () => {
    if (queueData.isYourTurn)              return "It's your turn!";
    if (queueData.isAlmostTurn)            return 'Almost there';
    if (queueData.position === null)       return 'Loading...';
    if (queueData.position <= 3)           return 'Coming up soon';
    return 'In queue';
  };

  const formatWait = (mins) => {
    if (mins === null || mins === undefined) return '—';
    if (mins === 0) return 'Now';
    if (mins < 60) return `~${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
  };

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading queue status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Live Queue Status</Text>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
          <Text style={[styles.liveText, { color: isConnected ? colors.success : colors.error }]}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Position circle */}
        <LinearGradient colors={getGradient()} style={styles.positionCircle}>
          <Text style={styles.positionNumber}>
            {queueData.isYourTurn ? '🎉' : (queueData.position ?? '—')}
          </Text>
          <Text style={styles.positionLabel}>
            {queueData.isYourTurn ? 'Your turn' : 'in queue'}
          </Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⏱️</Text>
            <View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Est. Wait</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatWait(queueData.estimatedWait)}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statIcon}>👥</Text>
            <View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ahead of you</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {queueData.patientsAhead !== null ? queueData.patientsAhead : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🩺</Text>
            <View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Doctor</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {queueData.doctorStatus === 'in_progress' ? 'With patient' : 'Available'}
              </Text>
            </View>
          </View>

          {queueData.estimatedTime && (
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🕐</Text>
              <View>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Your slot ~</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {queueData.estimatedTime}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Your turn alert */}
      {queueData.isYourTurn && (
        <View style={[styles.alertBanner, { backgroundColor: `${colors.success}18` }]}>
          <Text style={styles.alertIcon}>🔔</Text>
          <Text style={[styles.alertText, { color: colors.success }]}>
            Please proceed to the consultation room now
          </Text>
        </View>
      )}

      {/* Almost turn alert */}
      {!queueData.isYourTurn && queueData.isAlmostTurn && (
        <View style={[styles.alertBanner, { backgroundColor: `${colors.warning}18` }]}>
          <Text style={styles.alertIcon}>⚡</Text>
          <Text style={[styles.alertText, { color: colors.warning }]}>
            Almost your turn — please be ready at the clinic
          </Text>
        </View>
      )}

      {/* Recommendation */}
      {queueData.recommendation?.message && !queueData.isYourTurn && !queueData.isAlmostTurn && (
        <Text style={[styles.recommendation, { color: colors.textSecondary }]}>
          {queueData.recommendation.message}
        </Text>
      )}

      {/* Error state */}
      {error && (
        <TouchableOpacity onPress={fetchQueueStatus} style={styles.retryRow}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Text style={[styles.retryText, { color: colors.primary }]}> Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  loadingText: { ...typography.bodySmall, marginLeft: spacing.sm },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  title: { ...typography.headlineSmall, fontWeight: '700' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xs },
  liveText: { ...typography.labelSmall, fontWeight: '700' },
  content: { flexDirection: 'row', alignItems: 'flex-start' },
  positionCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.lg, flexShrink: 0,
  },
  positionNumber: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 32 },
  positionLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.85)' },
  stats: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 16, marginRight: spacing.sm, width: 22 },
  statLabel: { ...typography.labelSmall },
  statValue: { ...typography.bodySmall, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.md,
  },
  alertIcon: { fontSize: 16, marginRight: spacing.sm },
  alertText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },
  recommendation: { ...typography.bodySmall, marginTop: spacing.sm, lineHeight: 18 },
  retryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  errorText: { ...typography.bodySmall },
  retryText: { ...typography.bodySmall, fontWeight: '600' },
});

export default QueueTracker;
