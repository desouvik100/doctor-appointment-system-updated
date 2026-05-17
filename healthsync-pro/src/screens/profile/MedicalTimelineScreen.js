/**
 * Medical Timeline Screen - View medical history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const MedicalTimelineScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState([]);

  const fetchTimeline = useCallback(async () => {
    try {
      const response = await apiClient.get(`/export/timeline/${user?.id || user?._id}`);
      setTimeline(response.data?.timeline || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeline();
    setRefreshing(false);
  };

  const getEventIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'appointment': return { icon: '📅', color: colors.primary };
      case 'prescription': return { icon: '💊', color: colors.success };
      case 'lab_report': return { icon: '🧪', color: colors.info };
      case 'imaging': return { icon: '🔬', color: colors.warning };
      case 'diagnosis': return { icon: '🩺', color: colors.error };
      default: return { icon: '📋', color: colors.textMuted };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Medical History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        
        {timeline.length > 0 ? (
          <View style={styles.timeline}>
            {timeline.map((event, index) => {
              const { icon, color } = getEventIcon(event.type);
              return (
                <View key={event._id || index} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: color }]}>
                      <Text style={styles.dotIcon}>{icon}</Text>
                    </View>
                    {index < timeline.length - 1 && <View style={[styles.connector, { backgroundColor: colors.divider }]} />}
                  </View>
                  <Card variant="default" style={[styles.eventCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.eventDate, { color: colors.textMuted }]}>{formatDate(event.date)}</Text>
                    <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{event.title}</Text>
                    {event.description && (
                      <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>{event.description}</Text>
                    )}
                    {event.doctor && (
                      <Text style={[styles.eventDoctor, { color: colors.textMuted }]}>👨‍⚕️ {event.doctor}</Text>
                    )}
                  </Card>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Medical History</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Your medical history will appear here after your first appointment
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineMedium },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  timeline: { paddingTop: spacing.md },
  timelineItem: { flexDirection: 'row', marginBottom: spacing.lg },
  timelineLine: { width: 50, alignItems: 'center' },
  timelineDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dotIcon: { fontSize: 18 },
  connector: { width: 2, flex: 1, marginTop: spacing.xs },
  eventCard: { flex: 1, padding: spacing.lg, marginLeft: spacing.md },
  eventDate: { ...typography.labelSmall, marginBottom: spacing.xs },
  eventTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.xs },
  eventDesc: { ...typography.bodySmall, marginBottom: spacing.xs },
  eventDoctor: { ...typography.labelSmall },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center' },
});

export default MedicalTimelineScreen;
