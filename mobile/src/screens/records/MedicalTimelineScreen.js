/**
 * MedicalTimelineScreen - Chronological health events timeline with API integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const MedicalTimelineScreen = ({ navigation }) => {
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'appointments', label: 'Visits' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Reports' },
    { id: 'vitals', label: 'Vitals' },
  ];

  const fetchTimeline = useCallback(async (pageNum = 1, filter = activeFilter) => {
    if (!user?._id) return;
    
    try {
      const response = await apiClient.get(`/health/timeline/${user._id}`, {
        params: { filter, page: pageNum, limit: 20 }
      });
      
      const { events: newEvents, pagination } = response.data;
      
      if (pageNum === 1) {
        setEvents(newEvents || []);
      } else {
        setEvents(prev => [...prev, ...(newEvents || [])]);
      }
      
      setHasMore(pagination?.page < pagination?.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      // Keep existing events on error
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?._id, activeFilter]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchTimeline(1, activeFilter);
  }, [activeFilter, user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTimeline(1, activeFilter);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchTimeline(page + 1, activeFilter);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const getTypeIcon = (type) => {
    const icons = {
      appointment: '👨‍⚕️',
      prescription: '💊',
      report: '🔬',
      vitals: '❤️',
      lab: '🧪',
      imaging: '📷',
    };
    return icons[type] || '📋';
  };

  const handleEventPress = (event) => {
    switch (event.type) {
      case 'appointment':
        if (event.referenceId) {
          navigation.navigate('AppointmentDetails', { appointmentId: event.referenceId });
        }
        break;
      case 'prescription':
        if (event.referenceId) {
          navigation.navigate('PrescriptionView', { prescriptionId: event.referenceId });
        }
        break;
      case 'report':
        if (event.referenceId) {
          navigation.navigate('ReportView', { reportId: event.referenceId });
        }
        break;
      case 'vitals':
        navigation.navigate('VitalsHistory');
        break;
    }
  };

  const getTypeColor = (type) => {
    const colorMap = { 
      appointment: '#10B981', 
      prescription: '#F59E0B', 
      report: '#3B82F6', 
      vitals: '#EF4444',
      lab: '#8B5CF6',
      imaging: '#EC4899',
    };
    return colorMap[type] || colors.primary;
  };

  const renderEvent = ({ item, index }) => (
    <View style={styles.eventContainer}>
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, { backgroundColor: getTypeColor(item.type) }]} />
        {index < events.length - 1 && <View style={styles.line} />}
      </View>
      <TouchableOpacity 
        style={styles.eventCardWrapper}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
      >
        <Card variant="default" style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventIcon}>{item.icon || getTypeIcon(item.type)}</Text>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.eventSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            <View style={styles.eventRight}>
              <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
              {item.metadata?.status && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.metadata.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.metadata.status) }]}>
                    {item.metadata.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status) => {
    const statusColors = {
      completed: '#10B981',
      confirmed: '#3B82F6',
      pending: '#F59E0B',
      cancelled: '#EF4444',
    };
    return statusColors[status?.toLowerCase()] || colors.textMuted;
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        keyExtractor={(item, index) => item._id || item.referenceId || `event-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubtext}>Your medical history will appear here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  addIcon: { fontSize: 28, color: colors.primary },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.labelMedium, color: colors.textPrimary },
  filterTextActive: { color: colors.textInverse, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  eventContainer: { flexDirection: 'row', marginBottom: spacing.md },
  timelineLeft: { width: 28, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: spacing.lg, borderWidth: 2, borderColor: colors.background },
  line: { width: 2, flex: 1, backgroundColor: colors.surfaceBorder, marginTop: spacing.xs },
  eventCardWrapper: { flex: 1, marginLeft: spacing.md },
  eventCard: { padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { fontSize: 28, marginRight: spacing.md },
  eventInfo: { flex: 1 },
  eventTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  eventSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  eventRight: { alignItems: 'flex-end' },
  eventDate: { ...typography.labelMedium, color: colors.primary, fontWeight: '500' },
  statusBadge: { marginTop: 6, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusText: { ...typography.labelSmall, fontSize: 11, textTransform: 'capitalize', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyText: { ...typography.headlineSmall, color: colors.textSecondary },
  emptySubtext: { ...typography.bodyMedium, color: colors.textMuted, marginTop: spacing.sm },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});

export default MedicalTimelineScreen;
