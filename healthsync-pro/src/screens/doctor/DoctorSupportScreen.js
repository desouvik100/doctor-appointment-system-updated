/**
 * Doctor Support Screen - Contact Admin Support
 * Allows doctors to create and view support tickets
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const DoctorSupportScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  const categories = [
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'technical', label: 'Technical', icon: '🔧' },
    { id: 'billing', label: 'Billing', icon: '💰' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'patient', label: 'Patient Issue', icon: '👤' },
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: '#10B981' },
    { id: 'medium', label: 'Medium', color: '#F59E0B' },
    { id: 'high', label: 'High', color: '#EF4444' },
  ];

  const fetchTickets = useCallback(async () => {
    try {
      const response = await apiClient.get(`/support/doctor/${user?.id || user?._id}`);
      if (response.data.success) {
        setTickets(response.data.tickets || []);
      }
    } catch (error) {
      console.log('Error fetching tickets:', error.message);
      // Use empty array if API fails
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  }, [fetchTickets]);

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!newTicket.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('/support/tickets', {
        ...newTicket,
        doctorId: user?.id || user?._id,
        doctorName: user?.name,
        clinicId: user?.clinicId?._id || user?.clinicId,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Support ticket submitted successfully');
        setShowNewTicket(false);
        setNewTicket({ subject: '', category: 'general', priority: 'medium', message: '' });
        fetchTickets();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading support...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Support</Text>
          <TouchableOpacity 
            onPress={() => setShowNewTicket(!showNewTicket)} 
            style={[styles.addBtn, { backgroundColor: '#6C5CE7' }]}
          >
            <Text style={styles.addIcon}>{showNewTicket ? '✕' : '+'}</Text>
          </TouchableOpacity>
        </View>

        {/* Support Banner */}
        <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>🎧</Text>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Admin Support</Text>
              <Text style={styles.bannerSubtitle}>We're here to help you</Text>
            </View>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </LinearGradient>

        {/* New Ticket Form */}
        {showNewTicket && (
          <Card style={[styles.newTicketCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>New Support Ticket</Text>
            
            {/* Subject */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Brief description of your issue"
              placeholderTextColor={colors.textMuted}
              value={newTicket.subject}
              onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })}
            />

            {/* Category */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryBtn,
                    { backgroundColor: colors.background },
                    newTicket.category === cat.id && styles.categoryBtnActive,
                  ]}
                  onPress={() => setNewTicket({ ...newTicket, category: cat.id })}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    { color: newTicket.category === cat.id ? '#6C5CE7' : colors.textSecondary }
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.priorityBtn,
                    { borderColor: p.color },
                    newTicket.priority === p.id && { backgroundColor: p.color + '20' },
                  ]}
                  onPress={() => setNewTicket({ ...newTicket, priority: p.id })}
                >
                  <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Message */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Message</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={colors.textMuted}
              value={newTicket.message}
              onChangeText={(text) => setNewTicket({ ...newTicket, message: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.submitBtnGradient}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Card>
        )}

        {/* Tickets List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Your Tickets ({tickets.length})
          </Text>

          {tickets.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No support tickets yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Tap + to create a new ticket
              </Text>
            </Card>
          ) : (
            tickets.map((ticket, index) => (
              <Card key={ticket._id || index} style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketTitleRow}>
                    <Text style={styles.ticketCategoryIcon}>
                      {categories.find(c => c.id === ticket.category)?.icon || '💬'}
                    </Text>
                    <Text style={[styles.ticketSubject, { color: colors.textPrimary }]} numberOfLines={1}>
                      {ticket.subject}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {getStatusLabel(ticket.status)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ticketMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                  {ticket.message}
                </Text>
                <View style={styles.ticketFooter}>
                  <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={[styles.priorityIndicator, { backgroundColor: priorities.find(p => p.id === ticket.priority)?.color || '#6B7280' }]} />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scrollContent: { paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Banner
  banner: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerContent: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: { fontSize: 32, marginRight: spacing.md },
  bannerText: {},
  bannerTitle: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', ...typography.bodySmall },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: spacing.xs },
  liveText: { color: '#fff', ...typography.labelSmall, fontWeight: '600' },

  // New Ticket Form
  newTicketCard: { margin: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl },
  formTitle: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.lg },
  inputLabel: { ...typography.labelMedium, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { padding: spacing.md, borderRadius: borderRadius.md, ...typography.bodyMedium },
  textArea: { padding: spacing.md, borderRadius: borderRadius.md, ...typography.bodyMedium, minHeight: 100 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center' },
  categoryBtnActive: { borderWidth: 2, borderColor: '#6C5CE7' },
  categoryIcon: { fontSize: 16, marginRight: spacing.xs },
  categoryLabel: { ...typography.labelSmall },
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
  priorityBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2, alignItems: 'center' },
  priorityLabel: { ...typography.labelMedium, fontWeight: '600' },
  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', ...typography.labelLarge, fontWeight: '700' },

  // Section
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '600', marginBottom: spacing.md },

  // Empty state
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium, marginBottom: spacing.xs },
  emptySubtext: { ...typography.bodySmall },

  // Ticket card
  ticketCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  ticketTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  ticketCategoryIcon: { fontSize: 16, marginRight: spacing.sm },
  ticketSubject: { ...typography.bodyMedium, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  ticketMessage: { ...typography.bodySmall, marginBottom: spacing.sm },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketDate: { ...typography.labelSmall },
  priorityIndicator: { width: 8, height: 8, borderRadius: 4 },
});

export default DoctorSupportScreen;
