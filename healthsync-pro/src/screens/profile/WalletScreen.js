/**
 * Wallet Screen - Patient Health Wallet
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const WalletScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useUser();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'overview');
  const [addMoneyVisible, setAddMoneyVisible] = useState(route?.params?.action === 'addMoney');
  const [addAmount, setAddAmount] = useState('');

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const fetchWallet = useCallback(async () => {
    try {
      const res = await apiClient.get('/wallet/balance').catch(() => null);
      if (res?.data) {
        setBalance(res.data.balance || 0);
        setTransactions(res.data.transactions || getDemoTransactions());
      } else {
        setBalance(250);
        setTransactions(getDemoTransactions());
      }
    } catch {
      setBalance(250);
      setTransactions(getDemoTransactions());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const getDemoTransactions = () => [
    { _id: '1', type: 'credit', amount: 500, description: 'Added to wallet', date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'success' },
    { _id: '2', type: 'debit', amount: 300, description: 'Appointment - Dr. Souvik De', date: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'success' },
    { _id: '3', type: 'credit', amount: 50, description: 'Cashback reward', date: new Date(Date.now() - 7 * 86400000).toISOString(), status: 'success' },
    { _id: '4', type: 'debit', amount: 200, description: 'Lab Test - CBC', date: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'success' },
    { _id: '5', type: 'credit', amount: 200, description: 'Refund - Cancelled appointment', date: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'success' },
  ];

  const handleAddMoney = async () => {
    const amount = parseInt(addAmount);
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (min ₹10)');
      return;
    }
    Alert.alert('Add Money', `Add ₹${amount} to your wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Proceed',
        onPress: () => {
          setBalance(prev => prev + amount);
          setTransactions(prev => [{
            _id: Date.now().toString(),
            type: 'credit',
            amount,
            description: 'Added to wallet',
            date: new Date().toISOString(),
            status: 'success',
          }, ...prev]);
          setAddMoneyVisible(false);
          setAddAmount('');
          Alert.alert('Success', `₹${amount} added to your wallet`);
        },
      },
    ]);
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Wallet</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWallet(); }} colors={[colors.primary]} />}
      >
        {/* Balance Card */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          <Text style={styles.balanceSubtext}>Use for appointments, lab tests & more</Text>
          <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setAddMoneyVisible(true)}>
            <Text style={styles.addMoneyBtnText}>+ Add Money</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={styles.statIcon}>💸</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹{transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹{transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Added</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={styles.statIcon}>🎁</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹{transactions.filter(t => t.type === 'credit' && t.description.toLowerCase().includes('cashback')).reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cashback</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((txn) => (
              <View key={txn._id} style={[styles.txnCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={[styles.txnIconWrap, { backgroundColor: txn.type === 'credit' ? `${colors.success}20` : `${colors.error}20` }]}>
                  <Text style={styles.txnIcon}>{txn.type === 'credit' ? '↓' : '↑'}</Text>
                </View>
                <View style={styles.txnInfo}>
                  <Text style={[styles.txnDesc, { color: colors.textPrimary }]}>{txn.description}</Text>
                  <Text style={[styles.txnDate, { color: colors.textMuted }]}>{formatDate(txn.date)}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? colors.success : colors.error }]}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Money Modal */}
      <Modal visible={addMoneyVisible} transparent animationType="slide" onRequestClose={() => setAddMoneyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Money</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Enter amount to add to your wallet</Text>

            <View style={[styles.amountInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.rupeeSign, { color: colors.textPrimary }]}>₹</Text>
              <TextInput
                style={[styles.amountField, { color: colors.textPrimary }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={addAmount}
                onChangeText={setAddAmount}
              />
            </View>

            <View style={styles.quickAmounts}>
              {quickAmounts.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmtBtn, { backgroundColor: colors.surface, borderColor: addAmount === String(amt) ? colors.primary : colors.surfaceBorder }]}
                  onPress={() => setAddAmount(String(amt))}
                >
                  <Text style={[styles.quickAmtText, { color: addAmount === String(amt) ? colors.primary : colors.textSecondary }]}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.proceedBtn} onPress={handleAddMoney}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.proceedBtnGradient}>
                <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddMoneyVisible(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  scrollContent: { paddingBottom: 100 },
  balanceCard: { marginHorizontal: spacing.xl, borderRadius: borderRadius.xl, padding: spacing.xxl, marginBottom: spacing.xl, alignItems: 'center' },
  balanceLabel: { ...typography.labelMedium, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  balanceAmount: { fontSize: 48, fontWeight: '700', color: '#fff', marginBottom: spacing.sm },
  balanceSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xl, textAlign: 'center' },
  addMoneyBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  addMoneyBtnText: { ...typography.button, color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1 },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineSmall, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  section: { paddingHorizontal: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  emptyCard: { borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center', borderWidth: 1 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  txnCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  txnIconWrap: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txnIcon: { fontSize: 20, fontWeight: '700' },
  txnInfo: { flex: 1 },
  txnDesc: { ...typography.bodyMedium, fontWeight: '500' },
  txnDate: { ...typography.labelSmall, marginTop: 2 },
  txnAmount: { ...typography.bodyLarge, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xxl, paddingBottom: 40 },
  modalTitle: { ...typography.headlineMedium, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodyMedium, marginBottom: spacing.xl },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  rupeeSign: { ...typography.headlineMedium, marginRight: spacing.sm },
  amountField: { flex: 1, ...typography.displaySmall, paddingVertical: spacing.md },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  quickAmtBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
  quickAmtText: { ...typography.labelMedium },
  proceedBtn: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  proceedBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  proceedBtnText: { ...typography.button, color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelBtnText: { ...typography.labelLarge },
});

export default WalletScreen;
