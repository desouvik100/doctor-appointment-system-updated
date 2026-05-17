/**
 * Admin Coupons Screen - Coupon Management
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
  Modal,
  TextInput,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminCouponsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'percentage' });

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await adminApi.getCoupons();
      setCoupons(Array.isArray(data) ? data : data.coupons || []);
    } catch (error) {
      console.log('Error fetching coupons:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  }, [fetchCoupons]);

  const handleCreateCoupon = async () => {
    try {
      await adminApi.createCoupon(newCoupon);
      Alert.alert('Success', 'Coupon created');
      setShowModal(false);
      setNewCoupon({ code: '', discount: '', type: 'percentage' });
      fetchCoupons();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    Alert.alert('Delete Coupon', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteCoupon(couponId);
          fetchCoupons();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };


  const renderCoupon = ({ item }) => (
    <View style={[styles.couponCard, { backgroundColor: colors.surface }]}>
      <View style={styles.couponHeader}>
        <View style={styles.couponCode}>
          <Text style={styles.codeIcon}>🎫</Text>
          <Text style={[styles.codeText, { color: colors.textPrimary }]}>{item.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.isActive ? '#10B981' : '#EF4444' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.couponDetails}>
        <Text style={[styles.discountText, { color: colors.textPrimary }]}>
          {item.type === 'percentage' ? `${item.discount}% OFF` : `₹${item.discount} OFF`}
        </Text>
        <Text style={[styles.usageText, { color: colors.textMuted }]}>
          Used: {item.usedCount || 0} / {item.maxUses || '∞'}
        </Text>
      </View>
      {item.expiryDate && (
        <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
          Expires: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteCoupon(item._id)}
        >
          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Coupons</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        renderItem={renderCoupon}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No coupons found</Text>
          </View>
        }
      />

      {/* Create Coupon Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Coupon</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Coupon Code"
              placeholderTextColor={colors.textMuted}
              value={newCoupon.code}
              onChangeText={(text) => setNewCoupon({ ...newCoupon, code: text.toUpperCase() })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
              placeholder="Discount Amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={newCoupon.discount}
              onChangeText={(text) => setNewCoupon({ ...newCoupon, discount: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateCoupon}>
                <Text style={styles.createBtnText}>Create</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F39C12', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  couponCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  couponCode: { flexDirection: 'row', alignItems: 'center' },
  codeIcon: { fontSize: 20, marginRight: spacing.sm },
  codeText: { ...typography.bodyLarge, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  couponDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  discountText: { ...typography.headlineSmall },
  usageText: { ...typography.bodySmall },
  expiryText: { ...typography.labelSmall, marginTop: spacing.sm },
  actionButtons: { flexDirection: 'row', marginTop: spacing.md },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  deleteBtn: { backgroundColor: '#EF444420' },
  deleteBtnText: { color: '#EF4444', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: spacing.xl, borderRadius: borderRadius.xl },
  modalTitle: { ...typography.headlineSmall, marginBottom: spacing.lg, textAlign: 'center' },
  input: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  cancelBtnText: { fontWeight: '600' },
  createBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: '#F39C12', alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600' },
});

export default AdminCouponsScreen;
