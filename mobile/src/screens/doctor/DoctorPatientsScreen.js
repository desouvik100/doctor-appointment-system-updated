/**
 * Doctor Patients Screen - View patient list
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const DoctorPatientsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const response = await apiClient.get('/doctors/patients');
      setPatients(response.data || []);
    } catch (error) {
      console.log('Error fetching patients:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPatient = ({ item }) => (
    <Card style={[styles.patientCard, { backgroundColor: colors.surface }]}>
      <View style={styles.patientHeader}>
        <View style={[styles.avatar, { backgroundColor: '#6C5CE720' }]}>
          <Text style={styles.avatarText}>
            {(item.name || 'P')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: colors.textPrimary }]}>
            {item.name || 'Patient'}
          </Text>
          <Text style={[styles.patientEmail, { color: colors.textSecondary }]}>
            {item.email || 'No email'}
          </Text>
        </View>
      </View>

      <View style={styles.patientStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {item.totalVisits || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Visits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : 'N/A'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Last Visit</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.viewBtn, { backgroundColor: '#6C5CE720' }]}
        onPress={() => navigation.navigate('DoctorPatientDetail', { patientId: item._id })}
      >
        <Text style={[styles.viewBtnText, { color: '#6C5CE7' }]}>View Records</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Patients</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {patients.length} patients
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search patients..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Patients List */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatient}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No patients found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.headlineLarge,
  },
  subtitle: {
    ...typography.bodyMedium,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...typography.bodyMedium,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  patientCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  patientEmail: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  patientStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xl,
  },
  statItem: {},
  statValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.labelSmall,
  },
  viewBtn: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  viewBtnText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});

export default DoctorPatientsScreen;
