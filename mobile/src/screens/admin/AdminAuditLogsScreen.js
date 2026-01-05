/**
 * Admin Audit Logs Screen - System Activity Logs
 * 100% Parity with Web Admin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminAuditLogsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    try {
      const data = await adminApi.getAuditLogs(filter !== 'all' ? { action: filter } : {});
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (error) {
      console.log('Error fetching audit logs:', error.message);
      Alert.alert('Error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const getActionColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create') || actionLower.includes('add')) return '#10B981';
    if (actionLower.includes('update') || actionLower.includes('edit')) return '#3B82F6';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return '#EF4444';
    if (actionLower.includes('login') || actionLower.includes('auth')) return '#8B5CF6';
    if (actionLower.includes('approve')) return '#10B981';
    if (actionLower.includes('reject')) return '#EF4444';
    return '#6B7280';
  };

  const getActionIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create') || actionLower.includes('add')) return '➕';
    if (actionLower.includes('update') || actionLower.includes('edit')) return '✏️';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return '🗑️';
    if (actionLower.includes('login')) return '🔐';
    if (actionLower.includes('logout')) return '🚪';
    if (actionLower.includes('approve')) return '✅';
    if (actionLower.includes('reject')) return '❌';
    return '📋';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterBtnText, { color: filter === value ? '#fff' : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLog = ({ item }) => (
    <View style={[styles.logCard, { backgroundColor: colors.surface }]}>
      <View style={styles.logHeader}>
        <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
          <Text style={styles.actionIconText}>{getActionIcon(item.action)}</Text>
        </View>
        <View style={styles.logInfo}>
          <Text style={[styles.logAction, { color: colors.textPrimary }]}>
            {item.action || 'Unknown Action'}
          </Text>
          <Text style={[styles.logUser, { color: colors.textSecondary }]}>
            {item.user?.name || item.performedBy || 'System'}
          </Text>
        </View>
        <Text style={[styles.logTime, { color: colors.textMuted }]}>
          {formatDate(item.createdAt || item.timestamp)}
        </Text>
      </View>
      
      {item.details && (
        <Text style={[styles.logDetails, { color: colors.textMuted }]} numberOfLines={2}>
          {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
        </Text>
      )}
      
      {item.resource && (
        <View style={styles.resourceRow}>
          <Text style={[styles.resourceLabel, { color: colors.textMuted }]}>Resource:</Text>
          <Text style={[styles.resourceValue, { color: colors.textSecondary }]}>
            {item.resource} {item.resourceId ? `(${item.resourceId.slice(-6)})` : ''}
          </Text>
        </View>
      )}

      {item.ipAddress && (
        <View style={styles.resourceRow}>
          <Text style={[styles.resourceLabel, { color: colors.textMuted }]}>IP:</Text>
          <Text style={[styles.resourceValue, { color: colors.textSecondary }]}>{item.ipAddress}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Audit Logs</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.countBadge, { color: colors.textSecondary }]}>{logs.length}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Create" value="create" />
        <FilterButton label="Update" value="update" />
        <FilterButton label="Delete" value="delete" />
        <FilterButton label="Auth" value="login" />
      </View>

      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item, index) => item._id || `log-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No audit logs found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  countBadge: { ...typography.labelMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.xs },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelSmall },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  logCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  logHeader: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionIconText: { fontSize: 18 },
  logInfo: { flex: 1, marginLeft: spacing.md },
  logAction: { ...typography.bodyMedium, fontWeight: '600' },
  logUser: { ...typography.bodySmall, marginTop: 2 },
  logTime: { ...typography.labelSmall },
  logDetails: { ...typography.bodySmall, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  resourceRow: { flexDirection: 'row', marginTop: spacing.xs },
  resourceLabel: { ...typography.labelSmall, marginRight: spacing.xs },
  resourceValue: { ...typography.labelSmall },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default AdminAuditLogsScreen;
