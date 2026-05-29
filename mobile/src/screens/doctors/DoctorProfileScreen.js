/**
 * DoctorProfileScreen - Full doctor profile with reviews and booking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import shadows from '../../theme/shadows';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { Rating } from '../../components/common';
import { fadeIn, slideUp, stagger, bounce } from '../../utils/animations';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import doctorService from '../../services/api/doctorService';

const { width } = Dimensions.get('window');

const DoctorProfileScreen = ({ navigation, route }) => {
  const { doctor, doctorId } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [doctorData, setDoctorData] = useState(doctor || null);
  const [loading, setLoading] = useState(!doctor);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(0.9)).current;
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const tabOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const favoriteScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchProfile = async () => {
      const id = doctorId || doctor?._id || doctor?.id;
      if (!id) return;
      try {
        setLoading(true);
        const data = await doctorService.getDoctorProfile(id);
        const resolved = data.doctor || data.data || data;
        setDoctorData(resolved);
      } catch (err) {
        console.error('Failed to fetch doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!doctor) {
      fetchProfile();
    }
  }, [doctorId, doctor]);

  // Animate on mount
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        fadeIn(headerOpacity, 300),
        Animated.spring(profileScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        stagger(statsAnimations, fadeIn, 100),
        fadeIn(tabOpacity, 300),
      ]),
      fadeIn(contentOpacity, 400),
    ]).start();
  }, [loading]);

  // Animate tab change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const handleFavoritePress = () => {
    bounce(favoriteScale).start();
    setIsFavorite(!isFavorite);
  };

  const handleBookAppointment = () => {
    navigation.navigate('SlotSelection', { doctor: doctorDetails });
  };

  const activeDoctor = doctorData || doctor || {};

  // Extended doctor data
  const doctorDetails = {
    bio: activeDoctor.bio || 'Dr. Sarah Wilson is a board-certified cardiologist with over 12 years of experience in treating cardiovascular diseases. She specializes in preventive cardiology, heart failure management, and interventional procedures.',
    education: activeDoctor.education || [
      { degree: 'MD', institution: 'Harvard Medical School', year: '2008' },
      { degree: 'Fellowship', institution: 'Mayo Clinic - Cardiology', year: '2012' },
    ],
    languages: activeDoctor.languages || ['English', 'Spanish'],
    consultationTypes: activeDoctor.consultationTypes || ['Video', 'In-Person'],
    clinicAddress: activeDoctor.clinicAddress || activeDoctor.clinic?.address || '123 Medical Center Drive, Suite 400, New York, NY 10001',
    workingHours: activeDoctor.workingHours || 'Mon-Fri: 9:00 AM - 5:00 PM',
    awards: activeDoctor.awards || [
      'Best Cardiologist Award 2022',
      'Excellence in Patient Care 2021',
    ],
    ...activeDoctor,
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

  const displayName = doctorDetails.name 
    ? (doctorDetails.name.startsWith('Dr.') ? doctorDetails.name : `Dr. ${doctorDetails.name}`)
    : 'Doctor';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading doctor profile...</Text>
      </View>
    );
  }

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
      <Animated.View style={[styles.header, { paddingTop: insets.top + spacing.md, opacity: headerOpacity }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder, borderWidth: 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Doctor Profile</Text>
        <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
          <TouchableOpacity 
            style={[styles.favoriteButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder, borderWidth: 1 }]}
            onPress={handleFavoritePress}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Animated.View style={{ transform: [{ scale: profileScale }], opacity: headerOpacity }}>
          <View style={[
            styles.profileCard, 
            { 
              backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 184, 148, 0.08)',
              borderWidth: 1,
              borderRadius: borderRadius.xl,
              ...shadows.md,
            }
          ]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarBorder, { borderColor: colors.primary + '30' }]}>
                <Avatar 
                  name={displayName} 
                  size="xlarge" 
                  showBorder 
                  imageUrl={doctorDetails.profilePhoto || doctorDetails.photo || null}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{displayName}</Text>
                <Text style={[styles.specialty, { color: colors.primary }]}>{doctorDetails.specialization || doctorDetails.specialty || 'General Physician'}</Text>
                <View style={styles.ratingRow}>
                  <Rating rating={doctorDetails.rating} size={16} />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{doctorDetails.rating ? Number(doctorDetails.rating).toFixed(1) : '4.5'}</Text>
                  <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({doctorDetails.reviews || doctorDetails.reviewCount || 0} reviews)</Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
              {[
                { value: `${doctorDetails.experience || doctorDetails.experienceYears || '12'}+`, label: 'Years Exp.' },
                { value: doctorDetails.reviews || doctorDetails.reviewCount || 0, label: 'Reviews' },
                { value: `₹${doctorDetails.fee || doctorDetails.consultationFee || 500}`, label: 'Fee' },
              ].map((stat, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />}
                  <Animated.View 
                    style={[
                      styles.statItem,
                      {
                        opacity: statsAnimations[index],
                        transform: [{
                          translateY: statsAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        }],
                      }
                    ]}
                  >
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                  </Animated.View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View style={[
          styles.tabsContainer, 
          { 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
            opacity: tabOpacity,
          }
        ]}>
          {['about', 'reviews'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                {isActive ? (
                  <LinearGradient
                    colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeTabGradient}
                  >
                    <Text style={[styles.tabText, { color: colors.textInverse, fontWeight: '700' }]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveTabContent}>
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>
          {activeTab === 'about' ? (
            <>
              {/* About Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>{doctorDetails.bio}</Text>
              </View>

              {/* Education */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Education</Text>
                {doctorDetails.education.map((edu, index) => (
                  <View key={index} style={styles.educationItem}>
                    <View style={[styles.educationDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.educationContent}>
                      <Text style={[styles.educationDegree, { color: colors.textPrimary }]}>{edu.degree}</Text>
                      <Text style={[styles.educationInstitution, { color: colors.textSecondary }]}>{edu.institution}</Text>
                      <Text style={[styles.educationYear, { color: colors.textMuted }]}>{edu.year}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Languages */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Languages</Text>
                <View style={styles.tagsRow}>
                  {doctorDetails.languages.map((lang, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Clinic Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Clinic Information</Text>
                <View style={[
                  styles.clinicCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderWidth: 1,
                    borderRadius: borderRadius.xl,
                  }
                ]}>
                  <View style={styles.clinicRow}>
                    <Text style={styles.clinicIcon}>📍</Text>
                    <Text style={[styles.clinicText, { color: colors.textSecondary }]}>{doctorDetails.clinicAddress}</Text>
                  </View>
                  <View style={styles.clinicRow}>
                    <Text style={styles.clinicIcon}>🕐</Text>
                    <Text style={[styles.clinicText, { color: colors.textSecondary }]}>{doctorDetails.workingHours}</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Reviews Section */
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Patient Reviews</Text>
                <View style={[styles.overallRating, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.overallRatingValue, { color: colors.primary }]}>{doctorDetails.rating ? Number(doctorDetails.rating).toFixed(1) : '4.5'}</Text>
                  <Text style={styles.overallRatingStars}>★</Text>
                </View>
              </View>

              {reviews.map((review) => (
                <View key={review.id} style={[
                  styles.reviewCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderWidth: 1,
                    borderRadius: borderRadius.xl,
                    marginBottom: spacing.md,
                  }
                ]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Avatar name={review.patientName} size="small" />
                      <View style={styles.reviewerDetails}>
                        <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{review.patientName}</Text>
                        <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{review.date}</Text>
                      </View>
                    </View>
                    <Rating rating={review.rating} size={14} />
                  </View>
                  <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.viewAllReviews}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Reviews</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[
        styles.bottomBar,
        {
          backgroundColor: isDarkMode ? '#131926' : '#FFFFFF',
          borderTopColor: colors.divider,
        }
      ]}>
        <View style={styles.feeContainer}>
          <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{doctorDetails.fee || doctorDetails.consultationFee || 500}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookCTAButton}
          onPress={handleBookAppointment}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookCTAButtonGradient}
          >
            <Text style={[styles.bookCTAButtonText, { color: colors.textInverse }]}>Book Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
  },
  headerTitle: {
    ...typography.headlineMedium,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 160,
  },
  profileCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatarBorder: {
    borderWidth: 2,
    borderRadius: borderRadius.full,
    padding: 2,
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
    fontWeight: '800',
  },
  specialty: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  ratingText: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  reviewCount: {
    ...typography.labelSmall,
    marginLeft: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.headlineSmall,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.labelSmall,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveTabContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    ...typography.labelMedium,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  bioText: {
    ...typography.bodyMedium,
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
    marginTop: 6,
    marginRight: spacing.md,
  },
  educationContent: {
    flex: 1,
  },
  educationDegree: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  educationInstitution: {
    ...typography.bodySmall,
  },
  educationYear: {
    ...typography.labelSmall,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.labelMedium,
    fontWeight: '600',
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  overallRatingValue: {
    ...typography.headlineSmall,
    fontWeight: '800',
  },
  overallRatingStars: {
    color: '#FFD700',
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  reviewCard: {
    padding: spacing.lg,
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
    fontWeight: '500',
  },
  reviewDate: {
    ...typography.labelSmall,
  },
  reviewComment: {
    ...typography.bodyMedium,
    lineHeight: 22,
  },
  viewAllReviews: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  viewAllText: {
    ...typography.labelMedium,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    ...shadows.lg,
  },
  feeContainer: {
    marginRight: spacing.lg,
  },
  feeLabel: {
    ...typography.labelSmall,
  },
  feeValue: {
    ...typography.headlineMedium,
    fontWeight: '800',
  },
  bookCTAButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  bookCTAButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCTAButtonText: {
    ...typography.button,
    fontWeight: '700',
  },
});

export default DoctorProfileScreen;
