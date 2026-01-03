/**
 * BookingScreen - Doctor Selection for Booking
 * Fetches real doctors from API and navigates to SlotSelectionScreen
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
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import apiClient from '../../services/api/apiClient';

const BookingScreen = ({ navigation, route }) => {
  // State
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pre-selected doctor from route params (if coming from doctor profile)
  const preSelectedDoctor = route.params?.doctor;

  // If doctor is pre-selected, navigate directly to slot selection
  useEffect(() => {
    if (preSelectedDoctor) {
      navigation.replace('SlotSelection', { doctor: preSelectedDoctor });
    }
  }, [preSelectedDoctor, navigation]);

  // Fetch departments and doctors on mount
  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      // Use correct endpoint: /doctors/specializations/list
      const response = await apiClient.get('/doctors/specializations/list');
      if (response.data) {
        // Transform specializations to departments format
        const depts = Array.isArray(response.data) 
          ? response.data.map((spec, index) => ({
              id: `dept_${index}`,
              name: typeof spec === 'string' ? spec : spec.name || spec.specialization,
            }))
          : [];
        // Add "All" option at the beginning
        setDepartments([
          { id: 'all', name: 'All' },
          ...depts
        ]);
      }
    } catch (err) {
      console.log('Departments fetch error:', err.message);
      // Fallback departments
      setDepartments([
        { id: 'all', name: 'All' },
        { id: 'general', name: 'General Medicine' },
        { id: 'cardiology', name: 'Cardiology' },
        { id: 'dermatology', name: 'Dermatology' },
        { id: 'orthopedics', name: 'Orthopedics' },
        { id: 'pediatrics', name: 'Pediatrics' },
      ]);
    }
  };

  // Fetch doctors from API
  const fetchDoctors = async (departmentFilter = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (departmentFilter && departmentFilter !== 'all') {
        params.specialization = departmentFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const response = await apiClient.get('/doctors', { params });
      
      if (response.data) {
        const doctorList = Array.isArray(response.data) 
          ? response.data 
          : response.data.doctors || [];
        setDoctors(doctorList);
      }
    } catch (err) {
      console.error('Doctors fetch error:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle department selection
  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept.id === selectedDepartment ? null : dept.id);
    fetchDoctors(dept.id === selectedDepartment ? null : dept.name);
  };

  // Handle search
  const handleSearch = useCallback(() => {
    fetchDoctors(selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : null);
  }, [searchQuery, selectedDepartment, departments]);

  // Handle doctor selection
  const handleDoctorSelect = (doctor) => {
    navigation.navigate('SlotSelection', { doctor });
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchDepartments(), fetchDoctors()]).finally(() => setRefreshing(false));
  }, []);

  // Filter doctors based on search
  const filteredDoctors = doctors.filter(doc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(query) ||
      doc.specialization?.toLowerCase().includes(query) ||
      doc.specialty?.toLowerCase().includes(query)
    );
  });

  // Render doctor card
  const renderDoctorCard = (doctor) => (
    <TouchableOpacity
      key={doctor._id || doctor.id}
      style={styles.doctorCard}
      onPress={() => handleDoctorSelect(doctor)}
      activeOpacity={0.7}
    >
      <Card variant="default" style={styles.doctorCardInner}>
        <View style={styles.doctorRow}>
          <Avatar 
            name={doctor.name || 'Doctor'} 
            size="large" 
            source={doctor.profilePhoto || doctor.photo}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.specialty}>
              {doctor.specialization || doctor.specialty || 'General Physician'}
            </Text>
            <View style={styles.doctorMeta}>
              {doctor.experience && (
                <Text style={styles.metaText}>
                  {doctor.experience} yrs exp
                </Text>
              )}
              {doctor.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {doctor.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.feeBox}>
            <Text style={styles.feeLabel}>Fee</Text>
            <Text style={styles.feeValue}>
              ₹{doctor.consultationFee || doctor.fee || 500}
            </Text>
          </View>
        </View>
        
        {/* Availability indicator */}
        <View style={styles.availabilityRow}>
          <View style={[styles.availabilityDot, { backgroundColor: colors.success }]} />
          <Text style={styles.availabilityText}>Available for booking</Text>
          <Text style={styles.bookNowText}>Book Now →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // If pre-selected doctor, show loading while redirecting
  if (preSelectedDoctor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors by name or specialty..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchDoctors(); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Department Filter */}
      <View style={styles.departmentSection}>
        <Text style={styles.sectionTitle}>Select Department</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.departmentList}
        >
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              style={[
                styles.departmentChip,
                selectedDepartment === dept.id && styles.departmentChipActive,
              ]}
              onPress={() => handleDepartmentSelect(dept)}
            >
              {selectedDepartment === dept.id ? (
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.departmentChipGradient}
                >
                  <Text style={styles.departmentTextActive}>{dept.name}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.departmentText}>{dept.name}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Doctors List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDoctors()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍⚕️</Text>
            <Text style={styles.emptyTitle}>No Doctors Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'No doctors available in this department'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} available
            </Text>
            {filteredDoctors.map(renderDoctorCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  
  // Department Filter
  departmentSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  departmentList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  departmentChip: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  departmentChipActive: {
    borderWidth: 0,
  },
  departmentChipGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  departmentText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  departmentTextActive: {
    ...typography.labelMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
  
  // Content
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  resultsCount: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  
  // Doctor Card
  doctorCard: {
    marginBottom: spacing.md,
  },
  doctorCardInner: {
    padding: spacing.lg,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  doctorName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  specialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  metaText: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  ratingBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ratingText: {
    ...typography.labelSmall,
    color: colors.warning,
  },
  feeBox: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  feeValue: {
    ...typography.headlineSmall,
    color: colors.primary,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  availabilityText: {
    ...typography.labelSmall,
    color: colors.success,
    flex: 1,
  },
  bookNowText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // States
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    ...typography.labelMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default BookingScreen;
