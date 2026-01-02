/**
 * DoctorCard Component - Display doctor info with booking action
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../theme/colors';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import Card from '../../../components/common/Card';
import Avatar from '../../../components/common/Avatar';

const DoctorCard = ({ 
  doctor, 
  isFavorite = false,
  onPress, 
  onFavoritePress,
  onBookPress,
  compact = false,
}) => {
  const {
    name,
    specialty,
    hospital,
    rating,
    reviews,
    experience,
    fee,
    available,
    nextSlot,
    photo,
  } = doctor;

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Avatar name={name} size="medium" imageUrl={photo} />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{name}</Text>
          <Text style={styles.compactSpecialty}>{specialty}</Text>
          <View style={styles.compactStats}>
            <Text style={styles.compactRating}>⭐ {rating}</Text>
            <Text style={styles.compactFee}>₹{fee}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.compactFavorite}
          onPress={onFavoritePress}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <Card variant="gradient" style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={onFavoritePress}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        {/* Top Section */}
        <View style={styles.topSection}>
          <Avatar name={name} size="xlarge" imageUrl={photo} showBorder />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{name}</Text>
            <Text style={styles.specialty}>{specialty}</Text>
            <Text style={styles.hospital} numberOfLines={1}>{hospital}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>({reviews})</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🎓</Text>
                <Text style={styles.statValue}>{experience} yrs</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.feeSection}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeValue}>₹{fee}</Text>
          </View>
          
          <View style={styles.slotSection}>
            <View style={[
              styles.availabilityBadge,
              available ? styles.availableNow : styles.availableLater,
            ]}>
              <View style={[
                styles.availabilityDot,
                { backgroundColor: available ? colors.success : colors.warning },
              ]} />
              <Text style={styles.availabilityText}>
                {available ? 'Available' : 'Next Available'}
              </Text>
            </View>
            <Text style={styles.nextSlot}>{nextSlot}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Book Button */}
      <TouchableOpacity 
        style={styles.bookBtn}
        onPress={onBookPress}
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
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
    padding: spacing.xs,
  },
  favoriteIcon: {
    fontSize: 22,
  },
  topSection: {
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
    paddingRight: spacing.xl,
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
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  bookBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  compactName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  compactSpecialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  compactStats: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  compactRating: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  compactFee: {
    ...typography.labelSmall,
    color: colors.primary,
    fontWeight: '600',
  },
  compactFavorite: {
    padding: spacing.xs,
  },
});

export default DoctorCard;
