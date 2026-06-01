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
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import shadows from '../../theme/shadows';
import { typography, spacing, borderRadius } from '../../theme/typography';
import DoctorCard from '../../components/cards/DoctorCard';
import Avatar from '../../components/common/Avatar';
import doctorService from '../../services/api/doctorService';
import { useTheme } from '../../context/ThemeContext';


import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const DoctorsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);
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
      // Use warn instead of error for network failures — avoids LogBox red overlay in dev mode
      const isNetworkErr = err?.statusCode === 0 || err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network');
      if (isNetworkErr) {
        console.warn('[DoctorsScreen] Network unavailable — showing offline state');
        setError('No internet connection. Please check your network and try again.');
      } else {
        console.warn('Error fetching doctors:', err?.message || err);
        setError('Failed to load doctors. Please try again.');
      }
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

  const renderDoctorItem = useCallback(({ item }) => (
    <DoctorListItem
      item={item}
      colors={colors}
      isDarkMode={isDarkMode}
      onPress={() => navigation.navigate('DoctorProfile', { doctor: item, doctorId: item._id || item.id })}
    />
  ), [navigation, colors, isDarkMode]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={isDarkMode ? ['#0A0E17', '#121826', '#1A1F2E'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orb1}>
          <LinearGradient
            colors={isDarkMode ? ['rgba(0, 212, 170, 0.12)', 'transparent'] : ['rgba(0, 212, 170, 0.06)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
        <View style={styles.orb2}>
          <LinearGradient
            colors={isDarkMode ? ['rgba(108, 92, 231, 0.1)', 'transparent'] : ['rgba(108, 92, 231, 0.04)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Find Doctors</Text>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder }]}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar (Glassmorphic) */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)', 
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 184, 148, 0.12)',
            borderWidth: 1,
          }
        ]}>
          <Text style={[styles.searchIcon, { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(71, 85, 105, 0.6)' }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(100, 116, 139, 0.5)'}
            value={searchVal}
            onChangeText={setSearchVal}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchVal.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchVal(''); setSearchQuery(''); }}>
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
          {specialties.map((specialty) => {
            const isActive = selectedSpecialty === specialty.id;
            return (
              <TouchableOpacity
                key={specialty.id}
                style={[
                  styles.specialtyChip,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)', 
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 184, 148, 0.1)',
                  },
                  isActive && styles.specialtyChipActive,
                ]}
                onPress={() => {
                  setSelectedSpecialty(isActive ? null : specialty.id);
                  setLoading(true);
                }}
              >
                {isActive ? (
                  <LinearGradient
                    colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
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
            );
          })}
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
          renderItem={renderDoctorItem}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
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

const DoctorListItem = React.memo(({ item, colors, isDarkMode, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.doctorCard, {
        backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 184, 148, 0.08)',
        borderWidth: 1,
        ...shadows.md,
      }]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatarBorder, { borderColor: colors.primary }]}>
          <Avatar
            imageUrl={item.profilePhoto}
            name={item.name}
            size="large"
          />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={[styles.doctorName, { color: colors.textPrimary }]}>
            {item.name ? `Dr. ${item.name}` : 'Doctor'}
          </Text>
          <Text style={[styles.specialty, { color: colors.primary }]}>
            {item.specialization || item.specialty || 'General Physician'}
          </Text>
          <Text style={[styles.hospital, { color: colors.textSecondary }]}>
            {item.hospitalName || item.clinicName || 'HealthSync Clinic'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.rating ? Number(item.rating).toFixed(1) : '4.5'}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>({item.reviewCount || item.reviews || 0})</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🎓</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.experience || '5'} yrs</Text>
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

      <View style={styles.bookBtn}>
        <LinearGradient
          colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookBtnGradient}
        >
          <Text style={[styles.bookBtnText, { color: colors.textInverse }]}>Book Appointment</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -50,
    left: -100,
  },
  orb2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: 250,
    right: -100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.displaySmall,
    fontWeight: '800',
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
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLarge,
    paddingVertical: spacing.md,
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
    paddingBottom: 120,
  },
  doctorCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  avatarBorder: {
    borderWidth: 2,
    borderRadius: borderRadius.full,
    padding: 2,
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
    fontWeight: '700',
    marginBottom: 2,
  },
  specialty: {
    ...typography.bodyMedium,
    fontWeight: '600',
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
    fontWeight: '800',
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
    fontWeight: '700',
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
