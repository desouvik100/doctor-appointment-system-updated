/**
 * Admin Wallet Screen - Wallet & Payments Management
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
  ScrollView,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminWalletScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [wallets, setWallets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      const [walletsData, withdrawalsData, statsData] = await Promise.all([
        adminApi.getAllDoctorWallets().catch(() => []),
        adminApi.getPendingWithdrawals().catch(() => []),
        adminApi.getWalletStats().catch(() => ({})),
      ]);
      setWallets(Array.isArray(walletsData) ? walletsData : walletsData.wallets || []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : withdrawalsData.withdrawals || []);
      setStats(statsData);
    } catch (error) {
      console.log('Error fetching wallet data:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);


  const handleProcessWithdrawal = async (walletId, requestId, action) => {
    Alert.alert(
      `${action === 'approve' ? 'Approve' : 'Reject'} Withdrawal`,
      `Are you sure you want to ${action} this withdrawal request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action === 'approve' ? 'Approve' : 'Reject', style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await adminApi.processWithdrawal(walletId, requestId, action);
              Alert.alert('Success', `Withdrawal ${action}d`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  const TabButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === value && styles.tabBtnActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabBtnText, { color: activeTab === value ? '#fff' : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderWithdrawal = ({ item }) => (
    <View style={[styles.withdrawalCard, { backgroundColor: colors.surface }]}>
      <View style={styles.withdrawalHeader}>
        <Text style={[styles.withdrawalAmount, { color: colors.textPrimary }]}>₹{item.amount}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
          <Text style={[styles.statusText, { color: '#F59E0B' }]}>Pending</Text>
        </View>
      </View>
      <Text style={[styles.withdrawalDoctor, { color: colors.textSecondary }]}>
        Dr. {item.doctor?.name || 'Unknown'}
      </Text>
      <Text style={[styles.withdrawalDate, { color: colors.textMuted }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleProcessWithdrawal(item.walletId, item._id, 'approve')}
        >
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleProcessWithdrawal(item.walletId, item._id, 'reject')}
        >
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Wallet Management</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalBalance || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Balance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statIcon}>⏳</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{withdrawals.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton label="Overview" value="overview" />
        <TabButton label={`Withdrawals (${withdrawals.length})`} value="withdrawals" />
        <TabButton label="Wallets" value="wallets" />
      </View>

      {activeTab === 'withdrawals' && (
        <FlatList
          data={withdrawals}
          renderItem={renderWithdrawal}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending withdrawals</Text>
            </View>
          }
        />
      )}

      {activeTab === 'wallets' && (
        <FlatList
          data={wallets}
          renderItem={({ item }) => (
            <View style={[styles.walletCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.walletDoctor, { color: colors.textPrimary }]}>Dr. {item.doctor?.name}</Text>
              <Text style={[styles.walletBalance, { color: colors.textSecondary }]}>Balance: ₹{item.balance}</Text>
            </View>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        />
      )}

      {activeTab === 'overview' && (
        <ScrollView contentContainerStyle={styles.overviewContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}>
          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overviewTitle, { color: colors.textPrimary }]}>Wallet Statistics</Text>
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Wallets</Text>
              <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{wallets.length}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Pending Withdrawals</Text>
              <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>{withdrawals.length}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Processed</Text>
              <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>₹{stats.totalProcessed || 0}</Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  statsContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineSmall },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#F39C12' },
  tabBtnText: { ...typography.labelMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  withdrawalCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  withdrawalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  withdrawalAmount: { ...typography.headlineSmall },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  withdrawalDoctor: { ...typography.bodyMedium, marginTop: spacing.xs },
  withdrawalDate: { ...typography.labelSmall, marginTop: 2 },
  actionButtons: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B98120' },
  approveBtnText: { color: '#10B981', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#EF444420' },
  rejectBtnText: { color: '#EF4444', fontWeight: '600' },
  walletCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  walletDoctor: { ...typography.bodyMedium, fontWeight: '600' },
  walletBalance: { ...typography.bodySmall, marginTop: 4 },
  overviewContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  overviewCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  overviewTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  overviewLabel: { ...typography.bodyMedium },
  overviewValue: { ...typography.bodyMedium, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default AdminWalletScreen;
