/**
 * EMR Patient Timeline Screen — Full parity with web PatientTimeline
 * Chronological view of visits, prescriptions, lab results, diagnoses, follow-ups
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { getPatientTimeline } from '../../../services/api/emrApi';

const EVENT_TYPES = {
  visit:        { icon: '🏥', label: 'Visit',        color: '#3B82F6' },
  prescription: { icon: '💊', label: 'Prescription', color: '#22C55E' },
  report:       { icon: '📄', label: 'Report',       color: '#F59E0B' },
  lab_result:   { icon: '🧪', label: 'Lab Result',   color: '#8B5CF6' },
  diagnosis:    { icon: '🩺', label: 'Diagnosis',    color: '#EC4899' },
  follow_up:    { icon: '📅', label: 'Follow-up',    color: '#06B6D4' },
};

const FILTERS = ['all', 'visit', 'prescription', 'lab_result', 'diagnosis', 'follow_up'];

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const relativeTime = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const groupByDate = (events) => {
  const groups = {};
  events.forEach(e => {
    const key = new Date(e.date).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups)
    .map(([date, items]) => ({ date: new Date(date), items: items.sort((a, b) => new Date(b.date) - new Date(a.date)) }))
    .sort((a, b) => b.date - a.date);
};

const EMRPatientTimelineScreen = ({ navigation, route }) => {
  const { patientId, patientName, clinicId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchTimeline = useCallback(async () => {
    try {
      const data = await getPatientTimeline(patientId, clinicId);
      setEvents(data.events || []);
    } catch { setEvents([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [patientId, clinicId]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
  const grouped = groupByDate(filtered);

  const renderEventDetail = (event) => {
    switch (event.type) {
      case 'visit':
        return (
          <View style={styles.eventDetail}>
            {event.doctorName && <Text style={[styles.detailText, { color: colors.textSecondary }]}>👨‍⚕️ Dr. {event.doctorName}</Text>}
            {event.chiefComplaint && <Text style={[styles.detailText, { color: colors.textSecondary }]}>Complaint: {event.chiefComplaint}</Text>}
            {event.diagnosis && <Text style={[styles.detailText, { color: colors.textSecondary }]}>Diagnosis: {event.diagnosis}</Text>}
          </View>
        );
      case 'prescription':
        return (
          <View style={styles.eventDetail}>
            {event.doctorName && <Text style={[styles.detailText, { color: colors.textSecondary }]}>👨‍⚕️ Dr. {event.doctorName}</Text>}
            {event.medications?.length > 0 && (
              <View style={styles.medTags}>
                {event.medications.map((m, i) => (
                  <View key={i} style={[styles.medTag, { backgroundColor: '#22C55E20' }]}>
                    <Text style={[styles.medTagText, { color: '#22C55E' }]}>{m.name || m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      case 'lab_result':
      case 'report':
        return (
          <View style={styles.eventDetail}>
            {event.reportType && <Text style={[styles.detailText, { color: colors.textSecondary }]}>Type: {event.reportType}</Text>}
            {event.summary && <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.summary}</Text>}
          </View>
        );
      default:
        return event.description ? (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.description}</Text>
        ) : null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading timeline...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Patient Timeline</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <Text style={[styles.eventCount, { color: 'rgba(255,255,255,0.7)' }]}>{events.length} events</Text>
      </LinearGradient>

      {/* Stats row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.statsRow, { backgroundColor: colors.surface }]}>
        {Object.entries(EVENT_TYPES).map(([key, val]) => {
          const count = events.filter(e => e.type === key).length;
          if (!count) return null;
          return (
            <View key={key} style={[styles.statChip, { borderColor: val.color }]}>
              <Text style={styles.statChipIcon}>{val.icon}</Text>
              <Text style={[styles.statChipCount, { color: val.color }]}>{count}</Text>
              <Text style={[styles.statChipLabel, { color: colors.textMuted }]}>{val.label}s</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map(f => {
          const et = EVENT_TYPES[f];
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && { backgroundColor: et?.color || colors.primary }]}>
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
                {et ? `${et.icon} ${et.label}` : 'All Events'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTimeline(); }} tintColor={colors.primary} />}
      >
        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No events found</Text>
          </View>
        ) : (
          grouped.map((group, gi) => (
            <View key={gi} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, { color: colors.textPrimary }]}>{formatDate(group.date)}</Text>
                <Text style={[styles.dayRelative, { color: colors.textMuted }]}>{relativeTime(group.date)}</Text>
              </View>
              {group.items.map((event, ei) => {
                const et = EVENT_TYPES[event.type] || EVENT_TYPES.visit;
                const isExpanded = expanded === (event._id || `${gi}-${ei}`);
                return (
                  <TouchableOpacity key={event._id || ei}
                    onPress={() => setExpanded(isExpanded ? null : (event._id || `${gi}-${ei}`))}
                    style={[styles.eventCard, { backgroundColor: colors.surface, borderLeftColor: et.color }]}
                    activeOpacity={0.7}>
                    <View style={styles.eventCardHeader}>
                      <View style={[styles.eventIconBg, { backgroundColor: et.color + '20' }]}>
                        <Text style={styles.eventIcon}>{et.icon}</Text>
                      </View>
                      <View style={styles.eventCardInfo}>
                        <View style={styles.eventCardTop}>
                          <Text style={[styles.eventType, { color: et.color }]}>{et.label}</Text>
                          <Text style={[styles.eventTime, { color: colors.textMuted }]}>{formatTime(event.date)}</Text>
                        </View>
                        <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={isExpanded ? undefined : 1}>
                          {event.title || et.label}
                        </Text>
                      </View>
                      <Text style={[styles.expandIcon, { color: colors.textMuted }]}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                    {isExpanded && renderEventDetail(event)}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', ...typography.labelSmall },
  eventCount: { ...typography.labelSmall },
  statsRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.sm },
  statChipIcon: { fontSize: 14 },
  statChipCount: { ...typography.labelMedium, fontWeight: '700' },
  statChipLabel: { ...typography.labelSmall },
  filterRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { ...typography.labelSmall, fontWeight: '600' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  dayGroup: { marginBottom: spacing.xl },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  dayDate: { ...typography.bodyMedium, fontWeight: '700' },
  dayRelative: { ...typography.labelSmall },
  eventCard: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4 },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center' },
  eventIconBg: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  eventIcon: { fontSize: 18 },
  eventCardInfo: { flex: 1 },
  eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventType: { ...typography.labelSmall, fontWeight: '700' },
  eventTime: { ...typography.labelSmall },
  eventTitle: { ...typography.bodyMedium, fontWeight: '600', marginTop: 2 },
  expandIcon: { fontSize: 12, marginLeft: spacing.sm },
  eventDetail: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  detailText: { ...typography.labelSmall, marginBottom: spacing.xs },
  medTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  medTag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  medTagText: { ...typography.labelSmall, fontWeight: '600' },
});

export default EMRPatientTimelineScreen;
