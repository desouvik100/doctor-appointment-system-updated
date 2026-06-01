/**
 * AppointmentTypeScreen - Premium screen to select between In-Clinic and Online/Video Consultations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import shadows from '../../theme/shadows';
import doctorService from '../../services/api/doctorService';

const { width } = Dimensions.get('window');

const AppointmentTypeScreen = ({ navigation, route }) => {
  const { doctor, doctorId } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null);

  const [currentDoctor, setCurrentDoctor] = useState(doctor || null);
  const [loading, setLoading] = useState(!doctor && !!doctorId);

  useEffect(() => {
    const fetchDoctor = async () => {
      const id = doctorId || doctor?._id || doctor?.id;
      if (!id) return;
      try {
        setLoading(true);
        const res = await doctorService.getDoctorById(id);
        const resolved = res.doctor || res.data || res;
        setCurrentDoctor(resolved);
      } catch (err) {
        console.error('Failed to fetch doctor in AppointmentTypeScreen:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!currentDoctor || (!currentDoctor._id && !currentDoctor.id)) {
      fetchDoctor();
    }
  }, [doctorId, doctor]);

  const activeDoc = currentDoctor || doctor;

  const displayName = activeDoc?.name 
    ? (activeDoc.name.startsWith('Dr.') ? activeDoc.name : `Dr. ${activeDoc.name}`)
    : 'Doctor';

  const handleContinue = (type) => {
    const docId = activeDoc?._id || activeDoc?.id || doctorId;
    const clId = activeDoc?.clinicId?._id || activeDoc?.clinicId || null;
    navigation.navigate('SlotSelection', {
      doctor: activeDoc || {},
      doctorId: docId,
      consultationType: type,
      clinicId: clId,
      ...route.params, // Forward preselected slots params
    });
  };

  const CONSULT_TYPES = [
    {
      id: 'in_person',
      icon: '🏥',
      title: 'In-Clinic Visit',
      desc: 'Physical examination at the doctor\'s clinic',
      wait: '⏱ Avg wait: 20 min',
      timing: 'Mon–Sat · 9 AM – 7 PM',
      color: '#00D4AA',
    },
    {
      id: 'online',
      icon: '📹',
      title: 'Video Consultation',
      desc: 'Connect online via Google Meet from home',
      wait: '⚡ Connect instantly',
      timing: '24/7 Available Online',
      color: '#6C5CE7',
      recommended: true,
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Loading doctor details...</Text>
      </View>
    );
  }

  if (!activeDoc && !doctorId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Doctor Information Missing</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
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
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: colors.surfaceBorder, borderWidth: 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Type</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Doctor Summary Header Card */}
        <View style={[styles.doctorCard, {
          backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 184, 148, 0.08)',
          borderWidth: 1,
          borderRadius: borderRadius.xl,
          ...shadows.md,
        }]}>
          <Avatar
            name={displayName}
            size="large"
            imageUrl={activeDoc?.profilePhoto || activeDoc?.photo || null}
          />
          <View style={styles.doctorInfo}>
            <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{displayName}</Text>
            <Text style={[styles.specialty, { color: colors.primary }]}>
              {activeDoc?.specialization || activeDoc?.specialty || 'Specialist'}
            </Text>
          </View>
        </View>

        <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
          Choose how you would like to consult with the doctor:
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {CONSULT_TYPES.map((type) => {
            const active = selectedType === type.id;
            const cardBorderColor = active
              ? (type.id === 'online' ? colors.secondary : colors.primary)
              : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)');
            const cardBg = active
              ? (type.id === 'online' ? 'rgba(108, 92, 231, 0.08)' : 'rgba(0, 212, 170, 0.08)')
              : colors.surface;

            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorderColor,
                    borderWidth: 2,
                    ...shadows.sm,
                  }
                ]}
                onPress={() => {
                  setSelectedType(type.id);
                  // Dynamic instant navigation
                  setTimeout(() => handleContinue(type.id), 150);
                }}
                activeOpacity={0.85}
              >
                {type.recommended && (
                  <View style={[styles.recommendedBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                  </View>
                )}
                
                <View style={[styles.iconContainer, { backgroundColor: type.color + '15' }]}>
                  <Text style={[styles.typeIcon, { color: type.color }]}>{type.icon}</Text>
                </View>
                
                <View style={styles.textContainer}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{type.title}</Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{type.desc}</Text>
                  
                  <View style={styles.metaRow}>
                    <Text style={[styles.waitText, { color: type.color }]}>{type.wait}</Text>
                    <Text style={[styles.timingText, { color: colors.textMuted }]}>{type.timing}</Text>
                  </View>
                </View>

                {active && (
                  <View style={[styles.checkIndicator, { backgroundColor: type.id === 'online' ? colors.secondary : colors.primary }]}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  doctorName: {
    ...typography.bodyLarge,
    fontWeight: '700',
  },
  specialty: {
    ...typography.bodyMedium,
    marginTop: spacing.xs,
  },
  instructionText: {
    ...typography.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  typeCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderBottomLeftRadius: borderRadius.md,
  },
  recommendedBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  typeIcon: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  waitText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
  },
  timingText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  checkIndicator: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AppointmentTypeScreen;
