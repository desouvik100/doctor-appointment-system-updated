/**
 * Doctors Screen - Find & Book Doctors
 */

import React, { useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');

const DoctorsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const specialties = [
    { id: 'all', label: 'All', icon: '🏥' },
    { id: 'cardio', label: 'Cardiology', icon: '❤️' },
    { id: 'derma', label: 'Dermatology', icon: '🧴' },
    { id: 'neuro', label: 'Neurology', icon: '🧠' },
    { id: 'ortho', label: 'Orthopedics', icon: '🦴' },
    { id: 'pedia', label: 'Pediatrics', icon: '👶' },
    { id: 'psych', label: 'Psychiatry', icon: '🧘' },
  ];

  const doctors = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'Cardiologist',
      hospital: 'City Heart Center',
      rating: 4.9,
      reviews: 234,
      experience: '12 years',
      fee: '$150',
      available: true,
      nextSlot: 'Today, 3:00 PM',
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'General Physician',
      hospital: 'HealthFirst Clinic',
      rating: 4.8,
      reviews: 189,
      experience: '8 years',
      fee: '$80',
      available: true,
      nextSlot: 'Tomorrow, 10:00 AM',
    },
    {
      id: '3',
      name: 'Dr. Emily Parker',
      specialty: 'Dermatologist',
      hospital: 'Skin Care Institute',
      rating: 4.7,
      reviews: 156,
      experience: '10 years',
      fee: '$120',
      available: false,
      nextSlot: 'Dec 30, 2:00 PM',
    },
    {
      id: '4',
      name: 'Dr. James Rodriguez',
      specialty: 'Neurologist',
      hospital: 'Brain & Spine Center',
      rating: 4.9,
      reviews: 312,
      experience: '15 years',
      fee: '$200',
      available: true,
      nextSlot: 'Today, 5:30 PM',
    },
  ];

  const renderDoctorCard = ({ item }) => (
    <Card variant="gradient" style={styles.doctorCard} onPress={() => {}}>
      <View style={styles.cardTop}>
        <Avatar name={item.name} size="xlarge" showBorder />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <Text style={styles.hospital}>{item.hospital}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{item.rating}</Text>
              <Text style={styles.statLabel}>({item.reviews})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🎓</Text>
              <Text style={styles.statValue}>{item.experience}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.feeSection}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeValue}>{item.fee}</Text>
        </View>
        
        <View style={styles.slotSection}>
          <View style={[
            styles.availabilityBadge,
            item.available ? styles.availableNow : styles.availableLater,
          ]}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: item.available ? colors.success : colors.warning },
            ]} />
            <Text style={styles.availabilityText}>
              {item.available ? 'Available' : 'Next Available'}
            </Text>
          </View>
          <Text style={styles.nextSlot}>{item.nextSlot}</Text>
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
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
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
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
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
                selectedSpecialty === specialty.id && styles.specialtyChipActive,
              ]}
              onPress={() => setSelectedSpecialty(
                selectedSpecialty === specialty.id ? null : specialty.id
              )}
            >
              {selectedSpecialty === specialty.id ? (
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.specialtyChipGradient}
                >
                  <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                  <Text style={styles.specialtyLabelActive}>{specialty.label}</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                  <Text style={styles.specialtyLabel}>{specialty.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{doctors.length} doctors found</Text>
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={styles.sortText}>Sort by: Rating</Text>
          <Text style={styles.sortIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Doctors List */}
      <FlatList
        data={doctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    paddingVertical: spacing.md + 2,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    color: colors.textSecondary,
  },
  specialtyLabelActive: {
    ...typography.labelMedium,
    color: colors.textInverse,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.primary,
    marginBottom: 2,
  },
  hospital: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginLeft: 2,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  feeSection: {},
  feeLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: 2,
  },
  feeValue: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
  },
  nextSlot: {
    ...typography.bodySmall,
    color: colors.textPrimary,
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
    color: colors.textInverse,
  },
});

export default DoctorsScreen;
