/**
 * Doctors Screen - Find & Book Doctors (Connected to Production API)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import doctorService from '../../services/api/doctorService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const DoctorsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const specialties = [
    { id: 'all', label: 'All', icon: '🏥', value: null },
    { id: 'cardio', label: 'Cardiology', icon: '❤️', value: 'Cardiology' },
    { id: 'derma', label: 'Dermatology', icon: '🧴', value: 'Dermatology' },
    { id: 'neuro', label: 'Neurology', icon: '🧠', value: 'Neurology' },
    { id: 'ortho', label: 'Orthopedics', icon: '🦴', value: 'Orthopedics' },
    { id: 'pedia', label: 'Pediatrics', icon: '👶', value: 'Pediatrics' },
    { id: 'general', label: 'General', icon: '👨‍⚕️', value: 'General Physician' },
  ];

  const fetchDoctors = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      if (selectedSpecialty) {
        const specialty = specialties.find(s => s.id === selectedSpecialty);
        if (specialty?.value) {
          params.specialization = specialty.value;
        }
      }

      const response = await doctorService.searchDoctors(params);
      setDoctors(response.doctors || response.data || response || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedSpecialty]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = () => {
    setLoading(true);
    fetchDoctors();
  };

  const renderDoctorCard = ({ item }) => (
    <Card variant="gradient" style={styles.doctorCard}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('DoctorProfile', { doctorId: item._id })}
      >
        <View style={styles.cardTop}>
          <Avatar 
            name={item.name} 
            size="xlarge" 
            showBorder 
            source={item.photo ? { uri: item.photo } : null}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.specialty}>{item.specialization || item.specialty}</Text>
            <Text style={styles.hospital}>{item.hospital || item.clinic || 'HealthSync Clinic'}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{item.rating || '4.5'}</Text>
                <Text style={styles.statLabel}>({item.reviewCount || item.reviews || 0})</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🎓</Text>
                <Text style={styles.statValue}>{item.experience || '5'} yrs</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.feeSection}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeValue}>₹{item.fee || item.consultationFee || 500}</Text>
          </View>
          
          <View style={styles.slotSection}>
            <View style={[
              styles.availabilityBadge,
              item.isAvailable !== false ? styles.availableNow : styles.availableLater,
            ]}>
              <View style={[
                styles.availabilityDot,
                { backgroundColor: item.isAvailable !== false ? colors.success : colors.warning },
              ]} />
              <Text style={styles.availabilityText}>
                {item.isAvailable !== false ? 'Available' : 'Busy'}
              </Text>
            </View>
            <Text style={styles.nextSlot}>{item.nextAvailable || 'Book Now'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { doctor: item })}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👨‍⚕️</Text>
      <Text style={styles.emptyTitle}>No Doctors Found</Text>
      <Text style={styles.emptyText}>
        {error || 'Try adjusting your search or filters'}
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Find Doctors</Text>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(); }}>
              <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.specialtiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
        >
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.specialtyChip,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                selectedSpecialty === specialty.id && styles.specialtyChipActive,
              ]}
              onPress={() => {
                setSelectedSpecialty(selectedSpecialty === specialty.id ? null : specialty.id);
                setLoading(true);
              }}
            >
              {selectedSpecialty === specialty.id ? (
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.specialtyChipGradient}
                >
                  <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                  <Text style={[styles.specialtyLabelActive, { color: colors.textInverse }]}>{specialty.label}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                  <Text style={[styles.specialtyLabel, { color: colors.textSecondary }]}>{specialty.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {loading ? 'Loading...' : `${doctors.length} doctors found`}
        </Text>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={[styles.sortText, { color: colors.primary }]}>Sort by: Rating</Text>
          <Text style={[styles.sortIcon, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Doctors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={({ item }) => (
            <Card variant="gradient" style={styles.doctorCard}>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: item._id })}
              >
                <View style={styles.cardTop}>
                  <Avatar 
                    name={item.name} 
                    size="xlarge" 
                    showBorder 
                    source={item.photo ? { uri: item.photo } : null}
                  />
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.specialty, { color: colors.primary }]}>{item.specialization || item.specialty}</Text>
                    <Text style={[styles.hospital, { color: colors.textSecondary }]}>{item.hospital || item.clinic || 'HealthSync Clinic'}</Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>⭐</Text>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.rating || '4.5'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>({item.reviewCount || item.reviews || 0})</Text>
                      </View>
                      <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>🎓</Text>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.experience || '5'} yrs</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardBottom, { borderTopColor: colors.divider }]}>
                  <View style={styles.feeSection}>
                    <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
                    <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{item.fee || item.consultationFee || 500}</Text>
                  </View>
                  
                  <View style={styles.slotSection}>
                    <View style={[
                      styles.availabilityBadge,
                      item.isAvailable !== false ? styles.availableNow : styles.availableLater,
                    ]}>
                      <View style={[
                        styles.availabilityDot,
                        { backgroundColor: item.isAvailable !== false ? colors.success : colors.warning },
                      ]} />
                      <Text style={[styles.availabilityText, { color: colors.textSecondary }]}>
                        {item.isAvailable !== false ? 'Available' : 'Busy'}
                      </Text>
                    </View>
                    <Text style={[styles.nextSlot, { color: colors.textPrimary }]}>{item.nextAvailable || 'Book Now'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.bookBtn}
                  onPress={() => navigation.navigate('Booking', { doctor: item })}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bookBtnGradient}
                  >
                    <Text style={[styles.bookBtnText, { color: colors.textInverse }]}>Book Appointment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            </Card>
          )}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Doctors Found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {error || 'Try adjusting your search or filters'}
              </Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={onRefresh}>
                <Text style={[styles.retryText, { color: colors.textInverse }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.displaySmall,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterIcon: {
    fontSize: 20,
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
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: spacing.md + 2,
  },
  clearIcon: {
    fontSize: 16,
    padding: spacing.xs,
  },
  specialtiesSection: {
    marginBottom: spacing.lg,
  },
  specialtiesList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  specialtyChipActive: {
    borderWidth: 0,
    padding: 0,
    overflow: 'hidden',
  },
  specialtyChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  specialtyIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  specialtyLabel: {
    ...typography.labelMedium,
  },
  specialtyLabelActive: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  resultsCount: {
    ...typography.bodyMedium,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    ...typography.labelMedium,
  },
  sortIcon: {
    fontSize: 10,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  doctorCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  doctorName: {
    ...typography.headlineSmall,
    marginBottom: 2,
  },
  specialty: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  hospital: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statValue: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.labelSmall,
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 12,
    marginHorizontal: spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  feeSection: {},
  feeLabel: {
    ...typography.labelSmall,
    marginBottom: 2,
  },
  feeValue: {
    ...typography.headlineMedium,
  },
  slotSection: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: 4,
  },
  availableNow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  availableLater: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  availabilityText: {
    ...typography.labelSmall,
  },
  nextSlot: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  bookBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  bookBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnText: {
    ...typography.button,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    ...typography.button,
  },
});

export default DoctorsScreen;
