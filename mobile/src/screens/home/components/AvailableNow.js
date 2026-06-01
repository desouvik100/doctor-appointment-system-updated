/**
 * AvailableNow - Flagship Doctor Discovery Section with animated trust signals
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';
import Avatar from '../../../components/common/Avatar';
import { searchDoctors } from '../../../services/api/doctorService';

const FALLBACK_AVAILABLE = [
  {
    _id: 'avail_1',
    name: 'Dr. Sarah Wilson',
    specialty: 'Cardiologist',
    rating: 4.9,
    experience: 12,
    distance: '1.2 km',
    nextSlot: 'Today, 3:00 PM',
    fee: 150,
    photo: null,
  },
  {
    _id: 'avail_2',
    name: 'Dr. Michael Chen',
    specialty: 'General Physician',
    rating: 4.8,
    experience: 8,
    distance: '2.4 km',
    nextSlot: 'Today, 4:15 PM',
    fee: 80,
    photo: null,
  },
  {
    _id: 'avail_3',
    name: 'Dr. Emily Parker',
    specialty: 'Dermatologist',
    rating: 4.7,
    experience: 10,
    distance: '3.1 km',
    nextSlot: 'Today, 5:00 PM',
    fee: 120,
    photo: null,
  },
];

// Pulsing indicator for active online status
const OnlineIndicator = () => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1200 }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.indicatorContainer}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: colors.success }, pulseStyle]} />
      <View style={[styles.innerDot, { backgroundColor: colors.success }]} />
    </View>
  );
};

const AvailableDoctorCard = ({ doc, index }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 90)}
      style={[animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          // Guard: do not navigate to profile for fallback placeholder doctors
          // (IDs like 'avail_1' are not real MongoDB ObjectIds)
          const id = doc._id || doc.id || '';
          const isFakePlaceholder = !id || id.startsWith('avail_') || id.length < 20;
          if (isFakePlaceholder) {
            navigation.navigate('DoctorSearch');
            return;
          }
          navigation.navigate('DoctorProfile', { doctor: doc, doctorId: id });
        }}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            ...shadows.sm,
          },
        ]}
      >
        {/* Upper metadata: Image, online badge and experience */}
        <View style={styles.topInfoRow}>
          <View style={styles.avatarWrapper}>
            <Avatar name={doc.name} size="large" imageUrl={doc.photo || doc.profilePhoto} />
            <OnlineIndicator />
          </View>
          <View style={styles.badgeColumn}>
            <View style={[styles.onlineBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.onlineBadgeText, { color: colors.success }]}>Online Now</Text>
            </View>
            <Text style={[styles.expLabel, { color: colors.textMuted }]}>{doc.experience || doc.yearsOfExperience || 8} yrs exp</Text>
          </View>
        </View>

        {/* Doctor Details */}
        <View style={styles.doctorDetails}>
          <Text style={[styles.docName, { color: colors.textPrimary }]} numberOfLines={1}>
            {doc.name}
          </Text>
          <Text style={[styles.docSpec, { color: colors.textMuted }]} numberOfLines={1}>
            {doc.specialty || doc.specialization || 'General Practitioner'}
          </Text>
        </View>

        {/* Location & Rating */}
        <View style={styles.distanceRatingRow}>
          <Text style={[styles.locationText, { color: colors.textMuted }]}>🕒 {doc.nextSlot || 'Available Today'}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.star}>⭐</Text>
            <Text style={[styles.ratingVal, { color: colors.textPrimary }]}>{doc.rating || '4.8'}</Text>
          </View>
        </View>

        {/* Footer: Price tag & slot selection CTA */}
        <View style={styles.footer}>
          <Text style={[styles.feeVal, { color: colors.primary }]}>
            ₹{doc.fee || doc.consultationFee || 500} <Text style={[styles.feeSub, { color: colors.textMuted }]}>/ consult</Text>
          </Text>
          <View style={[styles.bookPill, { backgroundColor: colors.primary }]}>
            <Text style={styles.bookText}>Book Now</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AvailableNow = () => {
  const { colors } = useTheme();
  const [availableDocs, setAvailableDocs] = useState([]);

  useEffect(() => {
    searchDoctors({ availability: 'today' })
      .then(res => {
        const list = res?.doctors || res?.data || res || [];
        if (list.length > 0) {
          setAvailableDocs(list.slice(0, 5).map((doc, idx) => ({
            ...doc,
            distance: doc.distance ? `${doc.distance.toFixed(1)} km` : `${(1 + idx * 0.7).toFixed(1)} km`,
            experience: doc.experience || doc.yearsOfExperience || 10,
            fee: doc.consultationFee || doc.fee || 500,
            nextSlot: doc.nextSlot || 'Today, 3:00 PM',
          })));
        } else {
          setAvailableDocs(FALLBACK_AVAILABLE);
        }
      })
      .catch(() => {
        setAvailableDocs(FALLBACK_AVAILABLE);
      });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Now</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Consult immediately with active specialists</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {availableDocs.map((doc, index) => (
          <AvailableDoctorCard key={doc._id} doc={doc} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...typography.labelSmall,
    fontSize: 11,
    marginTop: 2,
  },
  horizontalScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  card: {
    width: 175,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    height: 190,
    justifyContent: 'space-between',
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  onlineBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  onlineBadgeText: {
    fontSize: 7.5,
    fontWeight: '850',
    textTransform: 'uppercase',
  },
  expLabel: {
    fontSize: 8.5,
    fontWeight: '600',
  },
  doctorDetails: {
    marginTop: spacing.xs,
  },
  docName: {
    ...typography.bodyMedium,
    fontWeight: '800',
    fontSize: 13.5,
  },
  docSpec: {
    ...typography.labelSmall,
    fontSize: 10,
    marginTop: 1,
  },
  distanceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationText: {
    fontSize: 9,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 9,
  },
  ratingVal: {
    fontSize: 9,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: spacing.sm,
  },
  feeVal: {
    fontSize: 12.5,
    fontWeight: '850',
  },
  feeSub: {
    fontSize: 8,
    fontWeight: '400',
  },
  bookPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  bookText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default React.memo(AvailableNow);
