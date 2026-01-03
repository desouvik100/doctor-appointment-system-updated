/**
 * Payment Methods Screen - Manage payment options and wallet
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket, SOCKET_EVENTS } from '../../context/SocketContext';
import { getBalance, getTransactions, addMoney } from '../../services/api/walletService';

const PaymentMethodsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const { subscribe, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: '💳', color: '#4285F4' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱', color: '#5F259F' },
    { id: 'paytm', name: 'Paytm', icon: '💰', color: '#00BAF2' },
  ];

  const quickAmounts = [100, 500, 1000, 2000];

  const fetchData = useCallback(async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        getBalance(),
        getTransactions({ limit: 10 }),
      ]);
      setWalletBalance(balanceData?.balance || 0);
      setTransactions(transactionsData?.transactions || []);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket event listener for real-time wallet updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubWalletTransaction = subscribe(SOCKET_EVENTS.WALLET_TRANSACTION, (data) => {
      console.log('🔔 [PaymentMethods] Wallet transaction:', data);
      
      // Update balance
      if (data.balance !== undefined) {
        setWalletBalance(data.balance);
      }
      
      // Add new transaction to the list
      if (data.transaction) {
        setTransactions(prev => [data.transaction, ...prev].slice(0, 10));
      }
    });

    return () => {
      unsubWalletTransaction();
    };
  }, [isConnected, subscribe]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddMoney = async () => {
    const amount = parseInt(addAmount);
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₹10');
      return;
    }
    setAdding(true);
    try {
      const response = await addMoney(amount, 'razorpay');
      if (response?.success) {
        Alert.alert('Success', `₹${amount} added to your wallet!`);
        setShowAddMoney(false);
        setAddAmount('');
        fetchData();
      } else {
        Alert.alert('Demo Mode', 'Payment gateway integration required.');
      }
    } catch (error) {
      Alert.alert('Demo Mode', 'Payment gateway integration required.');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'credit':
      case 'add': return { icon: '↓', color: colors.success };
      case 'debit':
      case 'payment': return { icon: '↑', color: colors.error };
      default: return { icon: '•', color: colors.textMuted };
    }
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Icon name="wallet" size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.walletBalance}>₹{walletBalance.toLocaleString()}</Text>
          <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setShowAddMoney(true)}>
            <Icon name="add" size={18} color="#6366f1" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>UPI Payment</Text>
          <View style={styles.upiRow}>
            {upiApps.map((app) => (
              <TouchableOpacity key={app.id} style={[styles.upiApp, { backgroundColor: colors.surface }]}
                onPress={() => Alert.alert('UPI', `${app.name} coming soon`)}>
                <View style={[styles.upiIcon, { backgroundColor: `${app.color}20` }]}>
                  <Text style={styles.upiEmoji}>{app.icon}</Text>
                </View>
                <Text style={[styles.upiName, { color: colors.textSecondary }]}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          {transactions.length > 0 ? (
            transactions.map((txn, index) => {
              const { icon, color } = getTransactionIcon(txn.type);
              return (
                <Card key={txn._id || index} variant="default" style={[styles.txnCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.txnIcon, { backgroundColor: `${color}20` }]}>
                    <Text style={[styles.txnIconText, { color }]}>{icon}</Text>
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={[styles.txnTitle, { color: colors.textPrimary }]}>{txn.description || txn.type}</Text>
                    <Text style={[styles.txnDate, { color: colors.textMuted }]}>{formatDate(txn.createdAt)}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color }]}>
                    {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(txn.amount)}
                  </Text>
                </Card>
              );
            })
          ) : (
            <Card variant="default" style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddMoney} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Money</Text>
              <TouchableOpacity onPress={() => setShowAddMoney(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={addAmount}
              onChangeText={setAddAmount}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <View style={styles.quickAmounts}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity key={amt} style={[styles.quickBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setAddAmount(amt.toString())}>
                  <Text style={[styles.quickText, { color: colors.textPrimary }]}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddMoney} disabled={adding}>
              {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.proceedText}>Proceed</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  walletCard: { borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xxl },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  walletLabel: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  walletBalance: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginBottom: spacing.lg },
  addMoneyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignSelf: 'flex-start', gap: spacing.xs },
  addMoneyText: { ...typography.labelMedium, color: '#6366f1', fontWeight: '600' },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  upiRow: { flexDirection: 'row', gap: spacing.md },
  upiApp: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  upiIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  upiEmoji: { fontSize: 24 },
  upiName: { ...typography.labelSmall },
  txnCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txnIconText: { fontSize: 18, fontWeight: 'bold' },
  txnInfo: { flex: 1 },
  txnTitle: { ...typography.bodyMedium, fontWeight: '500' },
  txnDate: { ...typography.labelSmall, marginTop: 2 },
  txnAmount: { ...typography.bodyLarge, fontWeight: '600' },
  emptyCard: { padding: spacing.xl, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMedium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { ...typography.headlineSmall },
  amountInput: { ...typography.headlineMedium, textAlign: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  quickAmounts: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  quickBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  quickText: { ...typography.labelMedium, fontWeight: '600' },
  proceedBtn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  proceedText: { ...typography.button, color: '#fff' },
});

export default PaymentMethodsScreen;
