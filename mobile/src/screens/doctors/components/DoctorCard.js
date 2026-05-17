/**
 * DoctorCard - Premium card with verified badge, availability tag, visual hierarchy
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../../../theme/colors';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';
import Avatar from '../../../components/common/Avatar';

const DoctorCard = ({
  doctor,
  isFavorite = false,
  onPress,
  onFavoritePress,
  onBookPress,
  compact = false,
}) => {
  const { colors } = useTheme();
  const {
    name, specialty, specialization, hospital, clinic,
    rating, reviews, reviewCount, experience,
    fee, consultationFee, available, isAvailable,
    nextSlot, nextAvailable, photo, profilePhoto,
    verified = true,
  } = doctor;

  const displayName = name || 'Doctor';
  const displaySpecialty = specialization || specialty || 'General Physician';
  const displayHospital = hospital || clinic || 'HealthSync Clinic';
  const displayRating = rating || 4.5;
  const displayReviews = reviewCount || reviews || 0;
  const displayExp = experience || '5';
  const displayFee = consultationFee || fee || 500;
  const isAvailableNow = isAvailable !== false && available !== false;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Avatar name={displayName} size="medium" imageUrl={profilePhoto || photo} />
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.compactSpecialty, { color: colors.primary }]}>{displaySpecialty}</Text>
          <View style={styles.compactStats}>
            <Text style={[styles.compactRating, { color: colors.textSecondary }]}>⭐ {displayRating}</Text>
            <Text style={[styles.compactFee, { color: colors.primary }]}>₹{displayFee}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.compactFavorite} onPress={onFavoritePress}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, ...shadows.small }]}>
      {/* Availability tag — top left */}
      <View style={[
        styles.availabilityTag,
        { backgroundColor: isAvailableNow ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' },
      ]}>
        <View style={[
          styles.availabilityDot,
          { backgroundColor: isAvailableNow ? colors.success : colors.error },
        ]} />
        <Text style={[
          styles.availabilityTagText,
          { color: isAvailableNow ? colors.success : colors.error },
        ]}>
          {isAvailableNow ? 'Available' : 'Busy'}
        </Text>
      </View>

      {/* Favorite */}
      <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
        <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cardContent} onPress={onPress} activeOpacity={0.9}>
        {/* Doctor info row */}
        <View style={styles.topSection}>
          <Avatar name={displayName} size="xlarge" imageUrl={profilePhoto || photo} showBorder />
          <View style={styles.doctorInfo}>
            {/* Name + verified */}
            <View style={styles.nameRow}>
              <Text style={[styles.doctorName, { color: colors.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              {verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>

            <Text style={[styles.specialty, { color: colors.primary }]}>{displaySpecialty}</Text>
            <Text style={[styles.hospital, { color: colors.textMuted }]} numberOfLines={1}>
              🏥 {displayHospital}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <Text style={styles.statPillText}>⭐</Text>
                <Text style={[styles.statPillValue, { color: colors.warning }]}>
                  {Number(displayRating).toFixed(1)}
                </Text>
                <Text style={[styles.statPillSub, { color: colors.textMuted }]}>
                  ({displayReviews})
                </Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: colors.surfaceLight }]}>
                <Text style={styles.statPillText}>🎓</Text>
                <Text style={[styles.statPillValue, { color: colors.textPrimary }]}>
                  {displayExp} yrs
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fee + next slot */}
        <View style={[styles.bottomSection, { borderTopColor: colors.divider }]}>
          <View>
            <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
            <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{displayFee}</Text>
          </View>
          <View style={styles.slotInfo}>
            <Text style={[styles.slotLabel, { color: colors.textMuted }]}>Next slot</Text>
            <Text style={[styles.slotValue, { color: colors.primary }]}>
              {nextAvailable || nextSlot || 'Book Now'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Book CTA */}
      <TouchableOpacity style={styles.bookBtn} onPress={onBookPress} activeOpacity={0.85}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookBtnGradient}
        >
          <Text style={[styles.bookBtnText, { color: colors.textInverse }]}>
            Book Appointment →
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + 4,
  },
  availabilityTag: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    zIndex: 2,
  },
  availabilityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  availabilityTagText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 11,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    padding: spacing.xs,
  },
  favoriteIcon: { fontSize: 20 },
  topSection: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingRight: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: spacing.xs,
  },
  doctorName: {
    ...typography.headlineSmall,
    fontWeight: '700',
    flex: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  specialty: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 3,
  },
  hospital: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  statPillText: { fontSize: 11 },
  statPillValue: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  statPillSub: {
    ...typography.labelSmall,
    fontSize: 10,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  feeLabel: { ...typography.labelSmall, marginBottom: 2 },
  feeValue: { ...typography.headlineMedium, fontWeight: '700' },
  slotInfo: { alignItems: 'flex-end' },
  slotLabel: { ...typography.labelSmall, marginBottom: 2 },
  slotValue: { ...typography.labelMedium, fontWeight: '600' },
  bookBtn: { overflow: 'hidden' },
  bookBtnGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    ...typography.button,
    fontWeight: '700',
    fontSize: 15,
  },
  // Compact
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  compactInfo: { flex: 1, marginLeft: spacing.md },
  compactName: { ...typography.bodyMedium, fontWeight: '600' },
  compactSpecialty: { ...typography.bodySmall, marginTop: 2 },
  compactStats: { flexDirection: 'row', marginTop: spacing.xs, gap: spacing.md },
  compactRating: { ...typography.labelSmall },
  compactFee: { ...typography.labelSmall, fontWeight: '600' },
  compactFavorite: { padding: spacing.xs },
});

export default DoctorCard;
