/**
 * Doctor Wallet Screen - Earnings & Withdrawals
 * 100% Parity with Web Doctor Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const DoctorWalletScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [walletData, txData] = await Promise.all([
        apiClient.get(`/wallet/doctor/${user.id}`).catch(() => ({ data: null })),
        apiClient.get(`/wallet/doctor/${user.id}/transactions`).catch(() => ({ data: [] })),
      ]);
      setWallet(walletData.data?.wallet || walletData.data);
      setTransactions(Array.isArray(txData.data) ? txData.data : txData.data?.transactions || []);
    } catch (error) {
      console.log('Error fetching wallet:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet();
    setRefreshing(false);
  }, [fetchWallet]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (amount > (wallet?.availableBalance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      await apiClient.post(`/wallet/doctor/${user.id}/withdraw`, { amount });
      Alert.alert('Success', 'Withdrawal request submitted');
      setWithdrawModal(false);
      setWithdrawAmount('');
      fetchWallet();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit': case 'earning': return '#10B981';
      case 'debit': case 'withdrawal': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Wallet</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: '#6C5CE7' }]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{(wallet?.availableBalance || 0).toLocaleString()}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Earnings</Text>
              <Text style={styles.balanceItemValue}>₹{(wallet?.totalEarnings || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Pending</Text>
              <Text style={styles.balanceItemValue}>₹{(wallet?.pendingBalance || 0).toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.withdrawBtn}
            onPress={() => setWithdrawModal(true)}
          >
            <Text style={styles.withdrawBtnText}>💸 Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{wallet?.thisMonthEarnings || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Month</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{wallet?.totalConsultations || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Consultations</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{wallet?.commissionRate || 15}%</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Commission</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((tx, index) => (
              <View key={tx._id || index} style={[styles.txCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.txIcon, { backgroundColor: getTransactionColor(tx.type) + '20' }]}>
                  <Text style={styles.txIconText}>{tx.type === 'credit' ? '↓' : '↑'}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{tx.description || tx.type}</Text>
                  <Text style={[styles.txDate, { color: colors.textMuted }]}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: getTransactionColor(tx.type) }]}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={withdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Withdraw Funds</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Available: ₹{(wallet?.availableBalance || 0).toLocaleString()}
            </Text>
            
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => { setWithdrawModal(false); setWithdrawAmount(''); }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={handleWithdraw}
                disabled={withdrawing}
              >
                <Text style={styles.confirmBtnText}>{withdrawing ? 'Processing...' : 'Withdraw'}</Text>
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  balanceCard: { padding: spacing.xl, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', ...typography.labelMedium },
  balanceAmount: { color: '#fff', ...typography.displayLarge, marginVertical: spacing.sm },
  balanceRow: { flexDirection: 'row', marginTop: spacing.md },
  balanceItem: { flex: 1 },
  balanceItemLabel: { color: 'rgba(255,255,255,0.7)', ...typography.labelSmall },
  balanceItemValue: { color: '#fff', ...typography.bodyLarge, fontWeight: '600' },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg },
  withdrawBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineSmall },
  statLabel: { ...typography.labelSmall },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txIconText: { fontSize: 18, fontWeight: '700' },
  txInfo: { flex: 1 },
  txTitle: { ...typography.bodyMedium, fontWeight: '500' },
  txDate: { ...typography.labelSmall },
  txAmount: { ...typography.bodyLarge, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { borderRadius: borderRadius.xl, padding: spacing.xl },
  modalTitle: { ...typography.headlineSmall, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySmall, marginBottom: spacing.lg },
  amountInput: { height: 56, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.headlineSmall, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: 'rgba(0,0,0,0.05)' },
  cancelModalBtnText: { color: '#6B7280', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#6C5CE7' },
  confirmBtnText: { color: '#fff', fontWeight: '600' },
});
export default DoctorWalletScreen;