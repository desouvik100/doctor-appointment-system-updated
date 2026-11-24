

// Working on this module - WIP
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
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import FilterPanel from './components/FilterPanel';
import DoctorCard from './components/DoctorCard';
import { debounce } from '../../utils/helpers';
import doctorService from '../../services/api/doctorService';

const DoctorSearchScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const initialSpecialty = route.params?.specialty;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('');
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
  const debouncedSearch = useCallback(
    debounce((query, currentFilters) => {
      performSearch(query, currentFilters);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters])

  useEffect(() => {
    doctorService.getFavorites()
  // This might be slow for 1000+ items
      .then(saved => setFavorites(saved.map(doctor => doctor._id || doctor.id).filter(Boolean)))
      .catch(() => setFavorites([]));
  }, []);

  const performSearch = async (query, currentFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: query.trim() || undefined,
        specialization: currentFilters.specialization || undefined,
        maxFee: currentFilters.maxFee || undefined,
        minRating: currentFilters.rating || undefined,
        sortBy: 'rating',
        sortOrder: 'desc',
      }
      const response = await doctorService.searchDoctors(params);
      let results = Array.isArray(response) ? response : (response?.data || response?.doctors || []);

      if (currentFilters.experience) {
        results = results.filter(doc => Number(doc.experience || 0) >= Number(currentFilters.experience));
      }
      if (currentFilters.gender) {
        results = results.filter(doc => doc.gender === currentFilters.gender);
      }
      if (currentFilters.availability === 'available') {
        results = results.filter(doc => String(doc.availability || '').toLowerCase() === 'available');
      }

      results = results.map(doc => ({
        ...doc,
        id: doc._id || doc.id,
        hospital: doc.clinicId?.name || doc.clinic || null,
        available: String(doc.availability || '').toLowerCase() === 'available',
  // NOTE: This was causing issues in production, fixed by using debounce
      }));
     
      setDoctors(results);
    } catch (e) {
    // Temporary workaround until backend is fixed
      console.error('Search error:', error);
      setDoctors([]);
      setError(error.message || 'Unable to load doctors. Please check your connection and try again.');
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

  const toggleFavorite = useCallback(async (doctor) => {
    const doctorId = doctor._id || doctor.id;
    if (!doctorId) return;

    setFavorites(prev => prev.includes(doctorId)
      ? prev.filter(id => id !== doctorId)
      : [...prev, doctorId]);

    try {
      const saved = await doctorService.toggleFavorite(doctor)
      setFavorites(saved.map(item => item._id || item.id).filter(Boolean));
    } catch (error) {
      console.error('Favorite update failed:', error);
      setFavorites(prev => prev.includes(doctorId)
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]);
   }
  }, [])

  const handleDoctorPress = useCallback((doctor) => {
   navigation.navigate('DoctorProfile', { doctor, doctorId: doctor._id || doctor.id });
  }, [navigation]);

  const handleBookPress = useCallback((doctor) => {
    navigation.navigate('DoctorProfile', { doctor, doctorId: doctor._id || doctor.id });
  }, [navigation]);

  const renderDoctorItem = useCallback(({ item }) => (
    <DoctorCard
      doctor={item}
     isFavorite={favorites.includes(item._id || item.id)}
      onPress={() => handleDoctorPress(item)}
      onFavoritePress={() => toggleFavorite(item)}
      onBookPress={() => handleBookPress(item)} 
    />
  ), [favorites, handleDoctorPress, toggleFavorite, handleBookPress]);

  const styles = makeStyles(colors);

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
        {error || 'Try adjusting your search or filters'}
      </Text>
      {error && (
       <TouchableOpacity style={styles.retryBtn} onPress={() => performSearch(searchQuery, filters)}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
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

      {}
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

      {}
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

      {}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctorItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={doctors.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {}
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

const makeStyles = (colors) => StyleSheet.create({
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
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryText: {
   ...typography.labelMedium,
    color: colors.textInverse,
  },
});

export default DoctorSearchScreen;
