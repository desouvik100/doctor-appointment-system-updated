/**
 * Video Consult Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';

const VideoConsultScreen = ({ navigation }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const specialties = [
    { id: 'general', label: 'General', icon: '🩺', available: 12 },
    { id: 'cardio', label: 'Cardiology', icon: '❤️', available: 5 },
    { id: 'derma', label: 'Dermatology', icon: '🧴', available: 8 },
    { id: 'mental', label: 'Mental Health', icon: '🧠', available: 6 },
    { id: 'pedia', label: 'Pediatrics', icon: '👶', available: 4 },
    { id: 'gyno', label: 'Gynecology', icon: '👩', available: 7 },
  ];

  const availableDoctors = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      specialty: 'General Physician',
      rating: 4.9,
      reviews: 234,
      fee: '₹500',
      waitTime: '~5 min',
      available: true,
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Cardiologist',
      rating: 4.8,
      reviews: 189,
      fee: '₹800',
      waitTime: '~10 min',
      available: true,
    },
    {
      id: '3',
      name: 'Dr. Emily Parker',
      specialty: 'Dermatologist',
      rating: 4.7,
      reviews: 156,
      fee: '₹600',
      waitTime: '~15 min',
      available: true,
    },
  ];

  const renderDoctorCard = ({ item }) => (
    <Card variant="gradient" style={styles.doctorCard}>
      <View style={styles.cardHeader}>
        <Avatar name={item.name} size="large" showBorder />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews} reviews)</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Fee</Text>
          <Text style={styles.infoValue}>{item.fee}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Wait Time</Text>
          <Text style={styles.infoValue}>{item.waitTime}</Text>
        </View>
        <TouchableOpacity 
          style={styles.consultBtn}
          onPress={() => navigation.navigate('Booking', { doctor: item, type: 'video' })}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.consultBtnGradient}
          >
            <Text style={styles.consultBtnIcon}>📹</Text>
            <Text style={styles.consultBtnText}>Consult Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Consultation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Banner */}
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Consult from Home</Text>
          <Text style={styles.bannerSubtitle}>Connect with doctors instantly via video call</Text>
          <View style={styles.bannerFeatures}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Instant Connect</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>E-Prescription</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Follow-up Free</Text>
            </View>
          </View>
        </View>
        <Text style={styles.bannerEmoji}>📹</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Specialty</Text>
          <View style={styles.specialtiesGrid}>
            {specialties.map((spec) => (
              <TouchableOpacity
                key={spec.id}
                style={[
                  styles.specialtyCard,
                  selectedSpecialty === spec.id && styles.specialtyCardActive,
                ]}
                onPress={() => setSelectedSpecialty(spec.id)}
              >
                <Text style={styles.specialtyIcon}>{spec.icon}</Text>
                <Text style={styles.specialtyLabel}>{spec.label}</Text>
                <Text style={styles.specialtyAvailable}>{spec.available} online</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Doctors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Now</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableDoctors}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
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
  banner: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.headlineMedium,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: spacing.md,
  },
  bannerFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    color: colors.textInverse,
    marginRight: spacing.xs,
    fontWeight: 'bold',
  },
  featureText: {
    ...typography.labelSmall,
    color: colors.textInverse,
  },
  bannerEmoji: {
    fontSize: 48,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  seeAll: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  specialtyCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  specialtyCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  specialtyIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  specialtyLabel: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  specialtyAvailable: {
    ...typography.labelSmall,
    color: colors.success,
  },
  doctorCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  doctorName: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  rating: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  reviews: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  consultBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  consultBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  consultBtnIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  consultBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
});

export default VideoConsultScreen;
