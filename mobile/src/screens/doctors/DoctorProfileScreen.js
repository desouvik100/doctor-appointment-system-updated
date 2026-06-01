/**
 * DoctorProfileScreen - Premium trust-building healthcare landing experience V2 (Production-Grade)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  FadeInDown,
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  runOnJS,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import shadows from '../../theme/shadows';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import { Rating } from '../../components/common';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';
import doctorService from '../../services/api/doctorService';
import reviewService from '../../services/api/reviewService';
import appointmentService from '../../services/api/appointmentService';
import apiClient from '../../services/api/apiClient';

const { width } = Dimensions.get('window');

const DoctorProfileScreen = ({ navigation, route }) => {
  const { doctor, doctorId } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [doctorData, setDoctorData] = useState(doctor || null);
  const [loading, setLoading] = useState(!doctor);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  // Real dynamic slots states
  const [availableSlotsToday, setAvailableSlotsToday] = useState([]);
  const [availableSlotsTomorrow, setAvailableSlotsTomorrow] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Dynamic reviews & discussions states
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsAnalytics, setReviewsAnalytics] = useState(null);

  // Sorting & Filtering
  const [reviewSort, setReviewSort] = useState('newest'); // 'helpful', 'highest', 'lowest', 'newest', 'oldest'
  const [filterVisitType, setFilterVisitType] = useState(null); // 'in-clinic', 'virtual', null
  const [filterVerified, setFilterVerified] = useState(false); // true/false
  const [filterRating, setFilterRating] = useState(null); // 5, 4, 3, 2, 1 or null

  // Interactive reviews states
  const [votedReviews, setVotedReviews] = useState({}); // { [reviewId]: 'helpful' | 'unhelpful' }
  const [activeReplyBox, setActiveReplyBox] = useState(null); // { reviewId, parentId }
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Write Review Modal States
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewAppointmentId, setReviewAppointmentId] = useState(null);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewVisitType, setNewReviewVisitType] = useState('in-clinic'); // 'in-clinic' | 'virtual'
  const [newReviewAnonymous, setNewReviewAnonymous] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // { uri, base64 }
  const [submittingReview, setSubmittingReview] = useState(false);

  // Animation values for tab content
  const tabContentOpacity = useSharedValue(1);

  // Helper to format date into YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to convert 24h string to 12h AM/PM
  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  };

  // Fetch full profile and check favorites
  // isValidMongoId: MongoDB ObjectIds are exactly 24 hex characters
  const isValidMongoId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

  useEffect(() => {
    const fetchProfile = async () => {
      const id = doctorId || doctor?._id || doctor?.id;
      if (!id || !isValidMongoId(id)) return;  // skip fake/placeholder IDs
      try {
        setLoading(true);
        const data = await doctorService.getDoctorById(id);
        const resolved = data.doctor || data.data || data;
        setDoctorData(resolved);
      } catch (err) {
        console.error('Failed to fetch doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    const checkFavorite = async () => {
      const id = doctorId || doctor?._id || doctor?.id;
      if (!id || !isValidMongoId(id)) return;  // skip fake/placeholder IDs
      try {
        const fav = await doctorService.isFavorite(id);
        setIsFavorite(fav);
      } catch (err) {
        console.error('Failed to check favorite status:', err);
      }
    };

    if (!doctor) {
      fetchProfile();
    }
    checkFavorite();
  }, [doctorId, doctor]);

  // Fetch available slots for Today and Tomorrow
  useEffect(() => {
    const fetchSlots = async () => {
      const id = doctorId || doctor?._id || doctor?.id || doctorData?._id || doctorData?.id;
      if (!id || !isValidMongoId(id)) return;  // skip fake/placeholder IDs
      try {
        setSlotsLoading(true);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStr = formatDate(today);
        const tomorrowStr = formatDate(tomorrow);

        const [todayRes, tomorrowRes] = await Promise.all([
          doctorService.getAvailableSlots(id, todayStr).catch(() => null),
          doctorService.getAvailableSlots(id, tomorrowStr).catch(() => null),
        ]);

        if (todayRes && todayRes.success && todayRes.slots) {
          setAvailableSlotsToday(todayRes.slots);
        } else {
          setAvailableSlotsToday([]);
        }

        if (tomorrowRes && tomorrowRes.success && tomorrowRes.slots) {
          setAvailableSlotsTomorrow(tomorrowRes.slots);
        } else {
          setAvailableSlotsTomorrow([]);
        }
      } catch (err) {
        console.error('Failed to fetch available slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    if (!loading) {
      fetchSlots();
    }
  }, [loading, doctorId, doctor, doctorData]);

  // Dynamic reviews loader
  const fetchReviews = async (page = 1, append = false) => {
    const id = doctorId || doctor?._id || doctor?.id || doctorData?._id || doctorData?.id;
    if (!id || !isValidMongoId(id)) return;  // skip fake/placeholder IDs
    try {
      setReviewsLoading(true);
      const params = {
        page,
        limit: 5,
        sort: reviewSort,
      };
      if (filterVisitType) params.visitType = filterVisitType;
      if (filterVerified) params.isVerified = true;
      if (filterRating) params.rating = String(filterRating);

      const res = await reviewService.getDoctorReviews(id, params);
      if (res && res.success) {
        setReviewsList(prev => append ? [...prev, ...res.reviews] : res.reviews);
        setReviewsTotal(res.total);
        setReviewsTotalPages(res.totalPages);
        setReviewsPage(res.page);
        setReviewsAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Trigger reviews reload on filters/sort changes
  useEffect(() => {
    if (!loading) {
      fetchReviews(1, false);
    }
  }, [loading, reviewSort, filterVisitType, filterVerified, filterRating, doctorId, doctor, doctorData]);

  const handleLoadMoreReviews = () => {
    if (reviewsPage < reviewsTotalPages && !reviewsLoading) {
      fetchReviews(reviewsPage + 1, true);
    }
  };

  const handleTabChange = (tab) => {
    tabContentOpacity.value = withTiming(0, { duration: 100 }, () => {
      'worklet';
      runOnJS(setActiveTab)(tab);
      tabContentOpacity.value = withTiming(1, { duration: 250 });
    });
  };

  const handleFavoritePress = async () => {
    const activeDoctor = doctorData || doctor || {};
    try {
      await doctorService.toggleFavorite(activeDoctor);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite status:', err);
    }
  };

  const activeDoctor = doctorData || doctor || {};

  // Formulate verified metadata lists defensively
  const doctorDetails = {
    bio: activeDoctor.bio || 'Professional clinical summary is currently pending credentials verification.',
    education: activeDoctor.education || [],
    languages: activeDoctor.languages || ['English'],
    consultationTypes: activeDoctor.consultationTypes || ['Video', 'In-Person'],
    clinicAddress: activeDoctor.clinicAddress || activeDoctor.clinic?.address || activeDoctor.clinicId?.address || null,
    clinicName: activeDoctor.clinicName || activeDoctor.clinic?.name || activeDoctor.clinicId?.name || null,
    clinicDistance: (() => {
      if (activeDoctor.distance == null) return null;
      const d = Number(activeDoctor.distance);
      return isNaN(d) ? null : `${d.toFixed(1)} km away`;
    })(),
    clinicOpenStatus: 'Open Now',
    workingHours: activeDoctor.workingHours || 'Mon-Fri: 9:00 AM - 5:00 PM',
    certifications: activeDoctor.certifications || activeDoctor.awards || [],
    conditionsTreated: activeDoctor.conditionsTreated || ['General Consultation'],
    specializations: activeDoctor.specialization || activeDoctor.specialty ? [activeDoctor.specialization || activeDoctor.specialty] : ['General Practitioner'],
    rating: reviewsAnalytics?.averageRating || activeDoctor.rating || 0,
    experience: activeDoctor.experience || activeDoctor.experienceYears || null,
    fee: activeDoctor.consultationFee || activeDoctor.fee || 500,
    isVerified: activeDoctor.isVerified || false,
    consultationSettings: activeDoctor.consultationSettings || null,
    ...activeDoctor,
  };

  // Find next available slot dynamically
  const getNextAvailableSlotInfo = () => {
    const firstToday = availableSlotsToday.find(s => s.available);
    if (firstToday) {
      return `Today ${formatSlotTime(firstToday.time)}`;
    }
    const firstTomorrow = availableSlotsTomorrow.find(s => s.available);
    if (firstTomorrow) {
      return `Tomorrow ${formatSlotTime(firstTomorrow.time)}`;
    }
    return 'Check calendar';
  };

  const nextSlotText = getNextAvailableSlotInfo();

  const handleBookAppointment = () => {
    const docId = doctorDetails._id || doctorDetails.id || doctorId || doctor?._id || doctor?.id;
    const clId = doctorDetails.clinicId?._id || doctorDetails.clinicId || null;
    navigation.navigate('AppointmentType', {
      doctor: doctorDetails,
      doctorId: docId,
      clinicId: clId,
    });
  };

  const handleSlotPress = (dateOffset, slotTime) => {
    const today = new Date();
    const targetDate = new Date(today);
    if (dateOffset === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const dateStr = formatDate(targetDate);
    const docId = doctorDetails._id || doctorDetails.id || doctorId || doctor?._id || doctor?.id;
    const clId = doctorDetails.clinicId?._id || doctorDetails.clinicId || null;
    
    navigation.navigate('AppointmentType', {
      doctor: doctorDetails,
      doctorId: docId,
      clinicId: clId,
      preselectedDate: dateStr,
      preselectedTime: slotTime,
    });
  };

  const handleVoteHelpful = async (reviewId, voteType) => {
    if (votedReviews[reviewId]) return;
    try {
      setVotedReviews(prev => ({ ...prev, [reviewId]: voteType }));
      setReviewsList(prev => prev.map(r => {
        if (r._id === reviewId) {
          return {
            ...r,
            helpfulCount: voteType === 'helpful' ? r.helpfulCount + 1 : r.helpfulCount,
            unhelpfulCount: voteType === 'unhelpful' ? r.unhelpfulCount + 1 : r.unhelpfulCount,
          };
        }
        return r;
      }));
      await reviewService.voteReviewHelpful(reviewId, voteType);
    } catch (err) {
      console.error('Failed to register vote:', err);
      // Revert optimistic updates
      setVotedReviews(prev => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      fetchReviews(1, false);
    }
  };

  const handleReplySubmit = async (reviewId, parentId = null) => {
    if (!replyText.trim() || replySubmitting) return;
    try {
      setReplySubmitting(true);
      const res = await reviewService.postReviewReply(reviewId, replyText, parentId);
      if (res && res.success) {
        setReplyText('');
        setActiveReplyBox(null);
        fetchReviews(1, false);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Eligibility Verification Check
  const checkReviewEligibility = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to your patient account to submit a review.');
      return;
    }
    try {
      setReviewsLoading(true);
      const res = await appointmentService.getAppointments({ status: 'completed' });
      const completed = res.appointments || res.data || [];
      const doctorIdVal = doctorDetails._id || doctorDetails.id || doctorId || doctor?._id || doctor?.id;
      
      const forThisDoctor = completed.filter(app => {
        const appDocId = app.doctorId?._id || app.doctorId || '';
        return appDocId && appDocId.toString() === doctorIdVal.toString();
      });

      if (forThisDoctor.length === 0) {
        Alert.alert(
          'Eligibility Required',
          'Only verified patients with completed appointments can review this clinician. We could not find any completed appointments for you with this doctor.'
        );
        return;
      }

      // Check if any of these completed appointments is reviewable
      let reviewableAppointment = null;
      for (const app of forThisDoctor) {
        const checkRes = await apiClient.get(`/reviews/can-review/${app._id}`).catch(() => null);
        if (checkRes && checkRes.data && checkRes.data.canReview) {
          reviewableAppointment = app;
          break;
        }
      }

      if (!reviewableAppointment) {
        Alert.alert(
          'Review Already Submitted',
          'You have already reviewed your appointments with this doctor, or the 30-day review window has expired.'
        );
        return;
      }

      // Eligible! Open Modal
      setReviewAppointmentId(reviewableAppointment._id);
      setNewReviewRating(5);
      setNewReviewTitle('');
      setNewReviewComment('');
      setNewReviewVisitType(reviewableAppointment.consultationType === 'online' ? 'virtual' : 'in-clinic');
      setNewReviewAnonymous(false);
      setSelectedPhoto(null);
      setIsReviewModalVisible(true);
    } catch (err) {
      console.error('Error checking eligibility:', err);
      Alert.alert('Error', 'Failed to verify review eligibility. Please check your network connection.');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Photo pick handler
  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7, includeBase64: true }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Photo Error', 'Failed to pick image.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setSelectedPhoto(response.assets[0]);
      }
    });
  };

  // Review submission
  const handleReviewFormSubmit = async () => {
    if (!newReviewComment.trim()) {
      Alert.alert('Validation Error', 'Please write a review comment.');
      return;
    }
    try {
      setSubmittingReview(true);
      const payload = {
        appointmentId: reviewAppointmentId,
        rating: newReviewRating,
        title: newReviewTitle,
        review: newReviewComment,
        visitType: newReviewVisitType,
        isAnonymous: newReviewAnonymous,
        photo: selectedPhoto ? `data:image/jpeg;base64,${selectedPhoto.base64}` : null
      };

      const res = await reviewService.createReview(payload);
      if (res && res.success) {
        Alert.alert('Success', 'Thank you for your feedback! Your review has been submitted.');
        setIsReviewModalVisible(false);
        fetchReviews(1, false); // Reload reviews
      } else {
        Alert.alert('Error', res.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const displayName = doctorDetails.name 
    ? (doctorDetails.name.startsWith('Dr.') ? doctorDetails.name : `Dr. ${doctorDetails.name}`)
    : 'Doctor Details';

  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabContentOpacity.value,
  }));

  // Build verified highlight grid items
  const highlightItems = [];
  if (doctorDetails.experience && doctorDetails.experience > 0) {
    highlightItems.push({ label: 'EXPERIENCE', value: `${doctorDetails.experience} Yrs` });
  }
  if (doctorDetails.rating && doctorDetails.rating > 0) {
    highlightItems.push({ label: 'RATING', value: `⭐ ${Number(doctorDetails.rating).toFixed(1)}` });
  }
  if (doctorDetails.fee) {
    highlightItems.push({ label: 'CLINIC FEE', value: `₹${doctorDetails.fee}` });
  }
  if (doctorDetails.languages && doctorDetails.languages.length > 0) {
    highlightItems.push({ label: 'LANGUAGES', value: doctorDetails.languages.slice(0, 2).join(', ') });
  }
  if (doctorDetails.clinicName) {
    highlightItems.push({ label: 'CLINIC COUNT', value: '1 Clinic' });
  }

  // Check consultation settings status
  const inClinicAvailable = doctorDetails.consultationSettings?.inClinicConsultationEnabled !== false;
  const virtualAvailable = doctorDetails.consultationSettings?.virtualConsultationEnabled !== false;

  // Render Star distribution breakdown
  const renderReviewAnalytics = () => {
    if (!reviewsAnalytics) return null;
    const { averageRating, totalReviews, distribution } = reviewsAnalytics;

    return (
      <View style={[styles.analyticsCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
        <View style={styles.analyticsTopRow}>
          <View style={styles.ratingNumberBox}>
            <Text style={[styles.avgRatingText, { color: colors.textPrimary }]}>{averageRating}</Text>
            <Rating rating={averageRating} size={14} />
            <Text style={[styles.totalReviewsSubText, { color: colors.textMuted }]}>{totalReviews} reviews</Text>
          </View>
          <View style={styles.distributionBars}>
            {[5, 4, 3, 2, 1].map(stars => {
              const pct = distribution[stars] || 0;
              return (
                <View key={stars} style={styles.distBarRow}>
                  <Text style={[styles.distStarText, { color: colors.textSecondary }]}>{stars} ★</Text>
                  <View style={[styles.distBarTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ECEFF1' }]}>
                    <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.distPercentText, { color: colors.textMuted }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
        {/* Write Review CTA when reviews exist */}
        <TouchableOpacity 
          onPress={checkReviewEligibility}
          style={[styles.writeReviewSecondaryBtn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.writeReviewSecondaryBtnText, { color: colors.primary }]}>🖊 Write a Review</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render sorting and filtering controls
  const renderSortAndFilters = () => {
    return (
      <View style={styles.filtersWrapper}>
        {/* Sort Select */}
        <Text style={[styles.filterTitleLabel, { color: colors.textPrimary }]}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {[
            { id: 'newest', label: '🆕 Newest' },
            { id: 'helpful', label: '👍 Helpful' },
            { id: 'highest', label: '⭐ Highest' },
            { id: 'lowest', label: '📉 Lowest' },
            { id: 'oldest', label: '📅 Oldest' },
          ].map(opt => {
            const active = reviewSort === opt.id;
            return (
              <TouchableOpacity 
                key={opt.id}
                onPress={() => setReviewSort(opt.id)}
                style={[
                  styles.filterPill, 
                  { 
                    backgroundColor: active ? colors.primary : (isDarkMode ? '#242D3D' : '#ECEFF1'),
                    borderColor: active ? colors.primary : 'transparent',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[styles.filterPillText, { color: active ? colors.textInverse : colors.textPrimary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Visit Type Filter */}
        <Text style={[styles.filterTitleLabel, { color: colors.textPrimary, marginTop: 8 }]}>Filter By Visit Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {[
            { id: null, label: 'All Visits' },
            { id: 'in-clinic', label: '🏥 In-Clinic' },
            { id: 'virtual', label: '🎥 Video Consult' },
          ].map(opt => {
            const active = filterVisitType === opt.id;
            return (
              <TouchableOpacity 
                key={opt.id || 'all'}
                onPress={() => setFilterVisitType(opt.id)}
                style={[
                  styles.filterPill, 
                  { 
                    backgroundColor: active ? colors.primary : (isDarkMode ? '#242D3D' : '#ECEFF1'),
                    borderColor: active ? colors.primary : 'transparent',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[styles.filterPillText, { color: active ? colors.textInverse : colors.textPrimary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Star Rating Filter */}
        <Text style={[styles.filterTitleLabel, { color: colors.textPrimary, marginTop: 8 }]}>Filter By Rating</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {[
            { id: null, label: 'All Stars' },
            { id: 5, label: '5 ★' },
            { id: 4, label: '4 ★' },
            { id: 3, label: '3 ★' },
            { id: 2, label: '2 ★' },
            { id: 1, label: '1 ★' },
          ].map(opt => {
            const active = filterRating === opt.id;
            return (
              <TouchableOpacity 
                key={opt.id || 'all-stars'}
                onPress={() => setFilterRating(opt.id)}
                style={[
                  styles.filterPill, 
                  { 
                    backgroundColor: active ? colors.primary : (isDarkMode ? '#242D3D' : '#ECEFF1'),
                    borderColor: active ? colors.primary : 'transparent',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[styles.filterPillText, { color: active ? colors.textInverse : colors.textPrimary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Verified Reviews Toggle */}
        <View style={styles.verifiedFilterToggleRow}>
          <Text style={[styles.verifiedFilterLabel, { color: colors.textPrimary }]}>Show verified reviews only</Text>
          <TouchableOpacity 
            onPress={() => setFilterVerified(!filterVerified)}
            style={[
              styles.toggleSwitchFrame,
              { backgroundColor: filterVerified ? colors.primary : (isDarkMode ? '#343A40' : '#CED4DA') }
            ]}
          >
            <View style={[styles.toggleSwitchDot, { alignSelf: filterVerified ? 'flex-end' : 'flex-start' }]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render single recursive reply node
  const renderReplyNode = (reply, depth = 1) => {
    const isDoctor = reply.userType === 'Doctor';
    const isClinic = reply.userType === 'ClinicStaff';

    return (
      <View 
        key={reply._id} 
        style={[
          styles.replyNodeContainer, 
          { 
            marginLeft: depth > 1 ? 16 : 0,
            borderLeftColor: colors.divider || 'rgba(0, 0, 0, 0.06)',
            borderLeftWidth: depth > 1 ? 1.5 : 0,
            paddingLeft: depth > 1 ? 10 : 0,
          }
        ]}
      >
        <View style={[
          styles.replyHeaderRow, 
          (isDoctor || isClinic) && [
            styles.staffReplyHighlight,
            { 
              backgroundColor: isDoctor 
                ? (isDarkMode ? 'rgba(0, 212, 170, 0.08)' : 'rgba(0, 212, 170, 0.04)')
                : (isDarkMode ? 'rgba(108, 92, 231, 0.08)' : 'rgba(108, 92, 231, 0.04)'),
              borderColor: isDoctor ? colors.primary : (colors.secondary || '#6C5CE7'),
            }
          ]
        ]}>
          <View style={styles.replyUserMeta}>
            <Text style={[styles.replyUserName, { color: colors.textPrimary }]}>
              {reply.user?.name || 'Verified Patient'}
            </Text>
            {isDoctor && (
              <View style={[styles.staffBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.staffBadgeText}>✓ Doctor Response</Text>
              </View>
            )}
            {isClinic && (
              <View style={[styles.staffBadge, { backgroundColor: colors.secondary || '#6C5CE7' }]}>
                <Text style={styles.staffBadgeText}>✓ Clinic Response</Text>
              </View>
            )}
            <Text style={[styles.replyDateText, { color: colors.textMuted }]}>
              {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.replyBodyText, { color: colors.textSecondary }]}>
            {reply.text}
          </Text>

          {/* Inline Reply CTA inside thread */}
          {depth < 3 && (
            <TouchableOpacity 
              onPress={() => {
                setActiveReplyBox({ reviewId: reply.reviewId, parentId: reply._id });
                setReplyText('');
              }}
              style={styles.replyActionBtn}
            >
              <Text style={[styles.replyActionText, { color: colors.primary }]}>💬 Reply</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nested child replies */}
        {reply.replies && reply.replies.map(child => renderReplyNode(child, depth + 1))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={isDarkMode ? ['#0A0E17', '#121826', '#1A1F2E'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── 1. HEADER ROW ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder, borderWidth: 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Clinician Profile</Text>
        <TouchableOpacity 
          style={[styles.favoriteButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder, borderWidth: 1 }]}
          onPress={handleFavoritePress}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 2. DYNAMIC PROFILE HEADER CARD ── */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.profileCardContainer}>
          <View style={[
            styles.profileCard, 
            { 
              backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              ...shadows.sm,
            }
          ]}>
            <View style={styles.profileHeader}>
              <Avatar 
                name={displayName} 
                size="large" 
                imageUrl={doctorDetails.profilePhoto || doctorDetails.photo || null}
              />
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{displayName}</Text>
                </View>
                <Text style={[styles.specialty, { color: colors.primary }]}>
                  {doctorDetails.specializations[0] || 'General Physician'}
                </Text>
                
                {/* Verification Badges Row */}
                {doctorDetails.isVerified ? (
                  <View style={styles.verificationRow}>
                    <View style={[styles.badgeItem, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)' }]}>
                      <Text style={styles.verifiedText}>✓ Verified Doctor</Text>
                    </View>
                    <View style={[styles.badgeItem, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)' }]}>
                      <Text style={styles.verifiedText}>✓ Credentials Checked</Text>
                    </View>
                    <View style={[styles.badgeItem, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)' }]}>
                      <Text style={styles.verifiedText}>✓ Verified Clinic</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.verificationRow}>
                    <View style={[styles.badgeItem, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)' }]}>
                      <Text style={[styles.verifiedText, { color: '#F59E0B' }]}>⌛ Verification Pending</Text>
                    </View>
                  </View>
                )}

                <View style={styles.ratingRow}>
                  {doctorDetails.rating > 0 ? (
                    <>
                      <Rating rating={doctorDetails.rating} size={13} />
                      <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                        {Number(doctorDetails.rating).toFixed(1)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.ratingText, { color: colors.textMuted }]}>New Clinician</Text>
                  )}
                  {doctorDetails.experience && doctorDetails.experience > 0 && (
                    <Text style={[styles.experienceText, { color: colors.textMuted }]}>
                      • {doctorDetails.experience} yrs exp
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 3. CONSULTATION MODES ── */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.modesContainer}>
          <View style={[styles.modeChip, { backgroundColor: isDarkMode ? '#171E2D' : '#F1F5F9' }]}>
            <Text style={styles.modeEmoji}>🏥</Text>
            <View>
              <Text style={[styles.modeTitle, { color: colors.textPrimary }]}>In-Clinic Visit</Text>
              <Text style={inClinicAvailable ? styles.modeStatusActive : styles.modeStatusInactive}>
                {inClinicAvailable ? 'Available' : 'Not Active'}
              </Text>
            </View>
          </View>
          <View style={[styles.modeChip, { backgroundColor: isDarkMode ? '#171E2D' : '#F1F5F9' }]}>
            <Text style={styles.modeEmoji}>🎥</Text>
            <View>
              <Text style={[styles.modeTitle, { color: colors.textPrimary }]}>Video Consult</Text>
              <Text style={virtualAvailable ? styles.modeStatusActive : styles.modeStatusInactive}>
                {virtualAvailable ? 'Active Now' : 'Not Active'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── 4. MINI AVAILABILITY TIMELINE ── */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.availabilitySection}>
          <Text style={[styles.sectionTitleLabel, { color: colors.textPrimary }]}>Next Available Slots</Text>
          {slotsLoading ? (
            <View style={styles.slotsLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {/* Today Slots */}
              <View style={styles.timelineDay}>
                <Text style={[styles.timelineDayLabel, { color: colors.textPrimary }]}>Today</Text>
                {availableSlotsToday.filter(s => s.available).length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotsRow}>
                    {availableSlotsToday.filter(s => s.available).slice(0, 4).map((slot, index) => (
                      <TouchableOpacity 
                        key={`today-${index}`} 
                        onPress={() => handleSlotPress('today', slot.time)} 
                        style={[styles.slotPill, { backgroundColor: colors.primary + '15' }]}
                      >
                        <Text style={[styles.slotPillText, { color: colors.primary }]}>{formatSlotTime(slot.time)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.noSlotsText, { color: colors.textMuted }]}>No slots today</Text>
                )}
              </View>
              
              <View style={styles.timelineDivider} />
              
              {/* Tomorrow Slots */}
              <View style={styles.timelineDay}>
                <Text style={[styles.timelineDayLabel, { color: colors.textPrimary }]}>Tomorrow</Text>
                {availableSlotsTomorrow.filter(s => s.available).length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotsRow}>
                    {availableSlotsTomorrow.filter(s => s.available).slice(0, 4).map((slot, index) => (
                      <TouchableOpacity 
                        key={`tomorrow-${index}`} 
                        onPress={() => handleSlotPress('tomorrow', slot.time)} 
                        style={[styles.slotPill, { backgroundColor: colors.primary + '15' }]}
                      >
                        <Text style={[styles.slotPillText, { color: colors.primary }]}>{formatSlotTime(slot.time)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.noSlotsText, { color: colors.textMuted }]}>No slots tomorrow</Text>
                )}
              </View>
            </View>
          )}
          <Text style={[styles.timelineHint, { color: colors.textMuted }]}>
            💡 Tapping a slot pill will pre-fill it directly in the booking calendar.
          </Text>
        </Animated.View>

        {/* ── 5. TRUST HIGHLIGHTS GRID (Verified Data Only) ── */}
        {highlightItems.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.highlightsWrapper}>
            <Text style={[styles.sectionTitleLabel, { color: colors.textPrimary }]}>Doctor Highlights</Text>
            <View style={styles.highlightsContainer}>
              {highlightItems.map((item, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.highlightBox, 
                    { 
                      backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', 
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' 
                    }
                  ]}
                >
                  <Text style={[styles.highlightTitle, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.highlightValue, { color: colors.primary }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── 6. TABS CONTAINER ── */}
        <View style={[
          styles.tabsContainer, 
          { 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
          }
        ]}>
          {['about', 'reviews'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handleTabChange(tab)}
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
                      {tab === 'about' ? 'About Clinician' : `Reviews (${reviewsTotal})`}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveTabContent}>
                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                      {tab === 'about' ? 'About Clinician' : `Reviews (${reviewsTotal})`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab content wrapper */}
        <Animated.View style={animatedTabStyle}>
          {activeTab === 'about' ? (
            <View style={styles.tabContentContainer}>
              {/* Professional Summary */}
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderIcon}>📝</Text>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Professional Summary</Text>
                </View>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>{doctorDetails.bio}</Text>
              </View>

              {/* Specializations & Conditions */}
              <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderIcon}>🩺</Text>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Clinical Focus & Specialties</Text>
                </View>
                <Text style={[styles.tagHeading, { color: colors.textMuted }]}>SPECIALIZATIONS</Text>
                <View style={styles.tagsContainer}>
                  {doctorDetails.specializations.map((spec, i) => (
                    <View key={i} style={[styles.tagPill, { backgroundColor: colors.primary + '12' }]}>
                      <Text style={[styles.tagPillText, { color: colors.primary }]}>{spec}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.tagHeading, { color: colors.textMuted, marginTop: spacing.md }]}>CONDITIONS TREATED</Text>
                <View style={styles.tagsContainer}>
                  {doctorDetails.conditionsTreated.map((cond, i) => (
                    <View key={i} style={[styles.tagPill, { backgroundColor: isDarkMode ? '#2A344A' : '#ECEFF1' }]}>
                      <Text style={[styles.tagPillText, { color: colors.textPrimary }]}>{cond}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Education & Certifications */}
              {(doctorDetails.education.length > 0 || doctorDetails.certifications.length > 0) && (
                <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardHeaderIcon}>🎓</Text>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Education & Certifications</Text>
                  </View>
                  {doctorDetails.education.map((edu, i) => (
                    <View key={i} style={styles.educationRow}>
                      <View style={[styles.eduDot, { backgroundColor: colors.primary }]} />
                      <View>
                        <Text style={[styles.eduTitle, { color: colors.textPrimary }]}>{edu.degree} - {edu.institution}</Text>
                        <Text style={[styles.eduYear, { color: colors.textMuted }]}>{edu.year}</Text>
                      </View>
                    </View>
                  ))}
                  {doctorDetails.certifications.map((cert, i) => (
                    <View key={`cert-${i}`} style={styles.educationRow}>
                      <View style={[styles.eduDot, { backgroundColor: colors.secondary || '#6C5CE7' }]} />
                      <View>
                        <Text style={[styles.eduTitle, { color: colors.textPrimary }]}>{cert}</Text>
                        <Text style={[styles.eduYear, { color: colors.textMuted }]}>Verified Credential</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Languages Card */}
              {doctorDetails.languages && doctorDetails.languages.length > 0 && (
                <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardHeaderIcon}>💬</Text>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Languages Spoken</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {doctorDetails.languages.map((lang, i) => (
                      <View key={i} style={[styles.tagPill, { backgroundColor: colors.primary + '12' }]}>
                        <Text style={[styles.tagPillText, { color: colors.primary }]}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Clinic Information (Verified location map) */}
              {doctorDetails.clinicName && doctorDetails.clinicAddress && (
                <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardHeaderIcon}>📍</Text>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Clinic Locations</Text>
                  </View>
                  <Text style={[styles.clinicNameText, { color: colors.textPrimary }]}>{doctorDetails.clinicName}</Text>
                  <Text style={[styles.clinicAddrText, { color: colors.textSecondary }]}>{doctorDetails.clinicAddress}</Text>
                  {doctorDetails.clinicDistance && (
                    <Text style={[styles.clinicDistText, { color: colors.primary }]}>🚀 Proximity: {doctorDetails.clinicDistance}</Text>
                  )}
                  {/* Mock Map Preview Card */}
                  <LinearGradient
                    colors={isDarkMode ? ['#171B26', '#222A3F'] : ['#E2E8F0', '#CFD8DC']}
                    style={styles.mapPreview}
                  >
                    <Text style={styles.mapIcon}>🗺️</Text>
                    <Text style={[styles.mapText, { color: colors.textSecondary }]}>Interactive clinic directions mapping</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            /* Patient Reviews Tab V2 (Live Community Reviews with Redesigned UX) */
            <View style={styles.tabContentContainer}>
              
              {reviewsLoading && reviewsList.length === 0 && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              )}

              {/* Conditional Analytics Summary & Filters: HIDE when reviewsTotal === 0 */}
              {reviewsTotal > 0 ? (
                <>
                  {renderReviewAnalytics()}
                  {renderSortAndFilters()}

                  {/* Reviews List */}
                  {reviewsList.map((rev) => (
                    <View key={rev._id} style={[styles.reviewCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerMeta}>
                          <Avatar name={rev.patientName} size="small" imageUrl={rev.patientPhoto} />
                          <View>
                            <View style={styles.verifiedReviewRow}>
                              <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{rev.patientName}</Text>
                              {rev.isVerified && (
                                <View style={styles.verifiedReviewBadge}>
                                  <Text style={styles.verifiedCheckIcon}>✓</Text>
                                  <Text style={styles.verifiedReviewText}>Verified Patient</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                              {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} • {rev.visitType === 'virtual' ? '🎥 Video Consult' : '🏥 In-Clinic Visit'}
                            </Text>
                          </View>
                        </View>
                        <Rating rating={rev.rating} size={11} />
                      </View>
                      
                      {rev.title && (
                        <Text style={[styles.reviewTitleText, { color: colors.textPrimary }]}>{rev.title}</Text>
                      )}
                      <Text style={[styles.reviewCommentText, { color: colors.textSecondary }]}>{rev.review}</Text>

                      {/* Review Photo Attachment (if exists) */}
                      {rev.photo && (
                        <Image source={{ uri: rev.photo }} style={styles.reviewImageAttached} />
                      )}
                      
                      {/* Helpfulness Actions */}
                      <View style={styles.voteActionsRow}>
                        <TouchableOpacity 
                          onPress={() => handleVoteHelpful(rev._id, 'helpful')} 
                          disabled={!!votedReviews[rev._id]}
                          style={[
                            styles.votePill, 
                            { 
                              borderColor: votedReviews[rev._id] === 'helpful' ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                              backgroundColor: votedReviews[rev._id] === 'helpful' ? colors.primary + '15' : 'transparent'
                            }
                          ]}
                        >
                          <Text style={[styles.votePillText, { color: votedReviews[rev._id] === 'helpful' ? colors.primary : colors.textSecondary }]}>
                            👍 Helpful ({rev.helpfulCount || 0})
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleVoteHelpful(rev._id, 'unhelpful')} 
                          disabled={!!votedReviews[rev._id]}
                          style={[
                            styles.votePill, 
                            { 
                              borderColor: votedReviews[rev._id] === 'unhelpful' ? '#EF4444' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                              backgroundColor: votedReviews[rev._id] === 'unhelpful' ? 'rgba(239,68,68,0.1)' : 'transparent'
                            }
                          ]}
                        >
                          <Text style={[styles.votePillText, { color: votedReviews[rev._id] === 'unhelpful' ? '#EF4444' : colors.textSecondary }]}>
                            👎 Not Helpful ({rev.unhelpfulCount || 0})
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Comment Actions */}
                      <View style={styles.commentActionsRow}>
                        <TouchableOpacity 
                          onPress={() => {
                            setActiveReplyBox({ reviewId: rev._id, parentId: null });
                            setReplyText('');
                          }}
                          style={styles.writeCommentBtn}
                        >
                          <Text style={[styles.writeCommentText, { color: colors.primary }]}>💬 Write Reply</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Inline Reply input box */}
                      {activeReplyBox && activeReplyBox.reviewId === rev._id && (
                        <View style={[styles.replyInputWrapper, { borderColor: colors.primary, borderWidth: 1, backgroundColor: isDarkMode ? '#171E2D' : '#F8FAFC' }]}>
                          <Text style={[styles.replyToLabel, { color: colors.textMuted }]}>
                            {activeReplyBox.parentId ? 'Replying to comment...' : 'Replying to review...'}
                          </Text>
                          <TextInput
                            placeholder="Write reply message..."
                            placeholderTextColor={colors.textMuted}
                            style={[styles.replyTextInput, { color: colors.textPrimary }]}
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                          />
                          <View style={styles.replyBtnRow}>
                            <TouchableOpacity 
                              onPress={() => {
                                setActiveReplyBox(null);
                                setReplyText('');
                              }}
                              style={styles.cancelReplyBtn}
                            >
                              <Text style={[styles.cancelReplyText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleReplySubmit(rev._id, activeReplyBox.parentId)}
                              disabled={replySubmitting}
                              style={[styles.submitReplyBtn, { backgroundColor: colors.primary }]}
                            >
                              {replySubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.submitReplyText}>Send</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Discussions Thread Trees (Recursive up to Depth 3) */}
                      {rev.discussionThread && rev.discussionThread.length > 0 && (
                        <View style={styles.repliesThreadContainer}>
                          {rev.discussionThread.map(reply => renderReplyNode(reply, 1))}
                        </View>
                      )}

                    </View>
                  ))}

                  {/* Load More Pagination Trigger */}
                  {reviewsPage < reviewsTotalPages && (
                    <TouchableOpacity 
                      onPress={handleLoadMoreReviews} 
                      disabled={reviewsLoading}
                      style={[styles.loadMoreBtn, { borderColor: colors.primary }]}
                    >
                      {reviewsLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.loadMoreBtnText, { color: colors.primary }]}>Load More Reviews</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                /* Empty State: HIDE filters, render clean Practo empty UX block */
                !reviewsLoading && (
                  <View style={[styles.emptyReviewsContainer, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                    <View style={[styles.emptyReviewsIconWrap, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={styles.emptyReviewsIcon}>💬</Text>
                    </View>
                    <Text style={[styles.emptyReviewsTitle, { color: colors.textPrimary }]}>No patient reviews yet</Text>
                    <Text style={[styles.emptyReviewsSubtitle, { color: colors.textMuted }]}>
                      Be the first verified patient to review this clinician. Feedback helps our community find the right care.
                    </Text>
                    <TouchableOpacity 
                      onPress={checkReviewEligibility}
                      style={[styles.writeReviewBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.writeReviewBtnText, { color: colors.textInverse }]}>Write Review</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}

            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── ── 10. WRITE REVIEW FORM MODAL ── ── */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Write a Review</Text>
              <TouchableOpacity 
                onPress={() => setIsReviewModalVisible(false)} 
                style={styles.modalCloseBtn}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Star Rating Select */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Rating</Text>
                <View style={styles.ratingSelectorRow}>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <TouchableOpacity 
                      key={starValue} 
                      onPress={() => setNewReviewRating(starValue)}
                    >
                      <Text 
                        style={[
                          styles.modalStar, 
                          { color: starValue <= newReviewRating ? '#FFD700' : '#D1D5DB' }
                        ]}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Review Title</Text>
                <TextInput
                  placeholder="Summarize your experience..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInput, { borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
                  value={newReviewTitle}
                  onChangeText={setNewReviewTitle}
                />
              </View>

              {/* Review Comment Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Review Comment</Text>
                <TextInput
                  placeholder="Share details about the diagnostic explanations, wait times, clinic environment..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.modalInputMulti, { borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
                  value={newReviewComment}
                  onChangeText={setNewReviewComment}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Consultation Visit Type */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Visit Type</Text>
                <View style={[styles.segmentedControl, { borderColor: colors.surfaceBorder }]}>
                  <TouchableOpacity 
                    onPress={() => setNewReviewVisitType('in-clinic')}
                    style={[
                      styles.segmentBtn, 
                      { 
                        backgroundColor: newReviewVisitType === 'in-clinic' ? colors.primary : 'transparent' 
                      }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.segmentText, 
                        { color: newReviewVisitType === 'in-clinic' ? colors.textInverse : colors.textPrimary }
                      ]}
                    >
                      🏥 In Clinic
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setNewReviewVisitType('virtual')}
                    style={[
                      styles.segmentBtn, 
                      { 
                        backgroundColor: newReviewVisitType === 'virtual' ? colors.primary : 'transparent' 
                      }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.segmentText, 
                        { color: newReviewVisitType === 'virtual' ? colors.textInverse : colors.textPrimary }
                      ]}
                    >
                      🎥 Video Consult
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Anonymous Post Toggle */}
              <View style={styles.verifiedFilterToggleRow}>
                <Text style={[styles.verifiedFilterLabel, { color: colors.textPrimary }]}>Submit Review Anonymously</Text>
                <TouchableOpacity 
                  onPress={() => setNewReviewAnonymous(!newReviewAnonymous)}
                  style={[
                    styles.toggleSwitchFrame,
                    { backgroundColor: newReviewAnonymous ? colors.primary : (isDarkMode ? '#343A40' : '#CED4DA') }
                  ]}
                >
                  <View style={[styles.toggleSwitchDot, { alignSelf: newReviewAnonymous ? 'flex-end' : 'flex-start' }]} />
                </TouchableOpacity>
              </View>

              {/* Optional Photo Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Photo Attachment (Optional)</Text>
                <View style={styles.photoUploadArea}>
                  <TouchableOpacity 
                    onPress={handlePickPhoto} 
                    style={[styles.pickPhotoBtn, { borderColor: colors.surfaceBorder }]}
                  >
                    <Text style={[styles.pickPhotoText, { color: colors.textSecondary }]}>📷 Upload Photo</Text>
                  </TouchableOpacity>
                  {selectedPhoto && (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreviewImage} />
                      <TouchableOpacity 
                        onPress={() => setSelectedPhoto(null)} 
                        style={styles.deletePhotoBtn}
                      >
                        <Text style={styles.deletePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Submit CTA */}
              <TouchableOpacity 
                onPress={handleReviewFormSubmit}
                disabled={submittingReview}
                style={[styles.submitReviewModalBtn, { backgroundColor: colors.primary }]}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.submitReviewModalBtnText, { color: colors.textInverse }]}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 9. BOTTOM STICKY CONVERSION BAR ── */}
      <View style={[
        styles.bottomBar,
        {
          backgroundColor: isDarkMode ? '#131926' : '#FFFFFF',
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.05)',
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg,
        }
      ]}>
        <View style={styles.feeContainer}>
          <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
          <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{doctorDetails.fee}</Text>
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
            <Text style={[styles.bookCTAButtonText, { color: colors.textInverse }]}>
              Book Slot • {nextSlotText}
            </Text>
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
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitle: {
    ...typography.headlineMedium,
    fontSize: 15,
    fontWeight: '800',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 150,
  },
  profileCardContainer: {
    marginBottom: spacing.md,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  specialty: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  verificationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  badgeItem: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 3,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Consultation modes styles
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  modeEmoji: {
    fontSize: 18,
  },
  modeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modeStatusActive: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  modeStatusInactive: {
    fontSize: 9.5,
    fontWeight: '750',
    color: '#EF4444',
    marginTop: 2,
  },
  // Availability Section styles
  availabilitySection: {
    marginBottom: spacing.md,
  },
  sectionTitleLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  slotsLoader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContainer: {
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timelineDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timelineDayLabel: {
    fontSize: 12,
    fontWeight: '800',
    width: 70,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slotPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  slotPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  noSlotsText: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    width: '100%',
  },
  timelineHint: {
    fontSize: 9.5,
    marginTop: 6,
    fontStyle: 'italic',
  },
  // Highlights Grid
  highlightsWrapper: {
    marginBottom: spacing.md,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  highlightBox: {
    width: '48.5%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    height: 65,
  },
  highlightTitle: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  // Tabs system
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 3,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: 36,
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
    fontSize: 11.5,
    fontWeight: '600',
  },
  // Cards inside Tab content
  tabContentContainer: {
    gap: spacing.md,
  },
  infoCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeaderIcon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tagHeading: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  educationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  eduDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eduTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  eduYear: {
    fontSize: 9,
    marginTop: 1,
  },
  clinicNameText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  clinicAddrText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  clinicDistText: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
  mapPreview: {
    height: 80,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapIcon: {
    fontSize: 18,
  },
  mapText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Reviews List Card
  reviewCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  verifiedReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '800',
  },
  verifiedReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  verifiedCheckIcon: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: 'bold',
  },
  verifiedReviewText: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: '800',
  },
  reviewDate: {
    fontSize: 9,
    marginTop: 2,
  },
  reviewCommentText: {
    fontSize: 11.5,
    lineHeight: 18,
  },
  helpfulBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  helpfulBtnText: {
    fontSize: 9,
    color: '#A0AEC0',
    fontWeight: '700',
  },
  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    ...shadows.lg,
  },
  feeContainer: {
    marginRight: spacing.lg,
  },
  feeLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  bookCTAButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  bookCTAButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCTAButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  // ─── NEW REVIEWS SYSTEM V2 STYLES ───
  replyNodeContainer: {
    marginTop: spacing.sm,
    gap: 2,
  },
  replyHeaderRow: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  staffReplyHighlight: {
    borderLeftWidth: 3,
  },
  replyUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  replyUserName: {
    fontSize: 11,
    fontWeight: '800',
  },
  staffBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  staffBadgeText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: '800',
  },
  replyDateText: {
    fontSize: 9,
  },
  replyBodyText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  replyActionBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
  replyActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  repliesThreadContainer: {
    marginTop: spacing.md,
    borderTopColor: 'rgba(0,0,0,0.04)',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  replyInputWrapper: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  replyToLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  replyInputRow: {
    flexDirection: 'column',
    gap: 6,
  },
  replyTextInput: {
    fontSize: 12,
    paddingVertical: 6,
    minHeight: 36,
  },
  replyBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelReplyBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelReplyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitReplyBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReplyText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '800',
  },
  // Analytics Breakdown Card
  analyticsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  analyticsTopRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  ratingNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 90,
  },
  avgRatingText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  totalReviewsSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  distributionBars: {
    flex: 1,
    gap: 4,
  },
  distBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distStarText: {
    fontSize: 10,
    fontWeight: '700',
    width: 24,
  },
  distBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  distPercentText: {
    fontSize: 10,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  // Filters Styles
  filtersWrapper: {
    marginBottom: spacing.md,
    gap: 6,
  },
  filterTitleLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedFilterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  verifiedFilterLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleSwitchFrame: {
    width: 36,
    height: 18,
    borderRadius: 9,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  loadMoreBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewTitleText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 2,
  },
  voteActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.xs,
  },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  votePillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  commentActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  writeCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  writeCommentText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  writeReviewSecondaryBtn: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  writeReviewSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Empty State Styles
  emptyReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  emptyReviewsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyReviewsIcon: {
    fontSize: 28,
  },
  emptyReviewsTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyReviewsSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginHorizontal: spacing.md,
  },
  writeReviewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  writeReviewBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScrollContent: {
    gap: spacing.md,
    paddingBottom: 40,
  },
  ratingSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: spacing.sm,
  },
  modalStar: {
    fontSize: 32,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalInputMulti: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoUploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
  },
  pickPhotoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoPreviewContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePhotoText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  submitReviewModalBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitReviewModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewImageAttached: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    resizeMode: 'cover',
  },
});

export default DoctorProfileScreen;
