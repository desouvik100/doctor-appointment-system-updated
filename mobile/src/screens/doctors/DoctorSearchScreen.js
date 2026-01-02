/**
 * DoctorSearchScreen - Advanced doctor search with filters
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import FilterPanel from './components/FilterPanel';
import DoctorCard from './components/DoctorCard';
import { debounce } from '../../utils/helpers';

const DoctorSearchScreen = ({ navigation, route }) => {
  const initialSpecialty = route.params?.specialty;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    specialization: initialSpecialty || null,
    gender: null,
    experience: null,
    maxFee: null,
    availability: null,
    rating: null,
  });

  // Mock data - replace with API call
  const mockDoctors = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'Cardiologist',
      hospital: 'City Heart Center',
      rating: 4.9,
      reviews: 234,
      experience: 12,
      fee: 150,
      gender: 'female',
      available: true,
      nextSlot: 'Today, 3:00 PM',
      photo: null,
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'General Physician',
      hospital: 'HealthFirst Clinic',
      rating: 4.8,
      reviews: 189,
      experience: 8,
      fee: 80,
      gender: 'male',
      available: true,
      nextSlot: 'Tomorrow, 10:00 AM',
      photo: null,
    },
    {
      id: '3',
      name: 'Dr. Emily Parker',
      specialty: 'Dermatologist',
      hospital: 'Skin Care Institute',
      rating: 4.7,
      reviews: 156,
      experience: 10,
      fee: 120,
      gender: 'female',
      available: false,
      nextSlot: 'Dec 30, 2:00 PM',
      photo: null,
    },
    {
      id: '4',
      name: 'Dr. James Rodriguez',
      specialty: 'Neurologist',
      hospital: 'Brain & Spine Center',
      rating: 4.9,
      reviews: 312,
      experience: 15,
      fee: 200,
      gender: 'male',
      available: true,
      nextSlot: 'Today, 5:30 PM',
      photo: null,
    },
  ];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query, currentFilters) => {
      performSearch(query, currentFilters);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters]);

  const performSearch = async (query, currentFilters) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const results = await doctorService.search({ query, ...currentFilters });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data
      let results = [...mockDoctors];
      
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(doc => 
          doc.name.toLowerCase().includes(lowerQuery) ||
          doc.specialty.toLowerCase().includes(lowerQuery) ||
          doc.hospital.toLowerCase().includes(lowerQuery)
        );
      }
      
      if (currentFilters.specialization) {
        results = results.filter(doc => 
          doc.specialty.toLowerCase() === currentFilters.specialization.toLowerCase()
        );
      }
      
      if (currentFilters.gender) {
        results = results.filter(doc => doc.gender === currentFilters.gender);
      }
      
      if (currentFilters.experience) {
        const minExp = parseInt(currentFilters.experience);
        results = results.filter(doc => doc.experience >= minExp);
      }
      
      if (currentFilters.maxFee) {
        results = results.filter(doc => doc.fee <= currentFilters.maxFee);
      }
      
      if (currentFilters.rating) {
        results = results.filter(doc => doc.rating >= currentFilters.rating);
      }
      
      if (currentFilters.availability === 'today') {
        results = results.filter(doc => doc.available);
      }
      
      setDoctors(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      specialization: null,
      gender: null,
      experience: null,
      maxFee: null,
      availability: null,
      rating: null,
    });
  };

  const toggleFavorite = (doctorId) => {
    setFavorites(prev => 
      prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
    // TODO: Persist to AsyncStorage
  };

  const handleDoctorPress = (doctor) => {
    navigation.navigate('DoctorProfile', { doctor });
  };

  const handleBookPress = (doctor) => {
    navigation.navigate('SlotSelection', { doctor });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== null).length;

  const renderHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsCount}>
        {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
      </Text>
      <TouchableOpacity style={styles.sortBtn}>
        <Text style={styles.sortText}>Sort by: Rating</Text>
        <Text style={styles.sortIcon}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No doctors found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your search or filters
      </Text>
      {activeFilterCount > 0 && (
        <TouchableOpacity 
          style={styles.clearFiltersBtn}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              isFavorite={favorites.includes(item.id)}
              onPress={() => handleDoctorPress(item)}
              onFavoritePress={() => toggleFavorite(item.id)}
              onBookPress={() => handleBookPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={doctors.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Filter Panel Modal */}
      <FilterPanel
        visible={showFilters}
        filters={filters}
        onApply={handleFilterChange}
        onClose={() => setShowFilters(false)}
        onClear={handleClearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textMuted,
    padding: spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterIcon: {
    fontSize: 20,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.labelSmall,
    color: colors.textInverse,
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultsCount: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  sortIcon: {
    fontSize: 10,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
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
  clearFiltersBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  clearFiltersText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
});

export default DoctorSearchScreen;
