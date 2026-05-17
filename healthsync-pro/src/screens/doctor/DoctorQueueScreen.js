/**
 * Doctor Queue Screen - Real-time patient queue management
 * Features: Current patient, waiting queue, consultation timer, walk-in support
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const DoctorQueueScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [queue, setQueue] = useState([]);
  const [consultationTime, setConsultationTime] = useState(0);
  const [queueFilter, setQueueFilter] = useState('all');
  const timerRef = useRef(null);
  
  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [existingPatient, setExistingPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: '',
    reason: '',
    consultationType: 'in_person',
  });

  const doctorId = user?.id || user?._id;

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get(`/appointments/doctor/${doctorId}/queue?date=${today}`);
      const queueData = response.data || [];
      
      // Separate current patient from waiting queue
      const inProgress = queueData.find(a => a.status === 'in_progress');
      const waiting = queueData.filter(a => 
        a.status === 'confirmed' || a.status === 'pending'
      ).sort((a, b) => {
        if (a.tokenNumber && b.tokenNumber) return a.tokenNumber - b.tokenNumber;
        return a.time?.localeCompare(b.time) || 0;
      });
      
      setCurrentPatient(inProgress || null);
      setQueue(waiting);
    } catch (error) {
      console.log('Error fetching queue:', error.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Consultation timer
  useEffect(() => {
    if (currentPatient?.consultationStartTime || currentPatient?.consultationStartedAt) {
      const startTime = new Date(currentPatient.consultationStartTime || currentPatient.consultationStartedAt).getTime();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setConsultationTime(elapsed);
      }, 1000);
    } else {
      setConsultationTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPatient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQueue();
    setRefreshing(false);
  }, [fetchQueue]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeSlot = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}/status`, { status });
      Alert.alert('Success', `Appointment ${status === 'in_progress' ? 'started' : status}`);
      fetchQueue();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const callNextPatient = async () => {
    if (queue.length === 0) {
      Alert.alert('Info', 'No patients in queue');
      return;
    }
    if (currentPatient) {
      await updateAppointmentStatus(currentPatient._id, 'completed');
    }
    await updateAppointmentStatus(queue[0]._id, 'in_progress');
  };

  const completeCurrentPatient = async () => {
    if (!currentPatient) return;
    await updateAppointmentStatus(currentPatient._id, 'completed');
  };

  const markNoShow = async (appointmentId) => {
    Alert.alert('Confirm', 'Mark this patient as no-show?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => updateAppointmentStatus(appointmentId, 'cancelled') },
    ]);
  };

  const notifyPatient = async (appointmentId) => {
    try {
      await apiClient.post(`/appointments/${appointmentId}/notify-patient`);
      Alert.alert('Success', 'Notification sent to patient');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  // Walk-in patient functions
  const resetWalkInForm = () => {
    setWalkInForm({
      patientName: '',
      patientPhone: '',
      patientAge: '',
      patientGender: '',
      reason: '',
      consultationType: 'in_person',
    });
    setSearchPhone('');
    setExistingPatient(null);
  };

  const searchPatientByPhone = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      Alert.alert('Error', 'Enter valid 10-digit phone number');
      return;
    }
    try {
      setSearching(true);
      const response = await apiClient.get(`/users/search?phone=${searchPhone}`);
      if (response.data && response.data._id) {
        setExistingPatient(response.data);
        Alert.alert('Found', `Patient: ${response.data.name}`);
      } else {
        setExistingPatient(null);
        Alert.alert('New Patient', 'Fill in patient details below');
      }
    } catch (error) {
      setExistingPatient(null);
      Alert.alert('New Patient', 'Fill in patient details below');
    } finally {
      setSearching(false);
    }
  };

  const addWalkInPatient = async () => {
    if (!existingPatient && !walkInForm.patientName.trim()) {
      Alert.alert('Error', 'Patient name is required');
      return;
    }
    try {
      setWalkInLoading(true);
      const bookingData = {
        doctorId,
        clinicId: user?.clinicId?._id || user?.clinicId,
        date: new Date().toISOString().split('T')[0],
        reason: walkInForm.reason || 'Walk-in Consultation',
        consultationType: walkInForm.consultationType,
        addedBy: doctorId,
      };

      if (existingPatient) {
        bookingData.userId = existingPatient._id;
      } else {
        bookingData.patientName = walkInForm.patientName;
        bookingData.patientPhone = walkInForm.patientPhone || searchPhone;
        bookingData.patientAge = walkInForm.patientAge ? parseInt(walkInForm.patientAge) : null;
        bookingData.patientGender = walkInForm.patientGender;
      }

      const response = await apiClient.post('/appointments/walk-in', bookingData);
      if (response.data.success || response.data.queueNumber) {
        Alert.alert('Success', `Patient added! Token #${response.data.queueNumber || response.data.tokenNumber || '-'}`);
        setShowWalkInModal(false);
        resetWalkInForm();
        fetchQueue();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add patient');
    } finally {
      setWalkInLoading(false);
    }
  };

  const filteredQueue = queueFilter === 'all' 
    ? queue 
    : queueFilter === 'virtual'
      ? queue.filter(p => p.consultationType === 'online')
      : queue.filter(p => p.consultationType !== 'online');

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading queue...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Queue</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowWalkInModal(true)} style={[styles.addBtn, { backgroundColor: '#10B981' }]}>
              <Text style={styles.addBtnText}>+ Walk-In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchQueue} style={styles.refreshBtn}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Summary */}
        <Card style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>📊 Today at a Glance</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>{queue.filter(q => q.status === 'completed').length}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Seen</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{queue.length}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Waiting</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: '#6C5CE7' }]}>~{user?.consultationDuration || 20}m</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Time</Text>
            </View>
          </View>
        </Card>

        {/* Queue Filter */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: `All (${queue.length})`, icon: '📋' },
            { id: 'in_clinic', label: `Clinic (${queue.filter(p => p.consultationType !== 'online').length})`, icon: '🏥' },
            { id: 'virtual', label: `Online (${queue.filter(p => p.consultationType === 'online').length})`, icon: '📹' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterBtn,
                { backgroundColor: colors.surface },
                queueFilter === filter.id && styles.filterBtnActive,
              ]}
              onPress={() => setQueueFilter(filter.id)}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text style={[
                styles.filterLabel,
                { color: queueFilter === filter.id ? '#6C5CE7' : colors.textSecondary }
              ]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Patient */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Current Patient</Text>
          <Card style={[styles.currentPatientCard, { backgroundColor: colors.surface }]}>
            {currentPatient ? (
              <>
                <View style={styles.currentPatientHeader}>
                  <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.patientAvatar}>
                    <Text style={styles.patientInitial}>
                      {currentPatient.isWalkIn 
                        ? (currentPatient.walkInPatient?.name?.charAt(0) || 'W')
                        : (currentPatient.userId?.name?.charAt(0) || 'P')}
                    </Text>
                  </LinearGradient>
                  <View style={styles.currentPatientInfo}>
                    <Text style={[styles.currentPatientName, { color: colors.textPrimary }]}>
                      {currentPatient.isWalkIn 
                        ? (currentPatient.walkInPatient?.name || 'Walk-In Patient')
                        : (currentPatient.userId?.name || 'Unknown Patient')}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: currentPatient.consultationType === 'online' ? '#3B82F620' : '#10B98120' }]}>
                      <Text style={[styles.typeBadgeText, { color: currentPatient.consultationType === 'online' ? '#3B82F6' : '#10B981' }]}>
                        {currentPatient.consultationType === 'online' ? '📹 Online' : '🏥 In-Clinic'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Consultation Timer */}
                <View style={styles.timerContainer}>
                  <Text style={styles.timerIcon}>⏱️</Text>
                  <Text style={[styles.timerText, { color: colors.textPrimary }]}>{formatTime(consultationTime)}</Text>
                  <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>elapsed</Text>
                </View>

                <View style={styles.patientDetails}>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    📞 {currentPatient.isWalkIn ? currentPatient.walkInPatient?.phone : currentPatient.userId?.phone || 'N/A'}
                  </Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    🎫 Token #{currentPatient.tokenNumber || '-'} • {formatTimeSlot(currentPatient.time)}
                  </Text>
                  {currentPatient.reason && (
                    <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                      📝 {currentPatient.reason}
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {currentPatient.consultationType === 'online' && currentPatient.googleMeetLink && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1A73E8' }]}>
                      <Text style={styles.actionBtnText}>📹 Join Call</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#6C5CE7' }]}
                    onPress={() => navigation.navigate('DoctorCreatePrescription', { 
                      patientId: currentPatient.userId?._id,
                      appointmentId: currentPatient._id 
                    })}
                  >
                    <Text style={styles.actionBtnText}>💊 Prescription</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={completeCurrentPatient}
                  >
                    <Text style={styles.actionBtnText}>✅ Complete</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => updateAppointmentStatus(currentPatient._id, 'confirmed')}
                  >
                    <Text style={styles.actionBtnText}>↩️ Back to Queue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => markNoShow(currentPatient._id)}
                  >
                    <Text style={styles.actionBtnText}>🚫 No Show</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyCurrentPatient}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No patient in consultation</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  {queue.length > 0 ? `${queue.length} patient(s) waiting` : 'Queue is empty'}
                </Text>
                {queue.length > 0 && (
                  <TouchableOpacity style={styles.callNextBtn} onPress={callNextPatient}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.callNextBtnGradient}>
                      <Text style={styles.callNextBtnText}>📞 Call Next Patient</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Waiting Queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Waiting Queue ({filteredQueue.length})
            </Text>
            {queue.length > 0 && currentPatient && (
              <TouchableOpacity style={styles.nextBtn} onPress={callNextPatient}>
                <Text style={styles.nextBtnText}>Next ▶</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredQueue.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All Clear!</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>No patients waiting</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowWalkInModal(true)}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.emptyAddBtnGradient}>
                  <Text style={styles.emptyAddBtnText}>➕ Add Walk-In Patient</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Card>
          ) : (
            filteredQueue.map((patient, index) => {
              const estimatedWait = index * 20;
              return (
                <Card key={patient._id} style={[styles.queueItem, { backgroundColor: colors.surface }, index === 0 && styles.nextUpItem]}>
                  <View style={styles.queuePosition}>
                    <Text style={styles.queuePositionText}>{index + 1}</Text>
                  </View>
                  <View style={styles.queuePatientInfo}>
                    <Text style={[styles.queuePatientName, { color: colors.textPrimary }]}>
                      {patient.isWalkIn ? patient.walkInPatient?.name : patient.userId?.name || 'Unknown'}
                      {patient.isWalkIn && (
                        <Text style={styles.walkInBadge}> 🚶 Walk-In</Text>
                      )}
                    </Text>
                    <Text style={[styles.queuePatientDetails, { color: colors.textSecondary }]}>
                      🎫 #{patient.tokenNumber || '-'} • {formatTimeSlot(patient.time)}
                    </Text>
                    <Text style={[styles.queuePatientReason, { color: colors.textMuted }]} numberOfLines={1}>
                      {patient.reason}
                    </Text>
                    <View style={styles.queueBadges}>
                      <View style={[styles.waitBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.waitBadgeText, { color: colors.textSecondary }]}>
                          ⏳ ~{estimatedWait} min
                        </Text>
                      </View>
                      <View style={[styles.typeBadgeSmall, { backgroundColor: patient.consultationType === 'online' ? '#3B82F620' : '#10B98120' }]}>
                        <Text style={{ fontSize: 12 }}>{patient.consultationType === 'online' ? '📹' : '🏥'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.queueActions}>
                    {index === 0 && !currentPatient && (
                      <TouchableOpacity 
                        style={[styles.queueActionBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => updateAppointmentStatus(patient._id, 'in_progress')}
                      >
                        <Text style={styles.queueActionIcon}>▶</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.queueActionBtn, { backgroundColor: '#3B82F6' }]}
                      onPress={() => notifyPatient(patient._id)}
                    >
                      <Text style={styles.queueActionIcon}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.queueActionBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => markNoShow(patient._id)}
                    >
                      <Text style={styles.queueActionIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Walk-In Patient Modal */}
      <Modal visible={showWalkInModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>➕ Add Walk-In Patient</Text>
              <TouchableOpacity onPress={() => { setShowWalkInModal(false); resetWalkInForm(); }} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Search by Phone */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Search by Phone</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                    placeholder="Enter 10-digit phone"
                    placeholderTextColor={colors.textMuted}
                    value={searchPhone}
                    onChangeText={setSearchPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  <TouchableOpacity style={[styles.searchBtn, { backgroundColor: '#6C5CE7' }]} onPress={searchPatientByPhone} disabled={searching}>
                    <Text style={styles.searchBtnText}>{searching ? '...' : '🔍'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Existing Patient Found */}
              {existingPatient && (
                <View style={[styles.existingPatientCard, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
                  <Text style={styles.existingPatientIcon}>✅</Text>
                  <View style={styles.existingPatientInfo}>
                    <Text style={[styles.existingPatientName, { color: colors.textPrimary }]}>{existingPatient.name}</Text>
                    <Text style={[styles.existingPatientPhone, { color: colors.textSecondary }]}>📞 {existingPatient.phone}</Text>
                  </View>
                </View>
              )}

              {/* New Patient Form */}
              {!existingPatient && (
                <>
                  <View style={styles.formDivider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
                    <Text style={[styles.dividerText, { color: colors.textMuted }]}>New Patient Details</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
                  </View>

                  <View style={styles.formSection}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Patient Name *</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                      placeholder="Full name"
                      placeholderTextColor={colors.textMuted}
                      value={walkInForm.patientName}
                      onChangeText={(text) => setWalkInForm({ ...walkInForm, patientName: text })}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formSection, { flex: 1, marginRight: spacing.sm }]}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Age</Text>
                      <TextInput
                        style={[styles.formInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                        placeholder="Age"
                        placeholderTextColor={colors.textMuted}
                        value={walkInForm.patientAge}
                        onChangeText={(text) => setWalkInForm({ ...walkInForm, patientAge: text })}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>
                    <View style={[styles.formSection, { flex: 1 }]}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Gender</Text>
                      <View style={styles.genderRow}>
                        {['male', 'female', 'other'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genderBtn, { backgroundColor: colors.background, borderColor: walkInForm.patientGender === g ? '#6C5CE7' : colors.surfaceBorder }]}
                            onPress={() => setWalkInForm({ ...walkInForm, patientGender: g })}
                          >
                            <Text style={[styles.genderBtnText, { color: walkInForm.patientGender === g ? '#6C5CE7' : colors.textSecondary }]}>
                              {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Common Fields */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Reason for Visit</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
                  placeholder="Brief description..."
                  placeholderTextColor={colors.textMuted}
                  value={walkInForm.reason}
                  onChangeText={(text) => setWalkInForm({ ...walkInForm, reason: text })}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Consultation Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, { backgroundColor: walkInForm.consultationType === 'in_person' ? '#10B98120' : colors.background, borderColor: walkInForm.consultationType === 'in_person' ? '#10B981' : colors.surfaceBorder }]}
                    onPress={() => setWalkInForm({ ...walkInForm, consultationType: 'in_person' })}
                  >
                    <Text style={styles.typeIcon}>🏥</Text>
                    <Text style={[styles.typeText, { color: walkInForm.consultationType === 'in_person' ? '#10B981' : colors.textSecondary }]}>In-Person</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, { backgroundColor: walkInForm.consultationType === 'online' ? '#3B82F620' : colors.background, borderColor: walkInForm.consultationType === 'online' ? '#3B82F6' : colors.surfaceBorder }]}
                    onPress={() => setWalkInForm({ ...walkInForm, consultationType: 'online' })}
                  >
                    <Text style={styles.typeIcon}>📹</Text>
                    <Text style={[styles.typeText, { color: walkInForm.consultationType === 'online' ? '#3B82F6' : colors.textSecondary }]}>Video Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]} onPress={() => { setShowWalkInModal(false); resetWalkInForm(); }}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#10B981' }]} onPress={addWalkInPatient} disabled={walkInLoading}>
                {walkInLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>➕ Add to Queue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scrollContent: { paddingBottom: 100 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  addBtnText: { color: '#fff', ...typography.labelSmall, fontWeight: '700' },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 18 },

  summaryCard: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl },
  summaryTitle: { ...typography.bodyMedium, fontWeight: '600', marginBottom: spacing.md },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStat: { alignItems: 'center' },
  summaryValue: { ...typography.headlineMedium, fontWeight: '700' },
  summaryLabel: { ...typography.labelSmall },

  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.sm },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  filterBtnActive: { borderWidth: 2, borderColor: '#6C5CE7' },
  filterIcon: { fontSize: 14, marginRight: spacing.xs },
  filterLabel: { ...typography.labelSmall },

  section: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '600' },
  nextBtn: { backgroundColor: '#6C5CE7', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  nextBtnText: { color: '#fff', ...typography.labelSmall, fontWeight: '600' },

  currentPatientCard: { padding: spacing.lg, borderRadius: borderRadius.xl },
  currentPatientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  patientAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientInitial: { color: '#fff', ...typography.headlineMedium, fontWeight: '700' },
  currentPatientInfo: { flex: 1 },
  currentPatientName: { ...typography.bodyLarge, fontWeight: '700' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginTop: spacing.xs },
  typeBadgeText: { ...typography.labelSmall, fontWeight: '600' },

  timerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, marginBottom: spacing.md, backgroundColor: 'rgba(108, 92, 231, 0.1)', borderRadius: borderRadius.md },
  timerIcon: { fontSize: 20, marginRight: spacing.sm },
  timerText: { ...typography.headlineLarge, fontWeight: '700' },
  timerLabel: { ...typography.labelSmall, marginLeft: spacing.sm },

  patientDetails: { marginBottom: spacing.md },
  detailText: { ...typography.bodySmall, marginBottom: spacing.xs },
  reasonText: { ...typography.bodySmall, fontStyle: 'italic' },

  actionButtons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', ...typography.labelSmall, fontWeight: '600' },

  emptyCurrentPatient: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyLarge, fontWeight: '600' },
  emptySubtext: { ...typography.bodySmall, marginBottom: spacing.lg },
  callNextBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  callNextBtnGradient: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  callNextBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },

  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyAddBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  emptyAddBtnGradient: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyAddBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },

  queueItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  nextUpItem: { borderWidth: 2, borderColor: '#10B981' },
  queuePosition: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  queuePositionText: { color: '#6C5CE7', ...typography.labelMedium, fontWeight: '700' },
  queuePatientInfo: { flex: 1 },
  queuePatientName: { ...typography.bodyMedium, fontWeight: '600' },
  walkInBadge: { color: '#F59E0B', fontSize: 12 },
  queuePatientDetails: { ...typography.labelSmall },
  queuePatientReason: { ...typography.labelSmall, marginTop: 2 },
  queueBadges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  waitBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  waitBadgeText: { ...typography.labelSmall },
  typeBadgeSmall: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  queueActions: { flexDirection: 'column', gap: spacing.xs },
  queueActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  queueActionIcon: { color: '#fff', fontSize: 14 },

  // Walk-In Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { ...typography.headlineSmall, fontWeight: '700' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 18 },
  modalBody: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },

  formSection: { marginBottom: spacing.lg },
  formLabel: { ...typography.labelSmall, fontWeight: '600', marginBottom: spacing.xs },
  formInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row' },
  formDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { ...typography.labelSmall, marginHorizontal: spacing.md },

  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  searchBtn: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { fontSize: 20 },

  existingPatientCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 2, marginBottom: spacing.lg },
  existingPatientIcon: { fontSize: 24, marginRight: spacing.md },
  existingPatientInfo: { flex: 1 },
  existingPatientName: { ...typography.bodyLarge, fontWeight: '700' },
  existingPatientPhone: { ...typography.bodySmall },

  genderRow: { flexDirection: 'row', gap: spacing.xs },
  genderBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2, alignItems: 'center' },
  genderBtnText: { fontSize: 18 },

  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 2 },
  typeIcon: { fontSize: 18, marginRight: spacing.xs },
  typeText: { ...typography.labelMedium, fontWeight: '600' },

  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { ...typography.labelMedium, fontWeight: '600' },
  submitBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  submitBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
});

export default DoctorQueueScreen;