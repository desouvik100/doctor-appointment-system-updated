/**
 * SlotSelectionScreen - Queue-based booking like web app
 * Features: consultation type, date selection, queue info, symptoms, reason
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const SlotSelectionScreen = ({ navigation, route }) => {
  const { doctor } = route.params || {};
  const { user } = useUser();
  
  // Step management (1: Type, 2: Date, 3: Details)
  const [step, setStep] = useState(1);
  
  // Booking data
  const [consultationType, setConsultationType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMember, setSelectedMember] = useState('self');
  const [reason, setReason] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  
  // Queue info
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const doctorId = doctor?._id || doctor?.id;
  const slotDuration = doctor?.consultationDuration || 30;

  // Common symptoms for quick selection
  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain',
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup'
  ];

  // Mock family members - would come from API
  const familyMembers = [
    { id: 'self', name: user?.name || 'Myself', relation: 'Self' },
    { id: 'fm1', name: 'Family Member 1', relation: 'Spouse' },
    { id: 'fm2', name: 'Family Member 2', relation: 'Child' },
  ];

  // Generate next 14 days
  const generateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        full: date.toISOString().split('T')[0],
        isToday: i === 0,
        isSunday: dayOfWeek === 0,
        isAvailable: dayOfWeek !== 0, // Closed on Sundays
      };
    });
  };

  const dates = generateDates();

  // Fetch queue info when date and type are selected
  const fetchQueueInfo = useCallback(async (dateStr) => {
    if (!doctorId || !dateStr || !consultationType) return;
    
    try {
      setQueueLoading(true);
      const typeParam = consultationType === 'online' ? 'online' : 'in_person';
      const response = await apiClient.get(
        `/appointments/queue-info/${doctorId}/${dateStr}?consultationType=${typeParam}`
      );
      
      if (response.data.success) {
        setQueueInfo(response.data);
      } else {
        // Default queue info
        setQueueInfo({
          currentQueueCount: 0,
          nextQueueNumber: 1,
          estimatedTime: consultationType === 'online' ? '08:00' : '09:00',
          maxSlots: consultationType === 'online' ? 15 : 20,
          availableSlots: consultationType === 'online' ? 15 : 20,
        });
      }
    } catch (error) {
      console.log('Queue info fetch error:', error.message);
      // Default queue info on error
      setQueueInfo({
        currentQueueCount: 0,
        nextQueueNumber: 1,
        estimatedTime: consultationType === 'online' ? '08:00' : '09:00',
        maxSlots: consultationType === 'online' ? 15 : 20,
        availableSlots: consultationType === 'online' ? 15 : 20,
      });
    } finally {
      setQueueLoading(false);
    }
  }, [doctorId, consultationType]);

  useEffect(() => {
    if (selectedDate && consultationType) {
      fetchQueueInfo(selectedDate);
    }
  }, [selectedDate, consultationType, fetchQueueInfo]);

  // Calculate estimated time based on queue position
  const calculateEstimatedTime = (queueNumber) => {
    const isVirtual = consultationType === 'online';
    const startHour = isVirtual ? 8 : 9;
    const minutesFromStart = (queueNumber - 1) * slotDuration;
    const hours = Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    
    let estimatedHour = startHour + hours;
    // Skip lunch hour (1 PM - 2 PM) for in-clinic only
    if (!isVirtual && estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    const endHour = isVirtual ? 20 : 19;
    if (estimatedHour >= endHour) {
      return null;
    }
    
    return `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
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
    // Build reason with symptoms
    let fullReason = '';
    if (selectedSymptoms.length > 0) {
      fullReason = `Symptoms: ${selectedSymptoms.join(', ')}.`;
    }
    if (reason.trim()) {
      fullReason = fullReason ? `${fullReason} ${reason.trim()}` : reason.trim();
    }
    if (!fullReason) {
      fullReason = 'General Consultation';
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    const queueNumber = queueInfo?.nextQueueNumber || 1;
    const estimatedTime = calculateEstimatedTime(queueNumber);

    if (!estimatedTime) {
      Alert.alert('No Slots', 'No slots available for this date. Please select another date.');
      return;
    }

    try {
      setBookingInProgress(true);

      const bookingData = {
        userId: user?.id || user?._id,
        doctorId: doctorId,
        clinicId: doctor?.clinicId?._id || doctor?.clinicId || null,
        date: selectedDate,
        queueNumber: queueNumber,
        estimatedTime: estimatedTime,
        reason: fullReason,
        consultationType: consultationType === 'online' ? 'online' : 'in_person',
        urgencyLevel,
        status: 'confirmed',
        paymentStatus: 'pending',
      };

      console.log('Booking data:', bookingData);
      
      const response = await apiClient.post('/appointments/queue-booking', bookingData);
      console.log('Booking response:', response.data);

      const selectedMemberData = familyMembers.find(m => m.id === selectedMember);
      
      // Navigate to payment
      navigation.navigate('Payment', {
        doctor,
        date: selectedDate,
        time: formatTime(estimatedTime),
        queueNumber: response.data.queueNumber || queueNumber,
        consultationType,
        patient: selectedMemberData,
        appointmentId: response.data._id || response.data.id,
        reason: fullReason,
      });
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      Alert.alert('Booking Failed', errorMsg);
    } finally {
      setBookingInProgress(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedDate && consultationType) {
      fetchQueueInfo(selectedDate).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [selectedDate, consultationType, fetchQueueInfo]);

  const getSelectedMemberName = () => {
    const member = familyMembers.find(m => m.id === selectedMember);
    return member?.name || 'Select Patient';
  };

  // Render Step 1: Consultation Type
  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Consultation Type</Text>
      <Text style={styles.stepSubtitle}>Select how you'd like to consult</Text>

      <TouchableOpacity
        style={[styles.typeCard, consultationType === 'in_person' && styles.typeCardActive]}
        onPress={() => handleTypeSelect('in_person')}
      >
        <View style={styles.typeCardContent}>
          <Text style={styles.typeIcon}>🏥</Text>
          <View style={styles.typeInfo}>
            <Text style={styles.typeName}>In-Clinic Visit</Text>
            <Text style={styles.typeDesc}>Physical examination at clinic</Text>
            <Text style={styles.typeHours}>9 AM - 7 PM (Mon-Sat)</Text>
          </View>
        </View>
        {consultationType === 'in_person' && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.typeCard, consultationType === 'online' && styles.typeCardActive]}
        onPress={() => handleTypeSelect('online')}
      >
        <View style={styles.typeCardContent}>
          <Text style={styles.typeIcon}>📹</Text>
          <View style={styles.typeInfo}>
            <Text style={styles.typeName}>Online Consultation</Text>
            <Text style={styles.typeDesc}>Video call from anywhere</Text>
            <Text style={styles.typeHours}>8 AM - 8 PM (Mon-Sat)</Text>
          </View>
        </View>
        {consultationType === 'online' && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.infoNote}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>Separate queues for online & clinic visits</Text>
      </View>
    </View>
  );

  // Render Step 2: Date Selection
  const renderDateSelection = () => (
    <View style={styles.stepContent}>
      {/* Selected Type Banner */}
      <TouchableOpacity style={styles.selectedBanner} onPress={() => setStep(1)}>
        <Text style={styles.bannerIcon}>{consultationType === 'online' ? '📹' : '🏥'}</Text>
        <Text style={styles.bannerText}>
          {consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
        </Text>
        <Text style={styles.changeText}>Change</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Select Date</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesContainer}
      >
        {dates.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateCard,
              !day.isAvailable && styles.dateCardDisabled,
              selectedDate === day.full && styles.dateCardActive,
            ]}
            onPress={() => handleDateSelect(day)}
            disabled={!day.isAvailable}
          >
            {selectedDate === day.full ? (
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.dateCardGradient}
              >
                <Text style={styles.dateDayActive}>{day.day}</Text>
                <Text style={styles.dateNumActive}>{day.date}</Text>
                <Text style={styles.dateMonthActive}>{day.month}</Text>
              </LinearGradient>
            ) : (
              <>
                <Text style={[styles.dateDay, !day.isAvailable && styles.textDisabled]}>{day.day}</Text>
                <Text style={[styles.dateNum, !day.isAvailable && styles.textDisabled]}>{day.date}</Text>
                <Text style={[styles.dateMonth, !day.isAvailable && styles.textDisabled]}>{day.month}</Text>
                {day.isToday && <Text style={styles.todayBadge}>Today</Text>}
                {day.isSunday && <Text style={styles.closedBadge}>Closed</Text>}
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render Step 3: Details & Queue Info
  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      {/* Selected Info Banners */}
      <View style={styles.selectedInfoRow}>
        <TouchableOpacity style={styles.infoBadge} onPress={() => setStep(1)}>
          <Text style={styles.badgeIcon}>{consultationType === 'online' ? '📹' : '🏥'}</Text>
          <Text style={styles.badgeText}>
            {consultationType === 'online' ? 'Online' : 'Clinic'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoBadge} onPress={() => setStep(2)}>
          <Text style={styles.badgeIcon}>📅</Text>
          <Text style={styles.badgeText}>{formatDate(selectedDate).split(',')[0]}</Text>
        </TouchableOpacity>
      </View>

      {/* Queue Info Card */}
      {queueLoading ? (
        <View style={styles.queueLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.queueLoadingText}>Checking queue...</Text>
        </View>
      ) : queueInfo && (
        <Card variant="gradient" style={styles.queueCard}>
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>Queue Status</Text>
            {queueInfo.currentQueueCount === 0 && (
              <View style={styles.queueBadgeEmpty}>
                <Text style={styles.queueBadgeText}>⭐ No Wait!</Text>
              </View>
            )}
          </View>
          
          <View style={styles.queueStats}>
            <View style={styles.queueStat}>
              <Text style={styles.queueStatNum}>{queueInfo.currentQueueCount || 0}</Text>
              <Text style={styles.queueStatLabel}>In Queue</Text>
            </View>
            <View style={[styles.queueStat, styles.queueStatHighlight]}>
              <Text style={styles.queueStatNumHighlight}>#{queueInfo.nextQueueNumber || 1}</Text>
              <Text style={styles.queueStatLabel}>Your Position</Text>
            </View>
            <View style={styles.queueStat}>
              <Text style={styles.queueStatNum}>{queueInfo.availableSlots || 20}</Text>
              <Text style={styles.queueStatLabel}>Slots Left</Text>
            </View>
          </View>

          <View style={styles.estimatedTimeBox}>
            <Text style={styles.estIcon}>{consultationType === 'online' ? '📹' : '⏰'}</Text>
            <View>
              <Text style={styles.estLabel}>
                {consultationType === 'online' ? 'Your Video Call Time' : 'Your Estimated Time'}
              </Text>
              <Text style={styles.estTime}>
                {formatTime(calculateEstimatedTime(queueInfo.nextQueueNumber || 1))}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Patient Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking For</Text>
        <TouchableOpacity 
          style={styles.patientSelector}
          onPress={() => setShowFamilyPicker(!showFamilyPicker)}
        >
          <View style={styles.patientInfo}>
            <Text style={styles.patientIcon}>👤</Text>
            <Text style={styles.patientName}>{getSelectedMemberName()}</Text>
          </View>
          <Text style={styles.dropdownIcon}>{showFamilyPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showFamilyPicker && (
          <Card variant="default" style={styles.familyList}>
            {familyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.familyItem,
                  selectedMember === member.id && styles.familyItemActive,
                ]}
                onPress={() => {
                  setSelectedMember(member.id);
                  setShowFamilyPicker(false);
                }}
              >
                <View style={styles.familyItemInfo}>
                  <Text style={styles.familyItemName}>{member.name}</Text>
                  <Text style={styles.familyItemRelation}>{member.relation}</Text>
                </View>
                {selectedMember === member.id && (
                  <Text style={styles.checkIconSmall}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>

      {/* Quick Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Symptoms (Optional)</Text>
        <View style={styles.symptomsGrid}>
          {commonSymptoms.map((symptom) => (
            <TouchableOpacity
              key={symptom}
              style={[
                styles.symptomChip,
                selectedSymptoms.includes(symptom) && styles.symptomChipActive,
              ]}
              onPress={() => {
                if (selectedSymptoms.includes(symptom)) {
                  setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                } else {
                  setSelectedSymptoms([...selectedSymptoms, symptom]);
                }
              }}
            >
              <Text style={[
                styles.symptomText,
                selectedSymptoms.includes(symptom) && styles.symptomTextActive,
              ]}>
                {symptom}
              </Text>
              {selectedSymptoms.includes(symptom) && (
                <Text style={styles.symptomCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgency Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency Level</Text>
        <View style={styles.urgencyRow}>
          {['normal', 'urgent', 'emergency'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyBtn,
                urgencyLevel === level && styles.urgencyBtnActive,
                level === 'emergency' && styles.urgencyBtnEmergency,
              ]}
              onPress={() => setUrgencyLevel(level)}
            >
              <Text style={styles.urgencyIcon}>
                {level === 'normal' ? '✓' : level === 'urgent' ? '⏰' : '🚨'}
              </Text>
              <Text style={[
                styles.urgencyText,
                urgencyLevel === level && styles.urgencyTextActive,
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reason Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.reasonInput}
          placeholder="Any additional information for the doctor..."
          placeholderTextColor={colors.textMuted}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Book Appointment' : step === 2 ? 'Select Date' : 'Confirm Details'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              step >= s && styles.progressDotActive,
              step > s && styles.progressDotCompleted,
            ]}>
              {step > s ? (
                <Text style={styles.progressCheck}>✓</Text>
              ) : (
                <Text style={[styles.progressNum, step >= s && styles.progressNumActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, step >= s && styles.progressLabelActive]}>
              {s === 1 ? 'Type' : s === 2 ? 'Date' : 'Details'}
            </Text>
          </View>
        ))}
      </View>

      {/* Doctor Info */}
      <Card variant="gradient" style={styles.doctorCard}>
        <View style={styles.doctorRow}>
          <Avatar name={doctor?.name || 'Doctor'} size="medium" />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor?.name}</Text>
            <Text style={styles.specialty}>{doctor?.specialty || doctor?.specialization}</Text>
          </View>
          <View style={styles.feeBox}>
            <Text style={styles.feeLabel}>Fee</Text>
            <Text style={styles.feeValue}>₹{doctor?.fee || doctor?.consultationFee || 500}</Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {step === 1 && renderTypeSelection()}
        {step === 2 && renderDateSelection()}
        {step === 3 && renderDetailsStep()}
      </ScrollView>

      {/* Bottom CTA */}
      {step === 3 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Consultation Fee</Text>
            <Text style={styles.summaryValue}>₹{doctor?.fee || doctor?.consultationFee || 500}</Text>
          </View>
          <Button
            title={bookingInProgress ? 'Booking...' : 'Proceed to Payment'}
            onPress={handleBooking}
            fullWidth
            size="large"
            disabled={!selectedDate || !consultationType || bookingInProgress}
          />
        </View>
      )}

      {bookingInProgress && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Creating your booking...</Text>
        </View>
      )}
    </View>
  );
};
</View>


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  
  // Progress Steps
  progressContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.xl,
  },
  progressItem: { alignItems: 'center' },
  progressDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surfaceBorder,
  },
  progressDotActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  progressDotCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNum: { ...typography.labelMedium, color: colors.textMuted },
  progressNumActive: { color: colors.primary },
  progressCheck: { color: colors.textInverse, fontSize: 14, fontWeight: 'bold' },
  progressLabel: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  progressLabelActive: { color: colors.primary },
  
  // Doctor Card
  doctorCard: { marginHorizontal: spacing.xl, padding: spacing.md, marginBottom: spacing.md },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  specialty: { ...typography.bodySmall, color: colors.textSecondary },
  feeBox: { alignItems: 'flex-end' },
  feeLabel: { ...typography.labelSmall, color: colors.textMuted },
  feeValue: { ...typography.headlineSmall, color: colors.primary },
  
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 180 },
  stepContent: { paddingTop: spacing.md },
  stepTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  stepSubtitle: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.lg },
  
  // Type Selection
  typeCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 2, borderColor: colors.surfaceBorder,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeCardContent: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { fontSize: 32, marginRight: spacing.md },
  typeInfo: { flex: 1 },
  typeName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  typeDesc: { ...typography.bodySmall, color: colors.textSecondary },
  typeHours: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  checkBadge: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { color: colors.textInverse, fontSize: 14, fontWeight: 'bold' },
  infoNote: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md,
  },
  infoIcon: { fontSize: 16, marginRight: spacing.sm },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
  
  // Selected Banner
  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  bannerIcon: { fontSize: 18, marginRight: spacing.sm },
  bannerText: { ...typography.bodyMedium, color: colors.primary, flex: 1 },
  changeText: { ...typography.labelSmall, color: colors.primary },
  
  // Date Selection
  datesContainer: { paddingVertical: spacing.sm },
  dateCard: {
    width: 72, paddingVertical: spacing.lg, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1,
    borderColor: colors.surfaceBorder, marginRight: spacing.md,
  },
  dateCardDisabled: { opacity: 0.5 },
  dateCardActive: { borderWidth: 0, overflow: 'hidden' },
  dateCardGradient: { width: '100%', paddingVertical: spacing.lg, alignItems: 'center' },
  dateDay: { ...typography.labelSmall, color: colors.textMuted, marginBottom: spacing.xs },
  dateDayActive: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
  dateNum: { ...typography.headlineMedium, color: colors.textPrimary },
  dateNumActive: { ...typography.headlineMedium, color: colors.textInverse },
  dateMonth: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  dateMonthActive: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  todayBadge: { ...typography.labelSmall, color: colors.primary, marginTop: spacing.xs },
  closedBadge: { ...typography.labelSmall, color: colors.error, marginTop: spacing.xs },
  textDisabled: { color: colors.textMuted },
  
  // Selected Info Row
  selectedInfoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  badgeIcon: { fontSize: 14, marginRight: spacing.xs },
  badgeText: { ...typography.labelSmall, color: colors.primary },
  
  // Queue Card
  queueCard: { padding: spacing.lg, marginBottom: spacing.lg },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  queueTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  queueBadgeEmpty: { backgroundColor: colors.success, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  queueBadgeText: { ...typography.labelSmall, color: colors.textInverse },
  queueStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  queueStat: { alignItems: 'center' },
  queueStatHighlight: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  queueStatNum: { ...typography.headlineSmall, color: colors.textPrimary },
  queueStatNumHighlight: { ...typography.headlineSmall, color: colors.primary },
  queueStatLabel: { ...typography.labelSmall, color: colors.textMuted },
  estimatedTimeBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md,
  },
  estIcon: { fontSize: 24, marginRight: spacing.md },
  estLabel: { ...typography.labelSmall, color: colors.textMuted },
  estTime: { ...typography.headlineSmall, color: colors.primary },
  queueLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  queueLoadingText: { ...typography.bodyMedium, color: colors.textSecondary, marginLeft: spacing.md },
  
  // Section
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.md },
  
  // Patient Selector
  patientSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  patientIcon: { fontSize: 20, marginRight: spacing.md },
  patientName: { ...typography.bodyLarge, color: colors.textPrimary },
  dropdownIcon: { fontSize: 12, color: colors.textMuted },
  familyList: { marginTop: spacing.md, padding: spacing.sm },
  familyItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: borderRadius.md,
  },
  familyItemActive: { backgroundColor: colors.primaryLight },
  familyItemInfo: {},
  familyItemName: { ...typography.bodyMedium, color: colors.textPrimary },
  familyItemRelation: { ...typography.labelSmall, color: colors.textMuted },
  checkIconSmall: { color: colors.primary, fontSize: 16 },
  
  // Symptoms
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symptomChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  symptomChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  symptomText: { ...typography.labelMedium, color: colors.textSecondary },
  symptomTextActive: { color: colors.primary },
  symptomCheck: { color: colors.primary, fontSize: 12, marginLeft: spacing.xs },
  
  // Urgency
  urgencyRow: { flexDirection: 'row', gap: spacing.md },
  urgencyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  urgencyBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  urgencyBtnEmergency: {},
  urgencyIcon: { fontSize: 16, marginRight: spacing.xs },
  urgencyText: { ...typography.labelMedium, color: colors.textSecondary },
  urgencyTextActive: { color: colors.primary },
  
  // Reason Input
  reasonInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder, ...typography.bodyMedium,
    color: colors.textPrimary, minHeight: 80,
  },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl,
    borderTopWidth: 1, borderTopColor: colors.surfaceBorder, ...shadows.large,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  summaryLabel: { ...typography.bodyLarge, color: colors.textSecondary },
  summaryValue: { ...typography.headlineMedium, color: colors.textPrimary },
  
  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.md },
});

export default SlotSelectionScreen;
