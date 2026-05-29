/**
 * Wallet Screen - Patient Health Wallet
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import { getBalance, getTransactions, addMoney } from '../../services/api/walletService';
import { fadeIn, slideUp, stagger, bounce } from '../../utils/animations';
import { EmptyState } from '../../components/common';

const WalletScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addMoneyVisible, setAddMoneyVisible] = useState(route?.params?.action === 'addMoney');
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const quickAmounts = [100, 200, 500, 1000, 2000];

  // Animations
  const balanceOpacity = useRef(new Animated.Value(0)).current;
  const balanceScale = useRef(new Animated.Value(0.8)).current;
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const txnAnimations = useRef([]).current;

  const fetchWallet = useCallback(async () => {
    try {
      const [balRes, txnRes] = await Promise.all([
        getBalance(),
        getTransactions(),
      ]);
      setBalance(balRes?.balance || 0);
      setTransactions(txnRes?.transactions || []);
      
      // Animate balance card
      Animated.parallel([
        fadeIn(balanceOpacity, 400),
        Animated.spring(balanceScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Stagger stats cards
      stagger(statsAnimations, fadeIn, 100).start();
      
    } catch {
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // Re-fetch when screen comes into focus (e.g. returning from payment flow)
  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [fetchWallet])
  );

  const handleAddMoney = async () => {
    const amount = Math.round(parseFloat(addAmount));
    if (!addAmount || isNaN(amount) || amount < 10) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (min ₹10)');
      return;
    }
    Alert.alert('Add Money', `Add ₹${amount} to your wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Proceed',
        onPress: async () => {
          setAdding(true);
          try {
            await addMoney(amount, 'upi');
            setAddMoneyVisible(false);
            setAddAmount('');
            await fetchWallet(); // re-fetch real balance + transactions
            Alert.alert('Success', `₹${amount} added to your wallet`);
          } catch (err) {
            Alert.alert('Failed', err?.response?.data?.message || 'Could not add money. Please try again.');
          } finally {
            setAdding(false);
          }
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchWallet(); }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance Card */}
        <Animated.View style={{ opacity: balanceOpacity, transform: [{ scale: balanceScale }] }}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
            <Text style={styles.balanceSubtext}>Use for appointments, lab tests & more</Text>
            <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setAddMoneyVisible(true)}>
              <Text style={styles.addMoneyBtnText}>+ Add Money</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '💸', value: transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0), label: 'Total Spent' },
            { icon: '💰', value: transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0), label: 'Total Added' },
            { icon: '🎁', value: transactions.filter(t => t.type === 'credit' && t.description?.toLowerCase().includes('cashback')).reduce((s, t) => s + Number(t.amount), 0), label: 'Cashback' },
          ].map((stat, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.statCard, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.surfaceBorder,
                  borderWidth: isDarkMode ? 1 : 0,
                  opacity: statsAnimations[index],
                  transform: [{
                    translateY: statsAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                ₹{stat.value.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Transaction History</Text>
          {transactions.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No transactions yet"
              message="Add money to get started"
              actionLabel="Add Money"
              onAction={() => setAddMoneyVisible(true)}
              colors={colors}
            />
          ) : (
            transactions.map((txn) => (
              <View key={txn._id} style={[styles.txnCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
                <View style={[styles.txnIconWrap, { backgroundColor: txn.type === 'credit' ? `${colors.success}20` : `${colors.error}20` }]}>
                  <Text style={styles.txnIcon}>{txn.type === 'credit' ? '↓' : '↑'}</Text>
                </View>
                <View style={styles.txnInfo}>
                  <Text style={[styles.txnDesc, { color: colors.textPrimary }]}>{txn.description}</Text>
                  <Text style={[styles.txnDate, { color: colors.textMuted }]}>{formatDate(txn.date)}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? colors.success : colors.error }]}>
                  {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN')}
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

            <View style={[styles.amountInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: isDarkMode ? 1 : 0 }]}>
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
                  style={[styles.quickAmtBtn, { backgroundColor: colors.surface, borderColor: addAmount === String(amt) ? colors.primary : colors.surfaceBorder, borderWidth: addAmount === String(amt) ? 1.5 : (isDarkMode ? 1 : 0) }]}
                  onPress={() => setAddAmount(String(amt))}
                >
                  <Text style={[styles.quickAmtText, { color: addAmount === String(amt) ? colors.primary : colors.textSecondary }]}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.proceedBtn} onPress={handleAddMoney} disabled={adding}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.proceedBtnGradient}>
                {adding
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddMoneyVisible(false)} disabled={adding}>
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
