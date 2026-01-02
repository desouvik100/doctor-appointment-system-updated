/**
 * DoctorProfileScreen - Full doctor profile with reviews and booking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

const { width } = Dimensions.get('window');

const DoctorProfileScreen = ({ navigation, route }) => {
  const { doctor } = route.params || {};
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  // Extended doctor data (would come from API)
  const doctorDetails = {
    ...doctor,
    bio: 'Dr. Sarah Wilson is a board-certified cardiologist with over 12 years of experience in treating cardiovascular diseases. She specializes in preventive cardiology, heart failure management, and interventional procedures.',
    education: [
      { degree: 'MD', institution: 'Harvard Medical School', year: '2008' },
      { degree: 'Fellowship', institution: 'Mayo Clinic - Cardiology', year: '2012' },
    ],
    languages: ['English', 'Spanish'],
    consultationTypes: ['Video', 'In-Person'],
    clinicAddress: '123 Medical Center Drive, Suite 400, New York, NY 10001',
    workingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    awards: [
      'Best Cardiologist Award 2022',
      'Excellence in Patient Care 2021',
    ],
  };

  const reviews = [
    {
      id: '1',
      patientName: 'John D.',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Excellent doctor! Very thorough and took time to explain everything clearly.',
    },
    {
      id: '2',
      patientName: 'Maria S.',
      rating: 5,
      date: '1 month ago',
      comment: 'Dr. Wilson is incredibly knowledgeable and caring. Highly recommend!',
    },
    {
      id: '3',
      patientName: 'Robert K.',
      rating: 4,
      date: '2 months ago',
      comment: 'Great experience overall. Wait time was a bit long but worth it.',
    },
  ];

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleBookAppointment = () => {
    navigation.navigate('SlotSelection', { doctor: doctorDetails });
  };

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
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Card variant="gradient" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              name={doctorDetails.name} 
              size="xlarge" 
              showBorder 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.doctorName}>{doctorDetails.name}</Text>
              <Text style={styles.specialty}>{doctorDetails.specialty}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{renderStars(Math.floor(doctorDetails.rating))}</Text>
                <Text style={styles.ratingText}>{doctorDetails.rating}</Text>
                <Text style={styles.reviewCount}>({doctorDetails.reviews} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctorDetails.experience}+</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctorDetails.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{doctorDetails.fee}</Text>
              <Text style={styles.statLabel}>Fee</Text>
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['about', 'reviews'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'about' ? (
          <>
            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{doctorDetails.bio}</Text>
            </View>

            {/* Education */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {doctorDetails.education.map((edu, index) => (
                <View key={index} style={styles.educationItem}>
                  <View style={styles.educationDot} />
                  <View style={styles.educationContent}>
                    <Text style={styles.educationDegree}>{edu.degree}</Text>
                    <Text style={styles.educationInstitution}>{edu.institution}</Text>
                    <Text style={styles.educationYear}>{edu.year}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Languages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.tagsRow}>
                {doctorDetails.languages.map((lang, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Clinic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clinic Information</Text>
              <Card variant="default" style={styles.clinicCard}>
                <View style={styles.clinicRow}>
                  <Text style={styles.clinicIcon}>📍</Text>
                  <Text style={styles.clinicText}>{doctorDetails.clinicAddress}</Text>
                </View>
                <View style={styles.clinicRow}>
                  <Text style={styles.clinicIcon}>🕐</Text>
                  <Text style={styles.clinicText}>{doctorDetails.workingHours}</Text>
                </View>
              </Card>
            </View>
          </>
        ) : (
          /* Reviews Section */
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Patient Reviews</Text>
              <View style={styles.overallRating}>
                <Text style={styles.overallRatingValue}>{doctorDetails.rating}</Text>
                <Text style={styles.overallRatingStars}>★</Text>
              </View>
            </View>

            {reviews.map((review) => (
              <Card key={review.id} variant="default" style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <Avatar name={review.patientName} size="small" />
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.reviewerName}>{review.patientName}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </Card>
            ))}

            <TouchableOpacity style={styles.viewAllReviews}>
              <Text style={styles.viewAllText}>View All Reviews</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeValue}>₹{doctorDetails.fee}</Text>
        </View>
        <Button
          title="Book Appointment"
          onPress={handleBookAppointment}
          size="large"
          style={styles.bookButton}
        />
      </View>
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
  },
  profileCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  doctorName: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stars: {
    color: '#FFD700',
    fontSize: 14,
  },
  ratingText: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  reviewCount: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.headlineSmall,
    color: colors.primary,
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  bioText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  educationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.md,
  },
  educationContent: {
    flex: 1,
  },
  educationDegree: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  educationInstitution: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  educationYear: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  clinicCard: {
    padding: spacing.lg,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  clinicIcon: {
    fontSize: 16,
    marginRight: spacing.md,
  },
  clinicText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  overallRatingValue: {
    ...typography.headlineSmall,
    color: colors.primary,
  },
  overallRatingStars: {
    color: '#FFD700',
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  reviewCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerDetails: {
    marginLeft: spacing.md,
  },
  reviewerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  reviewDate: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  reviewStars: {
    color: '#FFD700',
    fontSize: 12,
  },
  reviewComment: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  viewAllReviews: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  viewAllText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    ...shadows.large,
  },
  feeContainer: {
    marginRight: spacing.lg,
  },
  feeLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  feeValue: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  bookButton: {
    flex: 1,
  },
});

export default DoctorProfileScreen;
