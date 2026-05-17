/**
 * Staff Shift Screen - Clock In / Clock Out
 * Tracks shift start/end with live timer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';

const SHIFT_KEY = 'staff_shift_state';

const pad = n => String(n).padStart(2, '0');

const formatDuration = secs => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const StaffShiftScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [shiftState, setShiftState] = useState(null); // null | { checkInTime, checkOutTime }
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const timerRef = useRef(null);

  // Load persisted shift state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SHIFT_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // Only restore if same day
          const today = new Date().toDateString();
          if (saved.date === today) {
            setShiftState(saved);
            if (saved.checkInTime && !saved.checkOutTime) {
              const secs = Math.floor((Date.now() - new Date(saved.checkInTime).getTime()) / 1000);
              setElapsed(secs);
            }
          } else {
            await AsyncStorage.removeItem(SHIFT_KEY);
          }
        }
      } catch (_) {}
      setInitializing(false);
    })();
  }, []);

  // Live timer
  useEffect(() => {
    if (shiftState?.checkInTime && !shiftState?.checkOutTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(shiftState.checkInTime).getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [shiftState]);

  const saveShiftState = async (state) => {
    setShiftState(state);
    await AsyncStorage.setItem(SHIFT_KEY, JSON.stringify({ ...state, date: new Date().toDateString() }));
  };

  const handleCheckIn = async () => {
    if (!user?.clinicId || !user?._id) {
      Alert.alert('Error', 'Missing clinic or user info');
      return;
    }
    setLoading(true);
    try {
      await staffApi.shiftCheckIn(user.clinicId, user._id);
      const now = new Date().toISOString();
      await saveShiftState({ checkInTime: now, checkOutTime: null });
      setElapsed(0);
    } catch (err) {
      // If already checked in today, still update local state
      if (err?.response?.data?.message?.includes('Already checked in')) {
        const now = new Date().toISOString();
        await saveShiftState({ checkInTime: now, checkOutTime: null });
        setElapsed(0);
      } else {
        Alert.alert('Check-in failed', err?.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = () => {
    Alert.alert('End Shift', 'Are you sure you want to clock out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await staffApi.shiftCheckOut(user.clinicId, user._id);
            const now = new Date().toISOString();
            await saveShiftState({ ...shiftState, checkOutTime: now });
          } catch (err) {
            if (err?.response?.data?.message?.includes('Already checked out') ||
                err?.response?.data?.message?.includes('Not checked in')) {
              const now = new Date().toISOString();
              await saveShiftState({ ...shiftState, checkOutTime: now });
            } else {
              Alert.alert('Check-out failed', err?.response?.data?.message || err.message);
            }
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const isCheckedIn = !!shiftState?.checkInTime && !shiftState?.checkOutTime;
  const isCheckedOut = !!shiftState?.checkOutTime;

  const totalDuration = isCheckedOut
    ? Math.floor((new Date(shiftState.checkOutTime) - new Date(shiftState.checkInTime)) / 1000)
    : elapsed;

  if (initializing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Shift</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Clock Display */}
        <LinearGradient
          colors={isCheckedIn ? ['#10B981', '#059669'] : isCheckedOut ? ['#6C5CE7', '#5B4ED1'] : ['#FF6B6B', '#FF8E53']}
          style={styles.clockCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.clockLabel}>
            {isCheckedIn ? '🟢 SHIFT IN PROGRESS' : isCheckedOut ? '✅ SHIFT ENDED' : '⏸ NOT STARTED'}
          </Text>
          <Text style={styles.clockTime}>{formatDuration(totalDuration)}</Text>
          <Text style={styles.clockSub}>
            {isCheckedIn
              ? `Started at ${new Date(shiftState.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : isCheckedOut
              ? `${new Date(shiftState.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${new Date(shiftState.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `Today, ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`}
          </Text>
        </LinearGradient>

        {/* Staff Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <InfoRow icon="👤" label="Name" value={user?.name || 'Staff'} colors={colors} />
          <InfoRow icon="🏥" label="Clinic" value={user?.clinicName || 'Your Clinic'} colors={colors} />
          <InfoRow icon="📅" label="Date" value={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} colors={colors} isLast />
        </View>

        {/* Shift Log */}
        {(isCheckedIn || isCheckedOut) && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Shift Log</Text>
            <InfoRow icon="🟢" label="Clock In" value={shiftState?.checkInTime ? new Date(shiftState.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'} colors={colors} />
            <InfoRow icon="🔴" label="Clock Out" value={shiftState?.checkOutTime ? new Date(shiftState.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'In progress...'} colors={colors} />
            <InfoRow icon="⏱" label="Duration" value={formatDuration(totalDuration)} colors={colors} isLast />
          </View>
        )}

        {/* Action Button */}
        {!isCheckedOut && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isCheckedIn ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
              style={styles.actionBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.actionBtnText}>{isCheckedIn ? '🔴  Clock Out' : '🟢  Clock In'}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isCheckedOut && (
          <View style={[styles.doneCard, { backgroundColor: '#10B98115' }]}>
            <Text style={styles.doneIcon}>✅</Text>
            <Text style={[styles.doneText, { color: '#10B981' }]}>Shift completed for today</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value, colors, isLast }) => (
  <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: '#2E364920' }]}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#fff' },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  clockCard: { borderRadius: borderRadius.xxl, padding: spacing.xxxl, alignItems: 'center', marginBottom: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  clockLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.md },
  clockTime: { color: '#fff', fontSize: 56, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  clockSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: spacing.md },
  infoCard: { borderRadius: borderRadius.xl, marginBottom: spacing.lg, overflow: 'hidden' },
  cardTitle: { ...typography.bodyMedium, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  infoIcon: { fontSize: 16, marginRight: spacing.md, width: 24 },
  infoLabel: { ...typography.bodySmall, flex: 1 },
  infoValue: { ...typography.bodyMedium, fontWeight: '600' },
  actionBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', marginTop: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  actionBtnGradient: { paddingVertical: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  doneCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginTop: spacing.md },
  doneIcon: { fontSize: 36, marginBottom: spacing.sm },
  doneText: { ...typography.bodyLarge, fontWeight: '600' },
});

export default StaffShiftScreen;
