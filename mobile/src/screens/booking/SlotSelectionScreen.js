/**
 * SlotSelectionScreen - Queue-based and Slot-based appointment booking flow
 * Step 1: Select Type | Step 2: Smart Details & Symptoms | Step 3: Date & Slot Matrix
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, TextInput, Alert, Image, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

// Independent Animated DateCell Component
const DateCell = React.memo(({ day, isSelected, onSelect }) => {
  const { colors, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isSelected ? 1 : 0,
      duration: 220,
      useNativeDriver: false, // color interpolation not supported on native driver
    }).start();
  }, [isSelected]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary],
  });

  const textColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textPrimary, '#FFFFFF'],
  });

  const textMutedColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted, 'rgba(255, 255, 255, 0.8)'],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onSelect}
        disabled={day.isSunday}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.dateCard,
            {
              backgroundColor,
              borderColor: isSelected ? colors.primary : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
              borderWidth: 1.5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDarkMode ? 0.2 : 0.03,
              shadowRadius: 8,
              elevation: 1,
            },
            day.isSunday && { opacity: 0.35 },
          ]}
        >
          <Animated.Text style={[styles.dateDay, { color: textMutedColor }]}>{day.day}</Animated.Text>
          <Animated.Text style={[styles.dateNum, { color: textColor, fontWeight: isSelected ? '800' : '700' }]}>{day.date}</Animated.Text>
          <Animated.Text style={[styles.dateMonth, { color: textMutedColor }]}>{day.month}</Animated.Text>
          {day.isToday && !isSelected && (
            <View style={styles.todayDot}>
              <Text style={styles.todayDotText}>Today</Text>
            </View>
          )}
          {day.isSunday && (
            <Text style={[styles.closedBadge, { color: colors.error }]}>Closed</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const SlotSelectionScreen = ({ navigation, route }) => {
  const { doctor } = route.params || {};
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1); // 1=Type, 2=Smart Details, 3=Date & Slots
  const [consultationType, setConsultationType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);

  const doctorId = doctor?._id || doctor?.id;

  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain',
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup',
  ];

  // Defined morning, afternoon, and evening time slots
  const MORNING_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
  const AFTERNOON_SLOTS = ['12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '03:00 PM', '03:30 PM'];
  const EVENING_SLOTS = ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];

  // Booked/Disabled Slots for simulation
  const BOOKED_SLOTS = ['10:00 AM', '01:30 PM', '06:00 PM', '07:00 PM'];

  const generateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dow = date.getDay();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        full: `${y}-${m}-${d}`,
        isToday: i === 0,
        isSunday: dow === 0,
        isAvailable: dow !== 0,
      };
    });
  };

  const dates = generateDates();

  const fetchQueueInfo = useCallback(async (dateStr) => {
    if (!doctorId || !dateStr || !consultationType) return;
    try {
      setQueueLoading(true);
      const typeParam = consultationType === 'online' ? 'online' : 'in_person';
      const res = await apiClient.get(
        `/appointments/queue-info/${doctorId}/${dateStr}?consultationType=${typeParam}`
      );
      if (res.data?.success) setQueueInfo(res.data);
      else setQueueInfo(null);
    } catch {
      setQueueInfo(null);
    } finally {
      setQueueLoading(false);
    }
  }, [doctorId, consultationType]);

  useEffect(() => {
    if (selectedDate && consultationType && step === 3) {
      fetchQueueInfo(selectedDate);
    }
  }, [selectedDate, consultationType, step, fetchQueueInfo]);

  const handleBookingNavigation = () => {
    let fullReason = selectedSymptoms.length > 0
      ? `Symptoms: ${selectedSymptoms.join(', ')}.` : '';
    if (reason.trim()) fullReason = fullReason ? `${fullReason} ${reason.trim()}` : reason.trim();
    if (!fullReason) fullReason = 'General Consultation';

    if (!user) {
      Alert.alert('Login Required', 'Please login to book an appointment');
      return;
    }
    const userId = user.id || user._id || user.userId;
    if (!userId) {
      Alert.alert('Error', 'User session invalid. Please login again.');
      return;
    }
    if (!doctorId) {
      Alert.alert('Error', 'Doctor information missing.');
      return;
    }

    const clinicId = doctor?.clinicId?._id || doctor?.clinicId || null;

    navigation.navigate('ConfirmDetails', {
      doctor: doctor || {},
      date: selectedDate,
      time: selectedSlot || queueInfo?.estimatedTime || '09:00 AM',
      queueNumber: queueInfo?.nextQueueNumber || 1,
      consultationType: consultationType || 'in_person',
      patient: { id: 'self', name: user?.name || 'Patient', relation: 'Self' },
      pendingBooking: {
        userId,
        doctorId,
        clinicId,
        date: selectedDate,
        reason: fullReason,
        consultationType: consultationType === 'online' ? 'online' : 'in_person',
        urgencyLevel,
      },
    });
  };

  // Animated scale refs
  const scaleIn = useRef(new Animated.Value(1)).current;
  const scaleOut = useRef(new Animated.Value(1)).current;

  const animateSelect = (ref) => {
    Animated.sequence([
      Animated.timing(ref, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(ref, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const CONSULT_TYPES = [
    {
      key: 'in_person',
      icon: '🏥',
      title: 'In-Clinic Booking',
      desc: 'Physical examination at clinic',
      wait: 'Avg wait: 20 min',
      hours: 'Mon–Sat · 9 AM – 7 PM',
      scaleRef: scaleIn,
      tag: null,
    },
    {
      key: 'online',
      icon: '💻',
      title: 'Online / Google Meet',
      desc: 'Consult via video call from home',
      wait: 'Connect instantly',
      hours: 'Mon–Sat · 8 AM – 8 PM',
      scaleRef: scaleOut,
      tag: 'Recommended',
    },
  ];

  // Render Step 1: Consultation Type with minimal pastel fills & solid borders
  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Consultation Type</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Select how you would like to consult with {doctor?.name?.startsWith('Dr.') ? doctor?.name : `Dr. ${doctor?.name || 'Doctor'}`}
      </Text>

      {CONSULT_TYPES.map(({ key, icon, title, desc, tag, wait, hours, scaleRef }) => {
        const active = consultationType === key;
        
        // Solid border contrast and minimal pastel fills
        let borderStyleColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
        let backgroundFillColor = colors.surface;
        
        if (active) {
          borderStyleColor = key === 'online' ? colors.secondary : colors.primary;
          backgroundFillColor = key === 'online' ? 'rgba(108, 92, 231, 0.08)' : 'rgba(0, 212, 170, 0.08)';
        }

        return (
          <Animated.View key={key} style={{ transform: [{ scale: scaleRef }] }}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                {
                  backgroundColor: backgroundFillColor,
                  borderColor: borderStyleColor,
                  borderWidth: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                }
              ]}
              onPress={() => {
                animateSelect(scaleRef);
                setConsultationType(key);
              }}
              activeOpacity={0.9}
            >
              <View style={[
                styles.typeIconWrap,
                { backgroundColor: active ? (key === 'online' ? 'rgba(108,92,231,0.1)' : 'rgba(0,212,170,0.1)') : colors.surfaceLight }
              ]}>
                <Text style={styles.typeIcon}>{icon}</Text>
              </View>
              <View style={styles.typeInfo}>
                <View style={styles.typeNameRow}>
                  <Text style={[styles.typeName, { color: colors.textPrimary }]}>{title}</Text>
                  {tag && (
                    <View style={[styles.recTag, { backgroundColor: colors.success + '15' }]}>
                      <Text style={[styles.recTagText, { color: colors.success }]}>{tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>{desc}</Text>
                <View style={styles.typeMetaRow}>
                  <Text style={[styles.typeWait, { color: active ? borderStyleColor : colors.textSecondary }]}>⚡ {wait}</Text>
                  <Text style={[styles.typeHours, { color: colors.textMuted }]}>{hours}</Text>
                </View>
              </View>
              {active && (
                <View style={[styles.checkBadge, { backgroundColor: borderStyleColor }]}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <View style={[styles.infoNote, { backgroundColor: colors.surfaceLight, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider }]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          HealthSync uses a smart queue system. No specific time slots are required; you will receive a live token number.
        </Text>
      </View>
    </View>
  );

  // Render Step 2: Smart Details & Symptoms
  const renderDetailsStep = () => {
    const URGENCY_CONFIG = {
      normal: { icon: '🟢', label: 'Normal', color: colors.success, bg: 'rgba(16,185,129,0.08)' },
      urgent: { icon: '🟡', label: 'Urgent', color: colors.warning, bg: 'rgba(245,158,11,0.08)' },
      emergency: { icon: '🔴', label: 'Priority', color: colors.error, bg: 'rgba(239,68,68,0.08)' },
    };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Smart Assessment</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Provide context to help the clinic prepare for your consultation
        </Text>

        {/* Symptoms */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Symptoms</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
              {selectedSymptoms.length}/5 selected
            </Text>
          </View>
          <View style={styles.symptomsGrid}>
            {commonSymptoms.map((symptom) => {
              const active = selectedSymptoms.includes(symptom);
              const maxReached = selectedSymptoms.length >= 5 && !active;
              return (
                <TouchableOpacity
                  key={symptom}
                  disabled={maxReached}
                  style={[
                    styles.symptomChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider),
                      borderWidth: 1.5,
                    },
                    maxReached && { opacity: 0.4 },
                  ]}
                  onPress={() => setSelectedSymptoms(prev =>
                    prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
                  )}
                >
                  <Text style={[styles.symptomText, { color: active ? colors.textInverse : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Urgency Level</Text>
          <View style={styles.urgencyRow}>
            {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => {
              const active = urgencyLevel === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.urgencyBtn,
                    {
                      backgroundColor: active ? cfg.bg : colors.surface,
                      borderColor: active ? cfg.color : 'transparent',
                      borderWidth: active ? 2 : 0,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.15 : 0.03,
                      shadowRadius: 6,
                      elevation: 1,
                    },
                  ]}
                  onPress={() => setUrgencyLevel(key)}
                >
                  <Text style={styles.urgencyIcon}>{cfg.icon}</Text>
                  <Text style={[styles.urgencyText, { color: active ? cfg.color : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Brief Description</Text>
          <TextInput
            style={[
              styles.reasonInput,
              {
                backgroundColor: colors.surface,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider,
                borderWidth: 1,
                color: colors.textPrimary
              }
            ]}
            placeholder="Write details about your sickness (optional)"
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={(t) => t.length <= 300 && setReason(t)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{reason.length}/300</Text>
        </View>
      </View>
    );
  };

  // Render Step 3: Date & Slot Matrix
  const renderDateSelection = () => {
    const queueNum = queueInfo?.nextQueueNumber || 1;
    const queueCount = queueInfo?.currentQueueCount || 0;
    const maxSlots = queueInfo?.maxSlots || 25;
    const queueProgress = Math.min(queueCount / maxSlots, 1);

    const renderSlotItem = (timeStr) => {
      const isBooked = BOOKED_SLOTS.includes(timeStr);
      const isSelected = selectedSlot === timeStr;
      
      let background = colors.surface;
      let border = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
      let text = colors.textPrimary;
      
      if (isBooked) {
        background = isDarkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9';
        border = 'transparent';
        text = colors.textMuted;
      } else if (isSelected) {
        background = colors.primary;
        border = colors.primary;
        text = '#FFFFFF';
      }

      return (
        <TouchableOpacity
          key={timeStr}
          disabled={isBooked}
          onPress={() => setSelectedSlot(timeStr)}
          style={[
            styles.slotChip,
            {
              backgroundColor: background,
              borderColor: border,
            }
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.slotChipText, { color: text, fontWeight: isSelected ? '700' : '600' }]}>
            {timeStr}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Choose Date & Time</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Select an available date and scheduled time slot
        </Text>

        {/* Horizontal Scrollable Date ribbon */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
          {dates.map((day, index) => (
            <DateCell
              key={index}
              day={day}
              isSelected={selectedDate === day.full}
              onSelect={() => {
                setSelectedDate(day.full);
                setSelectedSlot(null); // Reset slot choice when date changes
                fetchQueueInfo(day.full);
              }}
            />
          ))}
        </ScrollView>

        {/* Dynamic slots matrix - Morning, Afternoon, Evening grids */}
        {selectedDate && (
          <View style={styles.slotSection}>
            <Text style={[styles.slotSectionTitle, { color: colors.textPrimary }]}>🌅 Morning Slots</Text>
            <View style={styles.slotGrid}>
              {MORNING_SLOTS.map(renderSlotItem)}
            </View>

            <Text style={[styles.slotSectionTitle, { color: colors.textPrimary }]}>☀️ Afternoon Slots</Text>
            <View style={styles.slotGrid}>
              {AFTERNOON_SLOTS.map(renderSlotItem)}
            </View>

            <Text style={[styles.slotSectionTitle, { color: colors.textPrimary }]}>🌙 Evening Slots</Text>
            <View style={styles.slotGrid}>
              {EVENING_SLOTS.map(renderSlotItem)}
            </View>
          </View>
        )}

        {/* Live Queue Tracker */}
        {selectedDate && (
          <View style={styles.queueContainer}>
            <Text style={[styles.queueHeaderTitle, { color: colors.textPrimary }]}>Live Queue Status</Text>
            <LinearGradient
              colors={isDarkMode ? ['rgba(30,36,51,0.5)', 'rgba(10,14,23,0.2)'] : ['#FFFFFF', '#F8FAFC']}
              style={[
                styles.queueCard,
                {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider || '#E5E7EB',
                  borderWidth: 1,
                }
              ]}
            >
              {queueLoading ? (
                <View style={styles.queueLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.queueLoadingText, { color: colors.textSecondary }]}> Checking live wait time...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.queueTopRow}>
                    <View>
                      <Text style={[styles.queueTokenLabel, { color: colors.textMuted }]}>Available Queue Token</Text>
                      <Text style={[styles.queueTokenNum, { color: colors.primary }]}>#{queueNum}</Text>
                    </View>
                    <View style={styles.queueWaitBox}>
                      <Text style={[styles.queueWaitLabel, { color: colors.textMuted }]}>Estimated Wait</Text>
                      <Text style={[styles.queueWaitVal, { color: colors.primary }]}>
                        ⏱ {queueInfo?.estimatedTime || `~${queueNum * 10} mins`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.queueBarWrap}>
                    <View style={[styles.queueBarTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                      <View style={[styles.queueBarFill, { width: `${queueProgress * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.queueBarLabel, { color: colors.textSecondary }]}>
                      {queueCount} active patients in clinic queue right now (max {maxSlots})
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Banner */}
      <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Appointment Type' : step === 2 ? 'Tell Us Symptoms' : 'Select Slots'}
          </Text>
          <Text style={styles.headerSub}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Step Indicator Progress Bar */}
      <View style={[styles.progressWrap, { backgroundColor: colors.surface }]}>
        {['Type', 'Details', 'Date'].map((label, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <React.Fragment key={s}>
              <View style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  {
                    backgroundColor: done ? colors.primary : (active ? colors.surfaceLight : colors.surface),
                    borderColor: active || done ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider),
                    borderWidth: 2,
                  }
                ]}>
                  {done ? (
                    <Text style={styles.progressCheck}>✓</Text>
                  ) : (
                    <Text style={[styles.progressNum, { color: active ? colors.primary : colors.textMuted }]}>{s}</Text>
                  )}
                </View>
                <Text style={[
                  styles.progressLabel,
                  { color: (done || active) ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '500' }
                ]}>{label}</Text>
              </View>
              {i < 2 && (
                <View style={[
                  styles.progressLine,
                  { backgroundColor: step > s ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider) }
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Doctor Summary Header Card */}
      <View style={[styles.doctorSummaryCard, { backgroundColor: colors.surface }]}>
        <View style={styles.doctorSummaryRow}>
          {doctor?.profilePhoto ? (
            <Image source={{ uri: doctor.profilePhoto }} style={styles.doctorAvatar} />
          ) : (
            <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} style={styles.doctorAvatarFallback}>
              <Text style={styles.doctorAvatarInitials}>
                {(doctor?.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.doctorInfoCard}>
            <View style={styles.doctorNameRow}>
              <Text style={[styles.doctorNameText, { color: colors.textPrimary }]}>
                {doctor?.name?.startsWith('Dr.') ? doctor?.name : `Dr. ${doctor?.name || 'Doctor'}`}
              </Text>
              <View style={[styles.verifiedLabelBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.verifiedLabelText, { color: colors.primary }]}>✔ Verified</Text>
              </View>
            </View>
            <Text style={[styles.doctorSpecText, { color: colors.textSecondary }]}>
              {doctor?.specialization || doctor?.specialty || 'Specialist'}
            </Text>
          </View>
          <View style={styles.feeSummaryBox}>
            <Text style={[styles.feeValueText, { color: colors.primary }]}>₹{doctor?.consultationFee || doctor?.fee || 500}</Text>
            <Text style={[styles.feeLabelText, { color: colors.textMuted }]}>Fee</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Step Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderTypeSelection()}
        {step === 2 && renderDetailsStep()}
        {step === 3 && renderDateSelection()}
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider || '#F1F5F9' }]}>
        {step === 1 && (
          <TouchableOpacity
            onPress={() => consultationType && setStep(2)}
            activeOpacity={consultationType ? 0.85 : 1}
            disabled={!consultationType}
            style={styles.actionBtnContainer}
          >
            <LinearGradient
              colors={consultationType ? (colors.gradientPrimary || ['#00D4AA', '#00B894']) : ['#2A3142', '#2A3142']}
              style={styles.actionBtnGradient}
            >
              <Text style={[styles.actionBtnText, { color: consultationType ? colors.textInverse : colors.textMuted }]}>
                {consultationType ? 'Continue to Assessment →' : 'Select Consultation Type'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {step === 2 && (
          <TouchableOpacity
            onPress={() => setStep(3)}
            activeOpacity={0.85}
            style={styles.actionBtnContainer}
          >
            <LinearGradient
              colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
              style={styles.actionBtnGradient}
            >
              <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>
                Select Preferred Date →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {step === 3 && (
          <View style={styles.bottomStep3Row}>
            <View style={styles.bottomFeeColumn}>
              <Text style={[styles.bottomFeeLabelText, { color: colors.textMuted }]}>Consultation Fee</Text>
              <Text style={[styles.bottomFeeValueText, { color: colors.textPrimary }]}>
                ₹{doctor?.consultationFee || doctor?.fee || 500}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => selectedDate && selectedSlot && handleBookingNavigation()}
              activeOpacity={selectedDate && selectedSlot ? 0.85 : 1}
              disabled={!selectedDate || !selectedSlot}
              style={[styles.actionBtnContainer, { flex: 1.4 }]}
            >
              <LinearGradient
                colors={selectedDate && selectedSlot ? (colors.gradientPrimary || ['#00D4AA', '#00B894']) : ['#2A3142', '#2A3142']}
                style={styles.actionBtnGradient}
              >
                <Text style={[styles.actionBtnText, { color: selectedDate && selectedSlot ? colors.textInverse : colors.textMuted }]}>
                  {selectedDate && selectedSlot ? 'Confirm Booking Details →' : 'Select Slot to Confirm'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header Banner
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineMedium, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall, marginTop: 2 },

  // Progress Bar
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  progressStep: { alignItems: 'center' },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressNum: { ...typography.labelSmall, fontWeight: '700' },
  progressCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
  progressLabel: { ...typography.labelSmall },
  progressLine: { flex: 1, height: 2, marginHorizontal: spacing.sm, marginBottom: 18, borderRadius: 1 },

  // Doctor Info Card Header
  doctorSummaryCard: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  doctorSummaryRow: { flexDirection: 'row', alignItems: 'center' },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24 },
  doctorAvatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  doctorAvatarInitials: { color: '#fff', fontSize: 16, fontWeight: '800' },
  doctorInfoCard: { flex: 1, marginLeft: spacing.md },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doctorNameText: { ...typography.bodyLarge, fontWeight: '800' },
  verifiedLabelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedLabelText: { fontSize: 9, fontWeight: '700' },
  doctorSpecText: { ...typography.bodySmall, marginTop: 1 },
  feeSummaryBox: { alignItems: 'flex-end' },
  feeValueText: { ...typography.headlineSmall, fontWeight: '800' },
  feeLabelText: { ...typography.labelSmall, marginTop: 1 },

  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 150 },
  stepContent: { paddingTop: spacing.md },
  stepTitle: { ...typography.headlineSmall, fontWeight: '800', marginBottom: spacing.xs },
  stepSubtitle: { ...typography.bodyMedium, marginBottom: spacing.lg },

  // Step 1: Type cards
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  typeIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  typeIcon: { fontSize: 24 },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  typeName: { ...typography.bodyLarge, fontWeight: '700' },
  recTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recTagText: { fontSize: 9, fontWeight: '700' },
  typeDesc: { ...typography.bodySmall, marginBottom: 4 },
  typeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeWait: { ...typography.labelSmall, fontWeight: '700' },
  typeHours: { ...typography.labelSmall },
  checkBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkIcon: { color: '#fff', fontSize: 11, fontWeight: '900' },
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1 },
  infoIcon: { fontSize: 16, marginRight: spacing.sm, marginTop: 1 },
  infoText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  // Step 2: Assessment Grid
  section: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '700' },
  sectionHint: { ...typography.labelSmall },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symptomChip: { borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  symptomText: { ...typography.labelMedium },
  urgencyRow: { flexDirection: 'row', gap: spacing.md },
  urgencyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, paddingVertical: spacing.md },
  urgencyIcon: { fontSize: 16, marginRight: spacing.xs },
  urgencyText: { ...typography.labelMedium },
  reasonInput: { borderRadius: borderRadius.lg, padding: spacing.md, ...typography.bodyMedium, minHeight: 80 },
  charCount: { ...typography.labelSmall, textAlign: 'right', marginTop: 4 },

  // Step 3: Date selection (Horizontal strip ribbon)
  datesContainer: { paddingVertical: spacing.md, paddingRight: spacing.xl, gap: spacing.sm },
  dateCard: { width: 70, height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  dateDay: { ...typography.labelSmall, marginBottom: 2 },
  dateNum: { fontSize: 22, lineHeight: 24 },
  dateMonth: { ...typography.labelSmall, marginTop: 2 },
  todayDot: { position: 'absolute', bottom: 4, backgroundColor: '#00D4AA', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  todayDotText: { color: '#fff', fontSize: 6, fontWeight: '700' },
  closedBadge: { position: 'absolute', bottom: 4, fontSize: 8, fontWeight: '700' },

  // Slot Matrix Styling (Responsive Multi-column Grid)
  slotSection: { marginTop: spacing.md, marginBottom: spacing.lg },
  slotSectionTitle: { ...typography.labelMedium, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md, marginTop: spacing.lg },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotChip: { width: '31%', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  slotChipText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },

  // Queue Status Card
  queueContainer: { marginTop: spacing.xl },
  queueHeaderTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.md },
  queueCard: { borderRadius: borderRadius.xl, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  queueLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  queueLoadingText: { ...typography.bodySmall },
  queueTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  queueTokenLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  queueTokenNum: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  queueWaitBox: { alignItems: 'flex-end' },
  queueWaitLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  queueWaitVal: { fontSize: 16, fontWeight: '800' },
  queueBarWrap: { gap: 6 },
  queueBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  queueBarFill: { height: '100%', borderRadius: 4 },
  queueBarLabel: { fontSize: 10, fontWeight: '600' },

  // Bottom action bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl,
    borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 6,
  },
  actionBtnContainer: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  actionBtnGradient: { paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { ...typography.button, fontWeight: '700' },
  bottomStep3Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  bottomFeeColumn: { justifyContent: 'center' },
  bottomFeeLabelText: { ...typography.labelSmall, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  bottomFeeValueText: { ...typography.headlineMedium, fontWeight: '800', fontSize: 20 },
});

export default SlotSelectionScreen;
