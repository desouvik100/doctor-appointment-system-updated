/**
 * Video Consult Screen - Real doctor availability from API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import apiClient from '../../services/api/apiClient';

const VideoConsultScreen = ({ navigation }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [specialties, setSpecialties] = useState([]);

  const defaultSpecialties = [
    { id: 'general', label: 'General', icon: '🩺' },
    { id: 'cardiology', label: 'Cardiology', icon: '❤️' },
    { id: 'dermatology', label: 'Dermatology', icon: '🧴' },
    { id: 'psychiatry', label: 'Mental Health', icon: '🧠' },
    { id: 'pediatrics', label: 'Pediatrics', icon: '👶' },
    { id: 'gynecology', label: 'Gynecology', icon: '👩' },
  ];

  const fetchDoctors = useCallback(async () => {
    try {
      const params = { availability: 'Available' };
      if (selectedSpecialty) {
        params.specialization = selectedSpecialty;
      }
      
      const response = await apiClient.get('/doctors', { params });
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSpecialty]);

  const fetchSpecialties = async () => {
    try {
      const response = await apiClient.get('/doctors/specializations/list');
      if (response.data?.length > 0) {
        const mapped = response.data.map(spec => ({
          id: spec.toLowerCase(),
          label: spec,
          icon: getSpecialtyIcon(spec),
        }));
        setSpecialties(mapped);
      } else {
        setSpecialties(defaultSpecialties);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setSpecialties(defaultSpecialties);
    }
  };

  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'general physician': '🩺',
      'general': '🩺',
      'cardiology': '❤️',
      'cardiologist': '❤️',
      'dermatology': '🧴',
      'dermatologist': '🧴',
      'psychiatry': '🧠',
      'psychiatrist': '🧠',
      'pediatrics': '👶',
      'pediatrician': '👶',
      'gynecology': '👩',
      'gynecologist': '👩',
      'orthopedics': '🦴',
      'orthopedic': '🦴',
      'neurology': '🧠',
      'neurologist': '🧠',
      'ent': '👂',
      'ophthalmology': '👁️',
      'dentist': '🦷',
    };
    return icons[specialty.toLowerCase()] || '👨‍⚕️';
  };

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDoctors();
  }, [selectedSpecialty, fetchDoctors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const getOnlineCount = (specialtyId) => {
    if (!specialtyId) return doctors.filter(d => d.availability === 'Available').length;
    return doctors.filter(d => 
      d.availability === 'Available' && 
      d.specialization?.toLowerCase().includes(specialtyId.toLowerCase())
    ).length;
  };

  const renderDoctorCard = ({ item }) => (
    <Card variant="gradient" style={styles.doctorCard}>
      <View style={styles.cardHeader}>
        <Avatar 
          name={item.name} 
          size="large" 
          showBorder 
          source={item.profilePhoto ? { uri: item.profilePhoto } : null}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialization}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.rating}>{item.rating?.toFixed(1) || '4.5'}</Text>
            <Text style={styles.reviews}>({item.reviewCount || 0} reviews)</Text>
          </View>
          {item.experience > 0 && (
            <Text style={styles.experience}>{item.experience} years exp.</Text>
          )}
        </View>
        {item.isOnline && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Fee</Text>
          <Text style={styles.infoValue}>₹{item.consultationFee || 500}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Clinic</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.clinicId?.name || 'HealthSync'}</Text>
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
            <Text style={styles.consultBtnText}>Consult</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Specialty</Text>
          <View style={styles.specialtiesGrid}>
            <TouchableOpacity
              style={[styles.specialtyCard, !selectedSpecialty && styles.specialtyCardActive]}
              onPress={() => setSelectedSpecialty(null)}
            >
              <Text style={styles.specialtyIcon}>👨‍⚕️</Text>
              <Text style={styles.specialtyLabel}>All</Text>
              <Text style={styles.specialtyAvailable}>{getOnlineCount(null)} online</Text>
            </TouchableOpacity>
            {(specialties.length > 0 ? specialties : defaultSpecialties).slice(0, 5).map((spec) => (
              <TouchableOpacity
                key={spec.id}
                style={[
                  styles.specialtyCard,
                  selectedSpecialty === spec.id && styles.specialtyCardActive,
                ]}
                onPress={() => setSelectedSpecialty(spec.id === selectedSpecialty ? null : spec.id)}
              >
                <Text style={styles.specialtyIcon}>{spec.icon}</Text>
                <Text style={styles.specialtyLabel}>{spec.label}</Text>
                <Text style={styles.specialtyAvailable}>{getOnlineCount(spec.id)} online</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Doctors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Now</Text>
            <Text style={styles.doctorCount}>{doctors.length} doctors</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : doctors.length > 0 ? (
            <FlatList
              data={doctors}
              renderItem={renderDoctorCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <Card variant="default" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyText}>No doctors available</Text>
              <Text style={styles.emptySubtext}>Try selecting a different specialty</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  banner: { marginHorizontal: spacing.xl, borderRadius: borderRadius.xl, padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  bannerContent: { flex: 1 },
  bannerTitle: { ...typography.headlineMedium, color: colors.textInverse, marginBottom: spacing.xs },
  bannerSubtitle: { ...typography.bodyMedium, color: 'rgba(0,0,0,0.6)', marginBottom: spacing.md },
  bannerFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { color: colors.textInverse, marginRight: spacing.xs, fontWeight: 'bold' },
  featureText: { ...typography.labelSmall, color: colors.textInverse },
  bannerEmoji: { fontSize: 48 },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.lg },
  doctorCount: { ...typography.labelMedium, color: colors.textMuted },
  seeAll: { ...typography.labelMedium, color: colors.primary },
  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  specialtyCard: { width: '31%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  specialtyCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  specialtyIcon: { fontSize: 28, marginBottom: spacing.sm },
  specialtyLabel: { ...typography.labelMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  specialtyAvailable: { ...typography.labelSmall, color: colors.success },
  doctorCard: { marginBottom: spacing.md, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', marginBottom: spacing.lg },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.headlineSmall, color: colors.textPrimary },
  specialty: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingIcon: { fontSize: 12, marginRight: spacing.xs },
  rating: { ...typography.labelMedium, color: colors.textPrimary, fontWeight: '600' },
  reviews: { ...typography.labelSmall, color: colors.textMuted, marginLeft: spacing.xs },
  experience: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: spacing.xs },
  onlineText: { ...typography.labelSmall, color: colors.success },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  infoItem: { alignItems: 'center' },
  infoLabel: { ...typography.labelSmall, color: colors.textMuted },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600', maxWidth: 80 },
  consultBtn: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  consultBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  consultBtnIcon: { fontSize: 16, marginRight: spacing.sm },
  consultBtnText: { ...typography.buttonSmall, color: colors.textInverse },
  loadingContainer: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyCard: { padding: spacing.xxl, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyLarge, color: colors.textMuted },
  emptySubtext: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
});

export default VideoConsultScreen;
