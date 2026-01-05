/**
 * Admin User Detail Screen - Patient/User Profile
 * 100% Parity with Web Admin
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
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminUserDetailScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const data = await adminApi.getUserById(userId);
      setUser(data.user || data);
    } catch (error) {
      console.log('Error fetching user:', error.message);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, [fetchUser]);

  const handleSuspend = async () => {
    Alert.alert('Suspend User', 'Are you sure you want to suspend this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: async () => {
        try {
          await adminApi.suspendUser(userId, 'Suspended by admin');
          Alert.alert('Success', 'User suspended');
          fetchUser();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const handleActivate = async () => {
    try {
      await adminApi.activateUser(userId);
      Alert.alert('Success', 'User activated');
      fetchUser();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };


  const isActive = user?.isActive !== false;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>User Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>User not found</Text>
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>User Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user.role || 'Patient'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#10B98120' : '#EF444420' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#EF4444' }]}>
              {isActive ? 'Active' : 'Suspended'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Joined</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>
          </View>
          {user.suspendReason && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Suspend Reason</Text>
              <Text style={[styles.infoValue, { color: '#EF4444' }]}>{user.suspendReason}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isActive ? (
            <TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={handleSuspend}>
              <Text style={styles.suspendBtnText}>🚫 Suspend User</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.activateBtn]} onPress={handleActivate}>
              <Text style={styles.activateBtnText}>✓ Activate User</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium },
  profileCard: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3498DB20', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#3498DB' },
  userName: { ...typography.headlineMedium, marginBottom: spacing.xs },
  userRole: { ...typography.bodyMedium, marginBottom: spacing.md, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelMedium, fontWeight: '600' },
  infoCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { ...typography.bodySmall },
  infoValue: { ...typography.bodyMedium, fontWeight: '500' },
  actionButtons: { gap: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  suspendBtn: { backgroundColor: '#EF444420' },
  suspendBtnText: { color: '#EF4444', fontWeight: '600', ...typography.bodyMedium },
  activateBtn: { backgroundColor: '#10B981' },
  activateBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
});

export default AdminUserDetailScreen;
