/**
 * Admin Users Screen - Patient/User Management
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
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminUsersScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, suspended

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.log('Error fetching users:', error.message);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && user.isActive !== false;
    if (filter === 'suspended') return matchesSearch && user.isActive === false;
    return matchesSearch;
  });


  const handleSuspend = async (userId) => {
    Alert.alert('Suspend User', 'Are you sure you want to suspend this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: async () => {
        try {
          await adminApi.suspendUser(userId, 'Suspended by admin');
          Alert.alert('Success', 'User suspended');
          fetchUsers();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const handleActivate = async (userId) => {
    try {
      await adminApi.activateUser(userId);
      Alert.alert('Success', 'User activated');
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.message);
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

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={[styles.userCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('AdminUserDetail', { userId: item._id })}
    >
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || 'U'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
          <Text style={[styles.userPhone, { color: colors.textMuted }]}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive !== false ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.isActive !== false ? '#10B981' : '#EF4444' }]}>
            {item.isActive !== false ? 'Active' : 'Suspended'}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {item.isActive !== false ? (
          <TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={() => handleSuspend(item._id)}>
            <Text style={styles.suspendBtnText}>Suspend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.activateBtn]} onPress={() => handleActivate(item._id)}>
            <Text style={styles.activateBtnText}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Users</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.countBadge, { color: colors.textSecondary }]}>{filteredUsers.length}</Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Active" value="active" />
        <FilterButton label="Suspended" value="suspended" />
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
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
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  userCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3498DB20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#3498DB' },
  userInfo: { flex: 1, marginLeft: spacing.md },
  userName: { ...typography.bodyLarge, fontWeight: '600' },
  userEmail: { ...typography.bodySmall, marginTop: 2 },
  userPhone: { ...typography.labelSmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  suspendBtn: { backgroundColor: '#EF444420' },
  suspendBtnText: { color: '#EF4444', fontWeight: '600' },
  activateBtn: { backgroundColor: '#10B98120' },
  activateBtnText: { color: '#10B981', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default AdminUsersScreen;
