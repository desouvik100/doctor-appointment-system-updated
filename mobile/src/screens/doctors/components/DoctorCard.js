/**
 * DoctorCard - Premium card with verified badge, availability tag, favorite option, and visual hierarchy
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import shadows from '../../../theme/shadows';
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
  const { colors, isDarkMode } = useTheme();

  if (!doctor) return null;

  const {
    name, specialty, specialization, hospital, clinic,
    rating, reviews, reviewCount, experience,
    fee, consultationFee, available, isAvailable,
    nextSlot, nextAvailable, photo, profilePhoto,
    verified = true,
  } = doctor;

  const displayName = name || 'Doctor';
  const displaySpecialty = specialization || specialty || 'General Physician';
  const displayHospital = hospital || clinic || 'HealthSync Medical Center';
  const displayRating = rating || 4.8;
  const displayReviews = reviewCount || reviews || 24;
  const displayExp = experience || '8';
  const displayFee = consultationFee || fee || 500;
  const isAvailableNow = isAvailable !== false && available !== false;
  const displayPhoto = profilePhoto || photo;
  const displayNextSlot = nextAvailable || nextSlot || 'Available Today';

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          {
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDarkMode ? 0.25 : 0.04,
            shadowRadius: 8,
            elevation: isDarkMode ? 2 : 1,
          }
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Avatar name={displayName} size="medium" imageUrl={displayPhoto} customBorderRadius={8} />
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: colors.textPrimary }]} numberOfLines={1}>
            Dr. {displayName}
          </Text>
          <Text style={[styles.compactSpecialty, { color: colors.primary }]} numberOfLines={1}>
            {displaySpecialty}
          </Text>
          <View style={styles.compactStats}>
            <Text style={[styles.compactRating, { color: colors.textSecondary }]}>⭐ {Number(displayRating).toFixed(1)}</Text>
            <Text style={[styles.compactFee, { color: colors.primary, fontWeight: '700' }]}>₹{displayFee}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.compactFavorite} onPress={onFavoritePress} activeOpacity={0.7}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.35 : 0.06,
          shadowRadius: 16,
          elevation: isDarkMode ? 4 : 2,
        }
      ]}
    >
      <View style={styles.cardHeader}>
        {/* Availability tag */}
        <View style={[
          styles.availabilityTag,
          { backgroundColor: isAvailableNow ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }
        ]}>
          <View style={[
            styles.availabilityDot,
            { backgroundColor: isAvailableNow ? colors.success : colors.warning }
          ]} />
          <Text style={[
            styles.availabilityText,
            { color: isAvailableNow ? colors.success : colors.warning }
          ]}>
            {isAvailableNow ? 'Available' : 'Next Available'}
          </Text>
        </View>

        {/* Favorite */}
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress} activeOpacity={0.7}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {/* Doctor photo & verified check */}
        <View style={styles.avatarContainer}>
          <Avatar imageUrl={displayPhoto} name={displayName} size="large" showBorder={false} customBorderRadius={8} />
          {verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={1}>
            Dr. {displayName}
          </Text>
          <Text style={[styles.specialtyText, { color: colors.primary }]} numberOfLines={1}>
            {displaySpecialty}
          </Text>

          <View style={styles.ratingAndExpRow}>
            {/* Rating pill */}
            <View style={[styles.ratingPill, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#FFFBEB' }]}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={[styles.ratingValue, { color: colors.warning }]}>
                {Number(displayRating).toFixed(1)}
              </Text>
              <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
                ({displayReviews})
              </Text>
            </View>

            {/* Experience text */}
            <Text style={[styles.experienceText, { color: colors.textSecondary }]}>
              🎓 {displayExp} yrs exp
            </Text>
          </View>

          <Text style={[styles.hospitalText, { color: colors.textMuted }]} numberOfLines={1}>
            🏥 {displayHospital}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.divider || '#F1F5F9' }]}>
        <View style={styles.feeWrapper}>
          <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
          <Text style={[styles.feeText, { color: colors.textPrimary }]}>₹{displayFee}</Text>
        </View>

        <View style={styles.ctaWrapper}>
          <Text style={[styles.slotText, { color: isAvailableNow ? colors.success : colors.textSecondary }]} numberOfLines={1}>
            🕒 {displayNextSlot}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onBookPress ? onBookPress(doctor) : (onPress && onPress(doctor));
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtn}
            >
              <Text style={[styles.bookBtnText, { color: colors.textInverse || '#FFFFFF' }]}>
                Book Appointment
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  availabilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availabilityText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  favoriteIcon: { fontSize: 20 },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md + 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  verifiedCheck: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  nameText: {
    ...typography.headlineSmall,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 3,
  },
  specialtyText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  ratingAndExpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  ratingStar: { fontSize: 9, marginRight: 2 },
  ratingValue: { ...typography.labelSmall, fontWeight: '800', fontSize: 10 },
  reviewsCount: { ...typography.labelSmall, fontSize: 9, marginLeft: 2 },
  experienceText: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 12,
  },
  hospitalText: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  feeWrapper: {
    justifyContent: 'center',
  },
  feeLabel: {
    ...typography.labelSmall,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  feeText: {
    ...typography.headlineMedium,
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 26,
  },
  ctaWrapper: {
    alignItems: 'flex-end',
    gap: 4,
  },
  slotText: {
    ...typography.labelSmall,
    fontSize: 11,
    fontWeight: '700',
  },
  bookBtn: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    ...typography.buttonSmall,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  // Compact Mode styling
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compactInfo: { flex: 1, marginLeft: spacing.md },
  compactName: { ...typography.bodyMedium, fontWeight: '700' },
  compactSpecialty: { ...typography.bodySmall, marginTop: 1, fontWeight: '600' },
  compactStats: { flexDirection: 'row', marginTop: spacing.xs, gap: spacing.md },
  compactRating: { ...typography.labelSmall, fontSize: 11 },
  compactFee: { ...typography.labelSmall },
  compactFavorite: { padding: spacing.xs },
});

export default React.memo(DoctorCard);
