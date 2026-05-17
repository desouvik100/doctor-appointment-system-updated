/**
 * Doctor Prescriptions Screen - Prescription Management
 * 100% Parity with Web Doctor Dashboard
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
import { useUser } from '../../context/UserContext';
import doctorApi from '../../services/api/doctorDashboardApi';

const DoctorPrescriptionsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPrescriptions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await doctorApi.getDoctorPrescriptions(user.id);
      setPrescriptions(Array.isArray(data) ? data : data.prescriptions || []);
    } catch (error) {
      console.log('Error fetching prescriptions:', error.message);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  }, [fetchPrescriptions]);

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const renderPrescription = ({ item }) => (
    <TouchableOpacity
      style={[styles.prescriptionCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('DoctorPrescriptionDetail', { prescriptionId: item._id })}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{item.patient?.name?.charAt(0) || 'P'}</Text>
          </View>
          <View>
            <Text style={[styles.patientName, { color: colors.textPrimary }]}>{item.patient?.name || 'Patient'}</Text>
            <Text style={[styles.prescriptionDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#6C5CE720' }]}>
          <Text style={[styles.statusText, { color: '#6C5CE7' }]}>{item.medicines?.length || 0} meds</Text>
        </View>
      </View>
      
      {item.diagnosis && (
        <Text style={[styles.diagnosis, { color: colors.textSecondary }]} numberOfLines={1}>
          Dx: {item.diagnosis}
        </Text>
      )}
      
      <View style={styles.medicinePreview}>
        {(item.medicines || []).slice(0, 3).map((med, idx) => (
          <View key={idx} style={[styles.medicinePill, { backgroundColor: colors.background }]}>
            <Text style={[styles.medicineName, { color: colors.textPrimary }]} numberOfLines={1}>
              💊 {med.name || med.medicineName}
            </Text>
          </View>
        ))}
        {(item.medicines?.length || 0) > 3 && (
          <Text style={[styles.moreText, { color: colors.textMuted }]}>+{item.medicines.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Prescriptions</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('DoctorCreatePrescription')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search prescriptions..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredPrescriptions}
        renderItem={renderPrescription}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No prescriptions found</Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('DoctorCreatePrescription')}
            >
              <Text style={styles.createBtnText}>Create Prescription</Text>
            </TouchableOpacity>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff', fontWeight: '600' },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  prescriptionCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientAvatarText: { fontSize: 16, fontWeight: '700', color: '#6C5CE7' },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  prescriptionDate: { ...typography.labelSmall },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  diagnosis: { ...typography.bodySmall, marginBottom: spacing.sm },
  medicinePreview: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  medicinePill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  medicineName: { ...typography.labelSmall },
  moreText: { ...typography.labelSmall, alignSelf: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium, marginBottom: spacing.lg },
  createBtn: { backgroundColor: '#6C5CE7', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  createBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
});

export default DoctorPrescriptionsScreen;
