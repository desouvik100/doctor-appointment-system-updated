/**
 * Admin Support Tickets Screen - Support Ticket Management
 * 100% Parity with Web Admin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminSupportTicketsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [replyModal, setReplyModal] = useState({ visible: false, ticketId: null });
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        adminApi.getSupportTickets(filter !== 'all' ? { status: filter } : {}),
        adminApi.getSupportStats().catch(() => ({})),
      ]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : ticketsData.tickets || []);
      setStats(statsData);
    } catch (error) {
      console.log('Error fetching tickets:', error.message);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }
    try {
      await adminApi.replyToTicket(replyModal.ticketId, replyText);
      Alert.alert('Success', 'Reply sent');
      setReplyModal({ visible: false, ticketId: null });
      setReplyText('');
      fetchTickets();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await adminApi.updateTicketStatus(ticketId, status);
      Alert.alert('Success', `Ticket marked as ${status}`);
      fetchTickets();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#EF4444';
      case 'in-progress': case 'inprogress': return '#F59E0B';
      case 'resolved': case 'closed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': case 'urgent': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
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

  const renderTicket = ({ item }) => (
    <View style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={[styles.ticketSubject, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.subject || 'No Subject'}
          </Text>
          <Text style={[styles.ticketUser, { color: colors.textSecondary }]}>
            {item.user?.name || item.email || 'Unknown User'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'Open'}
          </Text>
        </View>
      </View>

      <Text style={[styles.ticketMessage, { color: colors.textMuted }]} numberOfLines={2}>
        {item.message || item.description || 'No message'}
      </Text>

      <View style={styles.ticketMeta}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority || 'Normal'}
          </Text>
        </View>
        <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.replyBtn]}
          onPress={() => setReplyModal({ visible: true, ticketId: item._id })}
        >
          <Text style={styles.replyBtnText}>💬 Reply</Text>
        </TouchableOpacity>
        {item.status !== 'resolved' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.resolveBtn]}
            onPress={() => handleUpdateStatus(item._id, 'resolved')}
          >
            <Text style={styles.resolveBtnText}>✓ Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Support Tickets</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EF444420' }]}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.open || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Open</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.inProgress || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.resolved || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Resolved</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Open" value="open" />
        <FilterButton label="In Progress" value="in-progress" />
        <FilterButton label="Resolved" value="resolved" />
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tickets found</Text>
          </View>
        }
      />

      <Modal visible={replyModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reply to Ticket</Text>
            <TextInput
              style={[styles.replyInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Type your reply..."
              placeholderTextColor={colors.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => { setReplyModal({ visible: false, ticketId: null }); setReplyText(''); }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.sendBtn]} onPress={handleReply}>
                <Text style={styles.sendBtnText}>Send Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  statValue: { ...typography.headlineSmall, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.xs },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelSmall },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  ticketCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  ticketHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  ticketInfo: { flex: 1 },
  ticketSubject: { ...typography.bodyLarge, fontWeight: '600' },
  ticketUser: { ...typography.bodySmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  ticketMessage: { ...typography.bodySmall, marginBottom: spacing.sm },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  priorityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  priorityText: { ...typography.labelSmall, fontWeight: '600' },
  ticketDate: { ...typography.labelSmall },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  replyBtn: { backgroundColor: '#3B82F620' },
  replyBtnText: { color: '#3B82F6', fontWeight: '600' },
  resolveBtn: { backgroundColor: '#10B98120' },
  resolveBtnText: { color: '#10B981', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { borderRadius: borderRadius.xl, padding: spacing.xl },
  modalTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  replyInput: { height: 120, borderRadius: borderRadius.lg, padding: spacing.md, textAlignVertical: 'top', ...typography.bodyMedium },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: 'rgba(0,0,0,0.05)' },
  cancelModalBtnText: { color: '#6B7280', fontWeight: '600' },
  sendBtn: { backgroundColor: '#F39C12' },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});

export default AdminSupportTicketsScreen;
