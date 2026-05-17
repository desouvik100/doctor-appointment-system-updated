/**
 * SlotSelectionScreen - Queue-based appointment booking
 * Patient picks type + date, gets added to queue. No time slot selection.
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
import { shadows } from '../../theme/colors';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const SlotSelectionScreen = ({ navigation, route }) => {
  const { doctor } = route.params || {};
  const { user } = useUser();
  const { colors } = useTheme();

  const [step, setStep] = useState(1); // 1=Type, 2=Date, 3=Details
  const [consultationType, setConsultationType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const doctorId = doctor?._id || doctor?.id;

  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain',
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup',
  ];

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
    if (selectedDate && consultationType) fetchQueueInfo(selectedDate);
  }, [selectedDate, consultationType, fetchQueueInfo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const handleTypeSelect = (type) => {
    setConsultationType(type);
    setSelectedDate(null);
    setQueueInfo(null);
    setStep(2);
  };

  const handleDateSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.full);
    setStep(3);
  };

  const handleBooking = async () => {
    try {
      let fullReason = selectedSymptoms.length > 0
        ? `Symptoms: ${selectedSymptoms.join(', ')}.` : '';
      if (reason.trim()) fullReason = fullReason ? `${fullReason} ${reason.trim()}` : reason.trim();
      if (!fullReason) fullReason = 'General Consultation';

      if (!user) { Alert.alert('Login Required', 'Please login to book an appointment'); return; }
      const userId = user.id || user._id || user.userId;
      if (!userId) { Alert.alert('Error', 'User session invalid. Please login again.'); return; }
      if (!doctorId) { Alert.alert('Error', 'Doctor information missing.'); return; }

      const clinicId = doctor?.clinicId?._id || doctor?.clinicId || null;

      setBookingInProgress(true);

      // Navigate to Payment — appointment is created AFTER successful payment
      navigation.navigate('Payment', {
        doctor: doctor || {},
        date: selectedDate,
        time: queueInfo?.estimatedTime || '09:00',
        queueNumber: queueInfo?.nextQueueNumber || 1,
        consultationType: consultationType || 'in_person',
        patient: { id: 'self', name: user?.name || 'Patient', relation: 'Self' },
        // Pass booking params so PaymentScreen can create the appointment after payment
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
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to proceed.';
      Alert.alert('Error', msg);
    } finally {
      setBookingInProgress(false);
    }
  };

  // Animated scale refs for type cards
  const scaleIn  = useRef(new Animated.Value(1)).current;
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
      title: 'In-Clinic Visit',
      desc: 'Physical examination at the clinic',
      tag: null,
      wait: 'Avg wait: 20 min',
      hours: 'Mon–Sat · 9 AM – 7 PM',
      gradient: ['#00897B', '#26A69A'],
      scaleRef: scaleIn,
    },
    {
      key: 'online',
      icon: '💻',
      title: 'Online Consultation',
      desc: 'Consult via video call from home',
      tag: 'Recommended',
      wait: 'Connect instantly',
      hours: 'Mon–Sat · 8 AM – 8 PM',
      gradient: ['#1565C0', '#1976D2'],
      scaleRef: scaleOut,
    },
  ];

  // Step 1: Consultation Type
  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Choose Consultation Type</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Select how you'd like to consult with the doctor
      </Text>

      {CONSULT_TYPES.map(({ key, icon, title, desc, tag, wait, hours, gradient, scaleRef }) => {
        const active = consultationType === key;
        return (
          <Animated.View key={key} style={{ transform: [{ scale: scaleRef }] }}>
            <TouchableOpacity
              style={[styles.typeCard,
                active
                  ? { borderColor: gradient[0], borderWidth: 2, overflow: 'hidden' }
                  : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1.5 },
              ]}
              onPress={() => { animateSelect(scaleRef); handleTypeSelect(key); }}
              activeOpacity={1}
            >
              {active && (
                <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
              )}
              <View style={[styles.typeIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : (key === 'online' ? '#EFF6FF' : '#F0FDF4') }]}>
                <Text style={styles.typeIcon}>{icon}</Text>
              </View>
              <View style={styles.typeInfo}>
                <View style={styles.typeNameRow}>
                  <Text style={[styles.typeName, { color: active ? '#fff' : colors.textPrimary }]}>{title}</Text>
                  {tag ? (
                    <View style={[styles.recTag, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#DCFCE7' }]}>
                      <Text style={[styles.recTagText, { color: active ? '#fff' : '#16A34A' }]}>{tag}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.typeDesc, { color: active ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>{desc}</Text>
                <View style={styles.typeMetaRow}>
                  <Text style={[styles.typeWait, { color: active ? 'rgba(255,255,255,0.7)' : colors.primary }]}>⚡ {wait}</Text>
                  <Text style={[styles.typeHours, { color: active ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>{hours}</Text>
                </View>
              </View>
              {active ? (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <View style={[styles.infoNote, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, { color: '#92400E' }]}>
          No need to select a time slot. You'll be automatically added to the doctor's queue.
        </Text>
      </View>
    </View>
  );

  // Step 2: Date Selection
  const renderDateSelection = () => (
    <View style={styles.stepContent}>
      {/* Consultation type banner — clearly labelled with Change */}
      <View style={[styles.typeBanner, { backgroundColor: colors.surface }]}>
        <View style={styles.typeBannerLeft}>
          <Text style={styles.typeBannerLabel}>Consultation Type</Text>
          <View style={styles.typeBannerValue}>
            <Text style={styles.typeBannerIcon}>{consultationType === 'online' ? '💻' : '🏥'}</Text>
            <Text style={[styles.typeBannerText, { color: colors.textPrimary }]}>
              {consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.changePill}>
          <Text style={styles.changePillText}>Change</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Select a Date</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Pick your preferred appointment date
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
        {dates.map((day, index) => {
          const isSelected = selectedDate === day.full;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDateSelect(day)}
              disabled={day.isSunday}
              activeOpacity={0.8}
              style={[
                styles.dateCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                day.isSunday && { opacity: 0.35 },
                isSelected && { borderColor: '#00897B', borderWidth: 2, backgroundColor: '#F0FDF4' },
              ]}
            >
              {isSelected ? (
                <>
                  <LinearGradient colors={['#00897B', '#26A69A']} style={styles.dateCardGradient}>
                    <Text style={styles.dateDayActive}>{day.day}</Text>
                    <Text style={styles.dateNumActive}>{day.date}</Text>
                    <Text style={styles.dateMonthActive}>{day.month}</Text>
                    <View style={styles.dateCheckDot}>
                      <Text style={styles.dateCheckIcon}>✓</Text>
                    </View>
                  </LinearGradient>
                </>
              ) : (
                <>
                  <Text style={[styles.dateDay, { color: colors.textMuted }]}>{day.day}</Text>
                  <Text style={[styles.dateNum, { color: colors.textPrimary }]}>{day.date}</Text>
                  <Text style={[styles.dateMonth, { color: colors.textMuted }]}>{day.month}</Text>
                  {day.isToday ? (
                    <View style={styles.todayDot}>
                      <Text style={styles.todayDotText}>Today</Text>
                    </View>
                  ) : null}
                  {day.isSunday ? (
                    <Text style={[styles.closedBadge, { color: '#EF4444' }]}>Closed</Text>
                  ) : null}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDate ? (
        <View style={[styles.selectedDateConfirm, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
          <Text style={styles.selectedDateIcon}>📅</Text>
          <Text style={[styles.selectedDateText, { color: '#166534' }]}>{formatDate(selectedDate)}</Text>
        </View>
      ) : null}
    </View>
  );

  // Step 3: Details & Queue Info
  const renderDetailsStep = () => {
    const fee = doctor?.consultationFee || doctor?.fee || 500;
    const queueNum = queueInfo?.nextQueueNumber || 1;
    const queueCount = queueInfo?.currentQueueCount || 0;
    const maxSlots = queueInfo?.maxSlots || 20;
    const queueProgress = Math.min(queueCount / maxSlots, 1);

    const URGENCY_CONFIG = {
      normal:    { icon: '🟢', label: 'Normal',    color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
      urgent:    { icon: '🟡', label: 'Urgent',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      emergency: { icon: '🔴', label: 'Emergency', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    };

    return (
      <View style={styles.stepContent}>
        {/* Selection badges */}
        <View style={styles.selectedInfoRow}>
          <TouchableOpacity style={[styles.infoBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]} onPress={() => setStep(1)}>
            <Text style={styles.badgeIcon}>{consultationType === 'online' ? '💻' : '🏥'}</Text>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {consultationType === 'online' ? 'Online' : 'Clinic'}
            </Text>
            <Text style={[styles.badgeChange, { color: colors.primary }]}>  ✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoBadge, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]} onPress={() => setStep(2)}>
            <Text style={styles.badgeIcon}>📅</Text>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{formatDate(selectedDate).split(',')[0]}</Text>
            <Text style={[styles.badgeChange, { color: colors.primary }]}>  ✎</Text>
          </TouchableOpacity>
        </View>

        {/* ── Queue Status — human readable ── */}
        <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={[styles.queueCard, { borderColor: '#86EFAC' }]}>
          {queueLoading ? (
            <View style={styles.queueLoadingRow}>
              <ActivityIndicator size="small" color="#00897B" />
              <Text style={[styles.queueLoadingText, { color: '#166534' }]}>  Checking queue...</Text>
            </View>
          ) : (
            <>
              <View style={styles.queueTopRow}>
                <View>
                  <Text style={styles.queueTokenLabel}>Your Queue Token</Text>
                  <Text style={styles.queueTokenNum}>#{queueNum}</Text>
                </View>
                <View style={styles.queueWaitBox}>
                  <Text style={styles.queueWaitLabel}>⏱ Est. wait</Text>
                  <Text style={styles.queueWaitVal}>
                    {queueInfo?.estimatedTime || `~${queueNum * 10} min`}
                  </Text>
                </View>
              </View>
              {/* Progress bar */}
              <View style={styles.queueBarWrap}>
                <View style={[styles.queueBarTrack, { backgroundColor: '#BBF7D0' }]}>
                  <View style={[styles.queueBarFill, { width: `${queueProgress * 100}%` }]} />
                </View>
                <Text style={styles.queueBarLabel}>{queueCount} of {maxSlots} slots filled</Text>
              </View>
            </>
          )}
        </LinearGradient>

        {/* ── Appointment Summary ── */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Appointment Summary</Text>
          {[
            { icon: '📅', label: 'Date',   value: formatDate(selectedDate) },
            { icon: consultationType === 'online' ? '💻' : '🏥', label: 'Type', value: consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit' },
            { icon: '👨‍⚕️', label: 'Doctor', value: `Dr. ${doctor?.name || 'Doctor'}` },
            { icon: '💰', label: 'Fee',    value: `₹${fee}` },
          ].map(({ icon, label, value }) => (
            <View key={label} style={[styles.summaryRow, { borderBottomColor: colors.surfaceBorder }]}>
              <View style={styles.summaryLabelRow}>
                <Text style={styles.summaryRowIcon}>{icon}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Symptoms ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Symptoms</Text>
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
                  style={[styles.symptomChip,
                    active
                      ? { backgroundColor: '#00897B', borderColor: '#00897B' }
                      : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    maxReached && { opacity: 0.4 },
                  ]}
                  onPress={() => setSelectedSymptoms(prev =>
                    prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
                  )}
                >
                  <Text style={[styles.symptomText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {symptom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Urgency Level ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Urgency Level</Text>
          <View style={styles.urgencyRow}>
            {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => {
              const active = urgencyLevel === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.urgencyBtn,
                    active
                      ? { backgroundColor: cfg.bg, borderColor: cfg.border, borderWidth: 2 }
                      : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
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
          {urgencyLevel === 'emergency' ? (
            <Text style={styles.urgencyHint}>🚨 Emergency cases will be prioritized in the queue</Text>
          ) : null}
        </View>

        {/* ── Additional Notes ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Additional Details</Text>
          <TextInput
            style={[styles.reasonInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
            placeholder="Describe your symptoms briefly (optional)"
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={(t) => t.length <= 300 && setReason(t)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{reason.length}/300</Text>
        </View>

        {/* ── Payment trust line ── */}
        <View style={[styles.trustRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={styles.trustIcon}>🔒</Text>
          <View style={styles.trustInfo}>
            <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>100% Secure Payment</Text>
            <Text style={[styles.trustSub, { color: colors.textMuted }]}>Consultation fee: ₹{fee} · Taxes: ₹0</Text>
          </View>
        </View>
      </View>
    );
  };

  const insets = useSafeAreaInsets();

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero Header ── */}
      <LinearGradient colors={['#00897B', '#26A69A']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Book Appointment' : step === 2 ? 'Select Date' : 'Confirm Details'}
          </Text>
          <Text style={styles.headerSub}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* ── Progress Bar ── */}
      <View style={[styles.progressWrap, { backgroundColor: colors.backgroundCard }]}>
        {['Type', 'Date', 'Details'].map((label, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <React.Fragment key={s}>
              <View style={styles.progressStep}>
                <View style={[styles.progressDot,
                  done  && { backgroundColor: '#00897B', borderColor: '#00897B' },
                  active && { backgroundColor: '#fff', borderColor: '#00897B' },
                  !done && !active && { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}>
                  {done
                    ? <Text style={styles.progressCheck}>✓</Text>
                    : <Text style={[styles.progressNum, { color: active ? '#00897B' : colors.textMuted }]}>{s}</Text>
                  }
                </View>
                <Text style={[styles.progressLabel,
                  { color: (done || active) ? '#00897B' : colors.textMuted },
                  active && { fontWeight: '700' },
                ]}>{label}</Text>
              </View>
              {i < 2 ? (
                <View style={[styles.progressLine, { backgroundColor: step > s ? '#00897B' : colors.surfaceBorder }]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Doctor Card ── */}
      <View style={[styles.doctorCard, { backgroundColor: colors.surface }]}>
        <View style={styles.doctorRow}>
          {doctor?.profilePhoto ? (
            <Image source={{ uri: doctor.profilePhoto }} style={styles.doctorAvatar} />
          ) : (
            <LinearGradient colors={['#00897B', '#26A69A']} style={styles.doctorAvatarFallback}>
              <Text style={styles.doctorAvatarInitials}>
                {(doctor?.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.doctorInfo}>
            <View style={styles.doctorNameRow}>
              <Text style={[styles.doctorName, { color: colors.textPrimary }]}>Dr. {doctor?.name || 'Doctor'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✔ Verified</Text>
              </View>
            </View>
            <Text style={[styles.doctorSpec, { color: colors.textSecondary }]}>
              {doctor?.specialization || doctor?.specialty || 'Specialist'}
            </Text>
            <View style={styles.doctorMetaRow}>
              <Text style={[styles.doctorQual, { color: colors.textMuted }]}>
                {doctor?.qualification || 'MBBS'} · {doctor?.experience || 0} yrs
              </Text>
              {doctor?.rating ? (
                <Text style={styles.doctorRating}>⭐ {Number(doctor.rating).toFixed(1)}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.feeBox}>
            <Text style={[styles.feeValue, { color: '#00897B' }]}>₹{doctor?.consultationFee || doctor?.fee || 500}</Text>
            <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Consult fee</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderTypeSelection()}
        {step === 2 && renderDateSelection()}
        {step === 3 && renderDetailsStep()}
      </ScrollView>

      {/* Bottom CTA - step 1: Continue after type selection */}
      {step === 1 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            onPress={() => consultationType ? setStep(2) : null}
            activeOpacity={consultationType ? 0.85 : 1}
          >
            <LinearGradient
              colors={consultationType ? ['#00897B', '#26A69A'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.bookBtnGradient}
            >
              <Text style={styles.bookBtnText}>
                {consultationType ? 'Continue →' : 'Select a consultation type'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom CTA - step 2: Continue after date selection */}
      {step === 2 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            onPress={() => selectedDate ? setStep(3) : null}
            activeOpacity={selectedDate ? 0.85 : 1}
          >
            <LinearGradient
              colors={selectedDate ? ['#00897B', '#26A69A'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.bookBtnGradient}
            >
              <Text style={styles.bookBtnText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom CTA - step 3: Proceed to payment */}
      {step === 3 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.surfaceBorder }]}>
          <View style={styles.bottomFeeRow}>
            <Text style={[styles.bottomFeeLabel, { color: colors.textSecondary }]}>Consultation Fee</Text>
            <Text style={[styles.bottomFeeValue, { color: colors.textPrimary }]}>
              ₹{doctor?.consultationFee || doctor?.fee || 500}
            </Text>
          </View>
          <TouchableOpacity
            style={{ opacity: bookingInProgress ? 0.7 : 1 }}
            onPress={handleBooking}
            disabled={bookingInProgress}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#00897B', '#26A69A']} style={styles.bookBtnGradient}>
              {bookingInProgress
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.bookBtnText}>Proceed to Payment →</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineMedium, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall, marginTop: 2 },

  // Progress bar
  progressWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  progressStep: { alignItems: 'center' },
  progressDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 4 },
  progressNum: { ...typography.labelSmall, fontWeight: '700' },
  progressCheck: { color: '#fff', fontSize: 13, fontWeight: '800' },
  progressLabel: { ...typography.labelSmall, fontWeight: '500' },
  progressLine: { flex: 1, height: 2, marginHorizontal: spacing.sm, marginBottom: 18, borderRadius: 1 },

  // Doctor card
  doctorCard: {
    marginHorizontal: spacing.xl, borderRadius: borderRadius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28 },
  doctorAvatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  doctorAvatarInitials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  doctorName: { ...typography.bodyLarge, fontWeight: '800' },
  verifiedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { color: '#16A34A', fontSize: 10, fontWeight: '700' },
  doctorSpec: { ...typography.bodySmall, marginTop: 2 },
  doctorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  doctorQual: { ...typography.labelSmall },
  doctorRating: { color: '#F59E0B', ...typography.labelSmall, fontWeight: '700' },
  feeBox: { alignItems: 'flex-end' },
  feeValue: { ...typography.headlineSmall, fontWeight: '800' },
  feeLabel: { ...typography.labelSmall, marginTop: 2 },

  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 180 },
  stepContent: { paddingTop: spacing.md },
  stepTitle: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.xs },
  stepSubtitle: { ...typography.bodyMedium, marginBottom: spacing.lg },

  // Consultation type cards
  typeCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.md, overflow: 'hidden',
  },
  typeIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  typeIcon: { fontSize: 26 },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 3 },
  typeName: { ...typography.bodyLarge, fontWeight: '700' },
  recTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  recTagText: { fontSize: 10, fontWeight: '700' },
  typeDesc: { ...typography.bodySmall, marginBottom: 4 },
  typeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeWait: { ...typography.labelSmall, fontWeight: '600' },
  typeHours: { ...typography.labelSmall },
  checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: '800' },
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1 },
  infoIcon: { fontSize: 16, marginRight: spacing.sm, marginTop: 1 },
  infoText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  selectedBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  bannerIcon: { fontSize: 18, marginRight: spacing.sm },
  bannerText: { ...typography.bodyMedium, flex: 1 },
  changeText: { ...typography.labelSmall },

  datesContainer: { paddingVertical: spacing.sm, paddingRight: spacing.xl },
  dateCard: { width: 72, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, marginRight: spacing.md },
  dateCardActive: { borderWidth: 0, overflow: 'hidden' },
  dateCardGradient: { width: '100%', paddingVertical: spacing.lg, alignItems: 'center' },
  dateDay: { ...typography.labelSmall, marginBottom: spacing.xs },
  dateDayActive: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
  dateNum: { ...typography.headlineMedium },
  dateNumActive: { ...typography.headlineMedium, color: '#fff' },
  dateMonth: { ...typography.labelSmall, marginTop: spacing.xs },
  dateMonthActive: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  todayBadge: { ...typography.labelSmall, marginTop: spacing.xs },
  closedBadge: { ...typography.labelSmall, marginTop: spacing.xs },

  selectedInfoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  infoBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  badgeIcon: { fontSize: 14, marginRight: spacing.xs },
  badgeText: { ...typography.labelSmall },

  queueCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1 },
  queueLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  queueLoadingText: { ...typography.bodySmall },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  queueTitle: { ...typography.bodyLarge, fontWeight: '600' },
  queueBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  queueBadgeText: { ...typography.labelSmall, color: '#fff' },
  queueStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  queueStat: { alignItems: 'center' },
  queueStatHighlight: { alignItems: 'center', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  queueStatNum: { ...typography.headlineSmall },
  queueStatNumHighlight: { ...typography.headlineSmall },
  queueStatLabel: { ...typography.labelSmall, marginTop: 2 },
  estimatedTimeBox: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, padding: spacing.md },
  estIcon: { fontSize: 22, marginRight: spacing.md },
  estLabel: { ...typography.labelSmall },
  estTime: { ...typography.headlineSmall, fontWeight: '700' },

  summaryCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1 },
  summaryTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  summaryLabel: { ...typography.bodyMedium },
  summaryValue: { ...typography.bodyMedium, fontWeight: '500', flex: 1, textAlign: 'right' },

  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symptomChip: { borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1 },
  symptomText: { ...typography.labelMedium },

  urgencyRow: { flexDirection: 'row', gap: spacing.md },
  urgencyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1 },
  urgencyIcon: { fontSize: 16, marginRight: spacing.xs },
  urgencyText: { ...typography.labelMedium },

  reasonInput: { borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, ...typography.bodyMedium, minHeight: 80 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl,
    borderTopWidth: 1, ...shadows.large,
  },
  bottomFeeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  bottomFeeLabel: { ...typography.bodyLarge },
  bottomFeeValue: { ...typography.headlineMedium, fontWeight: '700' },
  bookBtnGradient: { borderRadius: borderRadius.lg, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },

  // Type banner (step 2)
  typeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#E5E7EB' },
  typeBannerLeft: { flex: 1 },
  typeBannerLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  typeBannerValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBannerIcon: { fontSize: 16 },
  typeBannerText: { ...typography.bodyMedium, fontWeight: '600' },
  changePill: { backgroundColor: '#F0FDF4', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: '#86EFAC' },
  changePillText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },

  // Date card extras
  todayDot: { marginTop: 4, backgroundColor: '#00897B', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  todayDotText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  dateCheckDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  dateCheckIcon: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Selected date confirm row
  selectedDateConfirm: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1 },
  selectedDateIcon: { fontSize: 18, marginRight: spacing.sm },
  selectedDateText: { ...typography.bodyMedium, fontWeight: '600', flex: 1 },

  // Badge change icon
  badgeChange: { fontSize: 12, marginLeft: 2 },

  // Queue redesign
  queueTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  queueTokenLabel: { fontSize: 11, color: '#166534', fontWeight: '600', marginBottom: 2 },
  queueTokenNum: { fontSize: 32, fontWeight: '900', color: '#00897B', lineHeight: 36 },
  queueWaitBox: { alignItems: 'flex-end' },
  queueWaitLabel: { fontSize: 11, color: '#166534', fontWeight: '600', marginBottom: 2 },
  queueWaitVal: { fontSize: 16, fontWeight: '800', color: '#00897B' },
  queueBarWrap: { gap: 6 },
  queueBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  queueBarFill: { height: '100%', backgroundColor: '#00897B', borderRadius: 4 },
  queueBarLabel: { fontSize: 11, color: '#166534', fontWeight: '500' },

  // Summary icon row
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryRowIcon: { fontSize: 14 },

  // Section header row
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionHint: { ...typography.labelSmall },

  // Urgency hint
  urgencyHint: { marginTop: spacing.sm, fontSize: 12, color: '#DC2626', fontWeight: '500' },

  // Char count
  charCount: { ...typography.labelSmall, textAlign: 'right', marginTop: 4 },

  // Trust row
  trustRow: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, marginBottom: spacing.md },
  trustIcon: { fontSize: 22, marginRight: spacing.md },
  trustInfo: { flex: 1 },
  trustTitle: { ...typography.bodyMedium, fontWeight: '700' },
  trustSub: { ...typography.labelSmall, marginTop: 2 },
});

export default SlotSelectionScreen;
