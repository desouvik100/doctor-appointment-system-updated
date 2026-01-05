/**
 * Staff Patients Screen - Clinic Patient Management
 * 100% Parity with Web Staff Dashboard
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
  TextInput,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffPatientsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const data = await staffApi.getClinicPatients(user.clinicId);
      const list = data?.patients || data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log('Error fetching patients:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  }, [fetchPatients]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchPatients();
    setLoading(true);
    try {
      const data = await staffApi.searchPatients(searchQuery);
      const list = data?.users || data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log('Search error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPatient = ({ item }) => (
    <TouchableOpacity
      style={[styles.patientCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('StaffPatientDetail', { patientId: item._id })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.charAt(0) || 'P'}</Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={[styles.patientName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.patientMeta, { color: colors.textMuted }]}>
          {item.phone || 'No phone'} • {item.gender || 'N/A'}
        </Text>
        {item.lastVisit && (
          <Text style={[styles.lastVisit, { color: colors.textSecondary }]}>
            Last visit: {new Date(item.lastVisit).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patients</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('StaffRegisterPatient')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search by name, phone, email..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
        {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
      </Text>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderPatient}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No patients found</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff' },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.lg, ...typography.bodyMedium },
  resultCount: { paddingHorizontal: spacing.xl, marginBottom: spacing.md, ...typography.labelSmall },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  patientCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF6B6B20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { color: '#FF6B6B', ...typography.bodyLarge, fontWeight: '700' },
  patientInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  patientMeta: { ...typography.labelSmall, marginTop: 2 },
  lastVisit: { ...typography.labelSmall, marginTop: 2 },
  chevron: { fontSize: 24, color: '#ccc' },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffPatientsScreen;
