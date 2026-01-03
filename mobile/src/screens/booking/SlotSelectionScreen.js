/**
 * SlotSelectionScreen - Real API-based booking like web app
 * Features: consultation type, date selection, real slot availability, symptoms, reason
 * Uses same backend APIs as web: /doctors/:id/available-slots, /appointments/check-availability
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
  
  // Step management (1: Type, 2: Date, 3: Time, 4: Details)
  const [step, setStep] = useState(1);
  
  // Booking data
  const [consultationType, setConsultationType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedMember, setSelectedMember] = useState('self');
  const [reason, setReason] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  
  // Real API data
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayAvailable, setDayAvailable] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // Queue info (for queue-based booking)
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState(null);

  const doctorId = doctor?._id || doctor?.id;
  const slotDuration = doctor?.consultationDuration || 30;

  // Common symptoms for quick selection
  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain',
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup'
  ];

  // Initialize family members with self (family wallet is optional feature)
  useEffect(() => {
    // For now, just use self as the booking patient
    // Family wallet integration can be added later if needed
    setFamilyMembers([
      { id: 'self', name: user?.name || 'Myself', relation: 'Self' }
    ]);
  }, [user]);

  // Generate next 14 days for date selection
  const generateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Format date as YYYY-MM-DD in local timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fullDate = `${year}-${month}-${day}`;
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        full: fullDate,
        isToday: i === 0,
        isSunday: dayOfWeek === 0,
        // Will be updated by API - for now assume available except Sundays
        isAvailable: true,
      };
    });
  };

  const dates = generateDates();

  // Fetch available slots from API when date and type are selected (same as web)
  const fetchAvailableSlots = useCallback(async (dateStr) => {
    if (!doctorId || !dateStr) return;
    
    try {
      setSlotsLoading(true);
      setAvailableSlots([]);
      setSelectedTime(null);
      setSlotAvailability(null);
      
      // Call same API as web: GET /api/doctors/:id/available-slots?date=
      const response = await apiClient.get(`/doctors/${doctorId}/available-slots?date=${dateStr}`);
      
      if (response.data.success) {
        if (response.data.available) {
          setDayAvailable(true);
          // Filter slots by consultation type if needed
          let slots = response.data.slots || [];
          if (consultationType === 'online') {
            slots = slots.filter(s => s.type === 'virtual' || s.type === 'both');
          } else if (consultationType === 'in_person') {
            slots = slots.filter(s => s.type === 'in-clinic' || s.type === 'both');
          }
          // If API returns empty slots, generate defaults
          if (slots.length === 0) {
            slots = generateDefaultSlots();
          }
          setAvailableSlots(slots);
        } else {
          setDayAvailable(false);
          setUnavailableReason(response.data.reason || 'Doctor not available on this date');
          setAvailableSlots([]);
        }
      } else {
        // Fallback - generate default slots
        setDayAvailable(true);
        setAvailableSlots(generateDefaultSlots());
      }
      
      // Also fetch booked times for this date
      await fetchBookedTimes(dateStr);
      
    } catch (error) {
      console.log('Available slots fetch error:', error.message);
      // Fallback to default slots on error
      setDayAvailable(true);
      const defaultSlots = generateDefaultSlots();
      setAvailableSlots(defaultSlots);
      console.log('Generated default slots:', defaultSlots.length);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, consultationType]);

  // Fetch booked times (same as web)
  const fetchBookedTimes = async (dateStr) => {
    try {
      const response = await apiClient.get(`/appointments/booked-times/${doctorId}/${dateStr}`);
      setBookedTimes(response.data.bookedTimes || []);
    } catch (error) {
      console.log('Booked times fetch error:', error.message);
      setBookedTimes([]);
    }
  };

  // Generate default time slots (fallback)
  const generateDefaultSlots = () => {
    const slots = [];
    const isVirtual = consultationType === 'online';
    const startHour = isVirtual ? 8 : 9;
    const endHour = isVirtual ? 20 : 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip lunch hour for in-clinic
      if (!isVirtual && hour === 13) continue;
      
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          available: true,
          type: isVirtual ? 'virtual' : 'in-clinic'
        });
      }
    }
    return slots;
  };

  // Check time availability (same as web: POST /api/appointments/check-availability)
  const checkTimeAvailability = async (time) => {
    if (!time || !selectedDate || !doctorId) {
      setSlotAvailability(null);
      return;
    }
    
    try {
      setCheckingAvailability(true);
      const response = await apiClient.post('/appointments/check-availability', {
        doctorId,
        date: selectedDate,
        time
      });
      setSlotAvailability(response.data);
    } catch (error) {
      console.log('Availability check error:', error.message);
      setSlotAvailability({ available: false, message: 'Error checking availability' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Fetch queue info when date and type are selected (for queue-based booking)
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
        setQueueInfo(null);
      }
    } catch (error) {
      console.log('Queue info fetch error:', error.message);
      setQueueInfo(null);
    } finally {
      setQueueLoading(false);
    }
  }, [doctorId, consultationType]);

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate && consultationType) {
      fetchAvailableSlots(selectedDate);
      fetchQueueInfo(selectedDate);
    }
  }, [selectedDate, consultationType, fetchAvailableSlots, fetchQueueInfo]);

  // Check availability when time is selected
  useEffect(() => {
    if (selectedTime && selectedDate) {
      checkTimeAvailability(selectedTime);
    }
  }, [selectedTime, selectedDate]);

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
    setSelectedTime(null);
    setAvailableSlots([]);
    setQueueInfo(null);
    setSlotAvailability(null);
    setStep(2);
  };

  const handleDateSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.full);
    setSelectedTime(null);
    setSlotAvailability(null);
    setStep(3);
  };

  const handleTimeSelect = (slot) => {
    if (slot.booked || !slot.available) return;
    setSelectedTime(slot.time);
  };

  const handleBooking = async () => {
    try {
      // Build reason with symptoms
      let fullReason = '';
      if (selectedSymptoms && selectedSymptoms.length > 0) {
        fullReason = `Symptoms: ${selectedSymptoms.join(', ')}.`;
      }
      if (reason && reason.trim()) {
        fullReason = fullReason ? `${fullReason} ${reason.trim()}` : reason.trim();
      }
      if (!fullReason) {
        fullReason = 'General Consultation';
      }

      if (!selectedDate) {
        Alert.alert('Error', 'Please select a date');
        return;
      }

      if (!selectedTime) {
        Alert.alert('Error', 'Please select a time slot');
        return;
      }

      // Check if user is logged in
      if (!user) {
        Alert.alert('Login Required', 'Please login to book an appointment');
        return;
      }

      // Get user ID - handle different possible structures
      const userId = user.id || user._id || user.userId;
      if (!userId) {
        console.log('User object:', JSON.stringify(user));
        Alert.alert('Error', 'User session invalid. Please login again.');
        return;
      }

      // Check if slot is still available
      if (slotAvailability && slotAvailability.available === false) {
        Alert.alert('Slot Unavailable', 'This time slot is no longer available. Please select another time.');
        return;
      }

      setBookingInProgress(true);

      // Get doctor ID safely
      const docId = doctorId || doctor?._id || doctor?.id;
      if (!docId) {
        Alert.alert('Error', 'Doctor information missing. Please go back and try again.');
        setBookingInProgress(false);
        return;
      }

      // Use same API as web: POST /api/appointments
      const bookingData = {
        userId: userId,
        doctorId: docId,
        clinicId: doctor?.clinicId?._id || doctor?.clinicId || null,
        date: selectedDate,
        time: selectedTime,
        reason: fullReason,
        consultationType: consultationType === 'online' ? 'online' : 'in_person',
        urgencyLevel: urgencyLevel || 'normal',
        source: 'MOBILE',
      };

      console.log('Booking data:', JSON.stringify(bookingData));
      
      // Create appointment using same endpoint as web
      const response = await apiClient.post('/appointments', bookingData);
      console.log('Booking response:', JSON.stringify(response.data));

      // Get selected member data safely
      const selectedMemberData = familyMembers && familyMembers.length > 0 
        ? familyMembers.find(m => m.id === selectedMember) 
        : { id: 'self', name: user?.name || 'Patient', relation: 'Self' };
      
      // Get appointment ID from response
      const appointmentId = response.data?._id || response.data?.id || response.data?.appointmentId;
      
      // Navigate to payment
      navigation.navigate('Payment', {
        doctor: doctor || {},
        date: selectedDate,
        time: formatTime(selectedTime),
        queueNumber: queueInfo?.nextQueueNumber,
        consultationType: consultationType || 'in_person',
        patient: selectedMemberData,
        appointmentId: appointmentId,
        reason: fullReason,
      });
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to book appointment. Please try again.';
      Alert.alert('Booking Failed', errorMsg);
    } finally {
      setBookingInProgress(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedDate && consultationType) {
      Promise.all([
        fetchAvailableSlots(selectedDate),
        fetchQueueInfo(selectedDate)
      ]).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [selectedDate, consultationType, fetchAvailableSlots, fetchQueueInfo]);

  // Get time slots with booked status merged
  const getTimeSlots = () => {
    return availableSlots.map(slot => ({
      ...slot,
      booked: bookedTimes.includes(slot.time) || !slot.available,
      label: formatTime(slot.time),
    }));
  };

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
      <Text style={styles.stepSubtitle}>Choose your preferred appointment date</Text>
      
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
              day.isSunday && styles.dateCardDisabled,
              selectedDate === day.full && styles.dateCardActive,
            ]}
            onPress={() => handleDateSelect(day)}
            disabled={day.isSunday}
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
                <Text style={[styles.dateDay, day.isSunday && styles.textDisabled]}>{day.day}</Text>
                <Text style={[styles.dateNum, day.isSunday && styles.textDisabled]}>{day.date}</Text>
                <Text style={[styles.dateMonth, day.isSunday && styles.textDisabled]}>{day.month}</Text>
                {day.isToday && <Text style={styles.todayBadge}>Today</Text>}
                {day.isSunday && <Text style={styles.closedBadge}>Closed</Text>}
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render Step 3: Time Selection (Real API slots with Queue Info)
  const renderTimeSelection = () => {
    const timeSlots = getTimeSlots();
    
    // If no slots and not loading, generate defaults
    const displaySlots = timeSlots.length > 0 ? timeSlots : 
      (slotsLoading ? [] : generateDefaultSlots().map(slot => ({
        ...slot,
        booked: bookedTimes.includes(slot.time) || !slot.available,
        label: formatTime(slot.time),
      })));
    
    return (
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

        {/* Queue Status Card */}
        {queueLoading ? (
          <View style={styles.queueLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.queueLoadingText}>Loading queue status...</Text>
          </View>
        ) : queueInfo && (
          <Card variant="gradient" style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>🎫 Live Queue Status</Text>
              {queueInfo.availableSlots > 0 ? (
                <View style={styles.queueBadgeAvailable}>
                  <Text style={styles.queueBadgeText}>{queueInfo.availableSlots} slots left</Text>
                </View>
              ) : (
                <View style={styles.queueBadgeFull}>
                  <Text style={styles.queueBadgeText}>Queue Full</Text>
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
                <Text style={styles.queueStatLabel}>Your Token</Text>
              </View>
              <View style={styles.queueStat}>
                <Text style={styles.queueStatNum}>{queueInfo.maxSlots || 20}</Text>
                <Text style={styles.queueStatLabel}>Max Slots</Text>
              </View>
            </View>

            {queueInfo.estimatedTime && (
              <View style={styles.estimatedTimeBox}>
                <Text style={styles.estIcon}>⏰</Text>
                <View>
                  <Text style={styles.estLabel}>Estimated Appointment Time</Text>
                  <Text style={styles.estTime}>{formatTime(queueInfo.estimatedTime)}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <Text style={styles.stepTitle}>Select Time Slot</Text>
        <Text style={styles.stepSubtitle}>Choose an available time or use queue system</Text>

        {slotsLoading ? (
          <View style={styles.slotsLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.slotsLoadingText}>Loading available slots...</Text>
          </View>
        ) : !dayAvailable ? (
          <Card variant="default" style={styles.unavailableCard}>
            <Text style={styles.unavailableIcon}>📅</Text>
            <Text style={styles.unavailableTitle}>Not Available</Text>
            <Text style={styles.unavailableText}>{unavailableReason}</Text>
            <Button
              title="Select Different Date"
              onPress={() => setStep(2)}
              variant="outline"
              size="small"
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <>
            <View style={styles.timeSlotsGrid}>
              {displaySlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    slot.booked && styles.timeSlotBooked,
                    selectedTime === slot.time && styles.timeSlotActive,
                  ]}
                  onPress={() => handleTimeSelect(slot)}
                  disabled={slot.booked}
                >
                  {selectedTime === slot.time ? (
                    <LinearGradient
                      colors={colors.gradientPrimary}
                      style={styles.timeSlotGradient}
                    >
                      <Text style={styles.timeTextActive}>{slot.label}</Text>
                      {checkingAvailability && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 4 }} />
                      )}
                    </LinearGradient>
                  ) : (
                    <>
                      <Text style={[styles.timeText, slot.booked && styles.timeTextBooked]}>
                        {slot.label}
                      </Text>
                      {slot.booked && <Text style={styles.bookedBadge}>Booked</Text>}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Availability Status */}
            {selectedTime && slotAvailability && (
              <View style={[
                styles.availabilityBadge,
                slotAvailability.available ? styles.availabilityAvailable : styles.availabilityUnavailable
              ]}>
                <Text style={styles.availabilityIcon}>
                  {slotAvailability.available ? '✓' : '✗'}
                </Text>
                <Text style={styles.availabilityText}>
                  {slotAvailability.available ? 'Slot Available' : slotAvailability.message || 'Slot Unavailable'}
                </Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendAvailable]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendBooked]} />
                <Text style={styles.legendText}>Booked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendSelected]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
            </View>

            {/* Continue Button */}
            {selectedTime && (slotAvailability?.available !== false) && (
              <Button
                title="Continue to Details"
                onPress={() => setStep(4)}
                fullWidth
                size="large"
                style={{ marginTop: spacing.lg }}
              />
            )}
          </>
        )}
      </View>
    );
  };

  // Render Step 4: Details & Confirmation
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
        <TouchableOpacity style={styles.infoBadge} onPress={() => setStep(3)}>
          <Text style={styles.badgeIcon}>⏰</Text>
          <Text style={styles.badgeText}>{formatTime(selectedTime)}</Text>
        </TouchableOpacity>
      </View>

      {/* Appointment Summary Card */}
      <Card variant="gradient" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
        </View>
        
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>
              {consultationType === 'online' ? '📹 Online Consultation' : '🏥 In-Clinic Visit'}
            </Text>
          </View>
        </View>
      </Card>

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
          {step === 1 ? 'Book Appointment' : step === 2 ? 'Select Date' : step === 3 ? 'Select Time' : 'Confirm Details'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
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
              {s === 1 ? 'Type' : s === 2 ? 'Date' : s === 3 ? 'Time' : 'Details'}
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
        {step === 3 && renderTimeSelection()}
        {step === 4 && renderDetailsStep()}
      </ScrollView>

      {/* Bottom CTA */}
      {step === 4 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryRowBottom}>
            <Text style={styles.summaryLabelBottom}>Consultation Fee</Text>
            <Text style={styles.summaryValueBottom}>₹{doctor?.fee || doctor?.consultationFee || 500}</Text>
          </View>
          <Button
            title={bookingInProgress ? 'Booking...' : 'Proceed to Payment'}
            onPress={handleBooking}
            fullWidth
            size="large"
            disabled={!selectedDate || !selectedTime || !consultationType || bookingInProgress}
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
  queueBadgeAvailable: { backgroundColor: colors.success, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  queueBadgeFull: { backgroundColor: colors.error, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
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
  queueLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, marginBottom: spacing.md },
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
  summaryRowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  summaryLabelBottom: { ...typography.bodyLarge, color: colors.textSecondary },
  summaryValueBottom: { ...typography.headlineMedium, color: colors.textPrimary },
  
  // Summary Card (Step 4)
  summaryCard: { padding: spacing.lg, marginBottom: spacing.lg },
  summaryHeader: { marginBottom: spacing.md },
  summaryTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '600' },
  summaryDetails: {},
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  summaryLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  summaryValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  
  // Time Slots (Step 3)
  slotsLoading: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  slotsLoadingText: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: spacing.md },
  unavailableCard: { alignItems: 'center', padding: spacing.xxl },
  unavailableIcon: { fontSize: 48, marginBottom: spacing.md },
  unavailableTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.sm },
  unavailableText: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
  
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: {
    width: '31%', paddingVertical: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1,
    borderColor: colors.surfaceBorder, overflow: 'hidden',
  },
  timeSlotBooked: { opacity: 0.5, backgroundColor: colors.surfaceLight },
  timeSlotActive: { borderWidth: 0 },
  timeSlotGradient: {
    width: '100%', paddingVertical: spacing.md, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  timeText: { ...typography.bodyMedium, color: colors.textSecondary },
  timeTextBooked: { textDecorationLine: 'line-through', color: colors.textMuted },
  timeTextActive: { ...typography.bodyMedium, color: colors.textInverse, fontWeight: '600' },
  bookedBadge: { ...typography.labelSmall, color: colors.error, marginTop: spacing.xs },
  
  // Availability Badge
  availabilityBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg,
  },
  availabilityAvailable: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  availabilityUnavailable: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  availabilityIcon: { fontSize: 16, marginRight: spacing.sm },
  availabilityText: { ...typography.bodyMedium, color: colors.textPrimary },
  
  // Legend
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.xs },
  legendAvailable: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  legendBooked: { backgroundColor: colors.surfaceLight, opacity: 0.5 },
  legendSelected: { backgroundColor: colors.primary },
  legendText: { ...typography.labelSmall, color: colors.textMuted },
  
  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.md },
});

export default SlotSelectionScreen;
