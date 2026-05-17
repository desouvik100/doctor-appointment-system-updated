/**
 * EMR Visit History Screen — Full parity with web VisitHistory
 * Filterable list of all visits with status, type, doctor, pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { getVisits } from '../../../services/api/emrApi';

const STATUS_CONFIG = {
  waiting:     { label: 'Waiting',     color: '#F59E0B', icon: '⏳' },
  in_progress: { label: 'In Progress', color: '#3B82F6', icon: '🔄' },
  completed:   { label: 'Completed',   color: '#10B981', icon: '✅' },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', icon: '❌' },
  no_show:     { label: 'No Show',     color: '#6B7280', icon: '🚫' },
};

const TYPE_CONFIG = {
  walk_in:     { label: 'Walk-in',     icon: '🚶' },
  appointment: { label: 'Appointment', icon: '📅' },
  follow_up:   { label: 'Follow-up',   icon: '🔄' },
  emergency:   { label: 'Emergency',   icon: '🚨' },
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const EMRVisitHistoryScreen = ({ navigation, route }) => {
  const { clinicId, patientId, patientName } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVisits = useCallback(async (pg = 1) => {
    try {
      const params = { page: pg, limit: 20 };
      if (patientId) params.patientId = patientId;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.visitType = typeFilter;
      const data = await getVisits(clinicId, params);
      if (pg === 1) setVisits(data.visits || []);
      else setVisits(prev => [...prev, ...(data.visits || [])]);
      setTotalPages(data.pages || 1);
    } catch { setVisits([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [clinicId, patientId, statusFilter, typeFilter]);

  useEffect(() => { setLoading(true); setPage(1); fetchVisits(1); }, [statusFilter, typeFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#92400E', '#B45309']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Visit History</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('EMRVisit', { clinicId, patientId, patientName })}
          style={styles.newVisitBtn}>
          <Text style={styles.newVisitText}>+ New</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => setStatusFilter('')}
          style={[styles.filterChip, !statusFilter && { backgroundColor: colors.primary }]}>
          <Text style={[styles.filterText, { color: !statusFilter ? '#fff' : colors.textSecondary }]}>All</Text>
        </TouchableOpacity>
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <TouchableOpacity key={key} onPress={() => setStatusFilter(statusFilter === key ? '' : key)}
            style={[styles.filterChip, statusFilter === key && { backgroundColor: val.color }]}>
            <Text style={[styles.filterText, { color: statusFilter === key ? '#fff' : colors.textSecondary }]}>
              {val.icon} {val.label.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVisits(1); }} tintColor={colors.primary} />}
        >
          {visits.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No visits found</Text>
            </View>
          ) : (
            visits.map(visit => {
              const status = STATUS_CONFIG[visit.status] || STATUS_CONFIG.waiting;
              const type = TYPE_CONFIG[visit.visitType] || TYPE_CONFIG.walk_in;
              return (
                <TouchableOpacity key={visit._id}
                  onPress={() => navigation.navigate('EMRVisit', { visitId: visit._id, clinicId, patientId: visit.patientId?._id || patientId, patientName: visit.patientId?.name || patientName })}
                  style={[styles.visitCard, { backgroundColor: colors.surface, borderLeftColor: status.color }]}
                  activeOpacity={0.7}>
                  {/* Top row: date/time + status dot + type icon */}
                  <View style={styles.visitCardTop}>
                    <View style={styles.visitDateBlock}>
                      <Text style={[styles.visitDate, { color: colors.textPrimary }]}>{formatDate(visit.visitDate)}</Text>
                      <Text style={[styles.visitTime, { color: colors.textMuted }]}>{formatTime(visit.visitDate)}</Text>
                    </View>
                    <View style={styles.visitBadges}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                      <Text style={styles.typeIcon}>{type.icon}</Text>
                    </View>
                  </View>
                  {/* Details row */}
                  <View style={styles.visitDetails}>
                    {!patientId && visit.patientId && (
                      <Text style={[styles.visitMeta, { color: colors.textPrimary }]} numberOfLines={1}>
                        👤 {visit.patientId.name}
                      </Text>
                    )}
                    {visit.doctorId && (
                      <Text style={[styles.visitMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        👨‍⚕️ Dr. {visit.doctorId.name}
                      </Text>
                    )}
                    {visit.chiefComplaint && (
                      <Text style={[styles.visitMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        📝 {visit.chiefComplaint}
                      </Text>
                    )}
                    {visit.tokenNumber && (
                      <Text style={[styles.visitToken, { color: colors.primary }]}>Token #{visit.tokenNumber}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {page < totalPages && (
            <TouchableOpacity onPress={() => { const next = page + 1; setPage(next); fetchVisits(next); }}
              style={[styles.loadMoreBtn, { borderColor: colors.primary }]}>
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>Load More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  newVisitBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  newVisitText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
  filterRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { ...typography.labelSmall, fontWeight: '600' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  visitCard: { borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4 },
  visitCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  visitDateBlock: { flex: 1 },
  visitDate: { ...typography.bodyMedium, fontWeight: '700' },
  visitTime: { ...typography.labelSmall },
  visitBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { ...typography.labelSmall, fontWeight: '700' },
  typeIcon: { fontSize: 14 },
  visitDetails: { gap: 2 },
  visitMeta: { ...typography.labelSmall },
  visitToken: { ...typography.labelSmall, fontWeight: '700', marginTop: 2 },
  loadMoreBtn: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  loadMoreText: { ...typography.labelMedium, fontWeight: '600' },
});

export default EMRVisitHistoryScreen;
