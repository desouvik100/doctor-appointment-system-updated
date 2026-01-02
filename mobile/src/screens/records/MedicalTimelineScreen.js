/**
 * MedicalTimelineScreen - Chronological health events timeline
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';

const MedicalTimelineScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'appointments', label: 'Visits' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Reports' },
    { id: 'vitals', label: 'Vitals' },
  ];

  // Mock data
  const mockEvents = [
    { id: '1', type: 'appointment', title: 'Consultation with Dr. Sarah Wilson', subtitle: 'Cardiologist', date: '2026-01-02', icon: '👨‍⚕️' },
    { id: '2', type: 'prescription', title: 'Prescription Added', subtitle: 'Metformin 500mg, Aspirin 75mg', date: '2026-01-02', icon: '💊' },
    { id: '3', type: 'report', title: 'Blood Test Results', subtitle: 'Complete Blood Count', date: '2025-12-28', icon: '🔬' },
    { id: '4', type: 'vitals', title: 'Vitals Recorded', subtitle: 'BP: 120/80, HR: 72 bpm', date: '2025-12-28', icon: '❤️' },
    { id: '5', type: 'appointment', title: 'Consultation with Dr. Michael Chen', subtitle: 'General Physician', date: '2025-12-20', icon: '👨‍⚕️' },
    { id: '6', type: 'report', title: 'X-Ray Report', subtitle: 'Chest X-Ray - Normal', date: '2025-12-15', icon: '📋' },
  ];

  useEffect(() => {
    loadEvents();
  }, [activeFilter]);

  const loadEvents = () => {
    let filtered = mockEvents;
    if (activeFilter !== 'all') {
      filtered = mockEvents.filter(e => e.type === activeFilter.slice(0, -1));
    }
    setEvents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    loadEvents();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleEventPress = (event) => {
    switch (event.type) {
      case 'appointment':
        navigation.navigate('AppointmentDetails', { appointmentId: event.id });
        break;
      case 'prescription':
        navigation.navigate('PrescriptionView', { prescriptionId: event.id });
        break;
      case 'report':
        navigation.navigate('ReportView', { reportId: event.id });
        break;
      case 'vitals':
        navigation.navigate('VitalsHistory');
        break;
    }
  };

  const renderEvent = ({ item, index }) => (
    <View style={styles.eventContainer}>
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, { backgroundColor: getTypeColor(item.type) }]} />
        {index < events.length - 1 && <View style={styles.line} />}
      </View>
      <Card variant="default" style={styles.eventCard} onPress={() => handleEventPress(item)}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventIcon}>{item.icon}</Text>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventSubtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
        </View>
      </Card>
    </View>
  );

  const getTypeColor = (type) => {
    const colors_map = { appointment: '#10B981', prescription: '#F59E0B', report: '#3B82F6', vitals: '#EF4444' };
    return colors_map[type] || colors.primary;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Timeline</Text>
        <TouchableOpacity onPress={() => navigation.navigate('UploadReport')}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.id)}
          >
            <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  addIcon: { fontSize: 28, color: colors.primary },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { ...typography.labelMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  eventContainer: { flexDirection: 'row', marginBottom: spacing.md },
  timelineLeft: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: spacing.lg },
  line: { width: 2, flex: 1, backgroundColor: colors.divider, marginTop: spacing.xs },
  eventCard: { flex: 1, marginLeft: spacing.md, padding: spacing.md },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { fontSize: 24, marginRight: spacing.md },
  eventInfo: { flex: 1 },
  eventTitle: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  eventSubtitle: { ...typography.labelSmall, color: colors.textMuted },
  eventDate: { ...typography.labelSmall, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium, color: colors.textMuted },
});

export default MedicalTimelineScreen;
