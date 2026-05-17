/**
 * Doctor Video Consultation Screen
 * Handles video call interface for doctors
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import videoService from '../../services/videoConsultationService';

const DoctorVideoConsultationScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  
  const { appointment, patient } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [meetLink, setMeetLink] = useState(null);
  const [doctorLink, setDoctorLink] = useState(null);
  const [consultationStatus, setConsultationStatus] = useState('waiting');
  const [error, setError] = useState(null);
  const [patientJoined, setPatientJoined] = useState(false);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleEndConsultation();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Initialize consultation
  useEffect(() => {
    initializeConsultation();
  }, []);

  // Poll for patient join status
  useEffect(() => {
    if (consultationStatus === 'ready' || consultationStatus === 'in-call') {
      const interval = setInterval(checkPatientStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [consultationStatus]);

  const initializeConsultation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const appointmentId = appointment?._id || appointment?.id;
      if (!appointmentId) {
        throw new Error('Appointment ID not found');
      }

      // Start consultation (generates meet link if needed)
      const result = await videoService.startConsultation(appointmentId);
      
      if (result.success) {
        setMeetLink(result.meetLink);
        setDoctorLink(result.doctorLink || result.meetLink);
        setConsultationStatus('ready');
      } else {
        // Fallback to getting existing link
        const linkResult = await videoService.getMeetingLink(appointmentId);
        if (linkResult.success) {
          setMeetLink(linkResult.meetLink);
          setDoctorLink(linkResult.doctorLink || linkResult.meetLink);
          setConsultationStatus('ready');
        } else {
          throw new Error(linkResult.error || 'Failed to get meeting link');
        }
      }
    } catch (err) {
      console.error('Error initializing consultation:', err);
      setError(err.message);
      setConsultationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const checkPatientStatus = async () => {
    try {
      const appointmentId = appointment?._id || appointment?.id;
      const status = await videoService.getConsultationStatus(appointmentId);
      if (status.success && status.patientJoined) {
        setPatientJoined(true);
      }
    } catch (err) {
      console.log('Status check error:', err);
    }
  };

  const handleStartCall = async () => {
    const linkToOpen = doctorLink || meetLink;
    if (!linkToOpen) {
      Alert.alert('Error', 'Meeting link not available. Please try again.');
      return;
    }

    try {
      setConsultationStatus('joining');
      
      // Notify backend that doctor is joining
      const appointmentId = appointment?._id || appointment?.id;
      await videoService.notifyJoined(appointmentId, 'doctor');
      
      // Open meeting link
      const canOpen = await Linking.canOpenURL(linkToOpen);
      if (canOpen) {
        await Linking.openURL(linkToOpen);
        setConsultationStatus('in-call');
      } else {
        Alert.alert('Error', 'Cannot open video call. Please install a browser or Jitsi Meet app.');
      }
    } catch (err) {
      console.error('Error starting call:', err);
      Alert.alert('Error', 'Failed to start video call. Please try again.');
      setConsultationStatus('ready');
    }
  };

  const handleEndConsultation = () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End', 
          style: 'destructive',
          onPress: async () => {
            const appointmentId = appointment?._id || appointment?.id;
            await videoService.endConsultation(appointmentId);
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleWritePrescription = () => {
    navigation.navigate('DoctorCreatePrescription', {
      appointmentId: appointment?._id || appointment?.id,
      patient: patient || appointment?.userId,
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Preparing consultation room...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeConsultation}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleEndConsultation}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Consultation</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: consultationStatus === 'in-call' ? '#10B981' : '#F39C12' }]} />
            <Text style={styles.statusText}>
              {consultationStatus === 'in-call' ? 'In Call' : 'Ready'}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Patient Info */}
          <View style={styles.participantCard}>
            <Avatar 
              name={patient?.name || appointment?.userId?.name || 'Patient'} 
              size="xlarge" 
              imageUrl={patient?.profilePhoto}
            />
            <Text style={styles.participantName}>
              {patient?.name || appointment?.userId?.name || 'Patient'}
            </Text>
            <Text style={styles.participantInfo}>
              {patient?.phone || patient?.email || 'Patient'}
            </Text>
            
            {/* Patient Status */}
            <View style={[styles.patientStatusBadge, { backgroundColor: patientJoined ? '#10B98120' : '#F39C1220' }]}>
              <Text style={[styles.patientStatusText, { color: patientJoined ? '#10B981' : '#F39C12' }]}>
                {patientJoined ? '✓ Patient has joined' : '⏳ Waiting for patient'}
              </Text>
            </View>
            
            <View style={styles.appointmentInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoText}>{formatDate(appointment?.date)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏰</Text>
                <Text style={styles.infoText}>{appointment?.time || appointment?.timeSlot || 'Scheduled'}</Text>
              </View>
            </View>

            {appointment?.reason && (
              <View style={styles.reasonCard}>
                <Text style={styles.reasonLabel}>Reason for Visit:</Text>
                <Text style={styles.reasonText}>{appointment.reason}</Text>
              </View>
            )}
          </View>

          {/* Doctor Controls */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>🎥 Consultation Controls</Text>
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartCall}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#10B981', '#059669']} 
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonIcon}>📹</Text>
                <Text style={styles.startButtonText}>
                  {consultationStatus === 'in-call' ? 'Rejoin Call' : 'Start Video Call'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleWritePrescription}>
                <Text style={styles.actionIcon}>💊</Text>
                <Text style={styles.actionText}>Write Prescription</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionText}>View History</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.endButton}
              onPress={handleEndConsultation}
            >
              <Text style={styles.endButtonText}>End Consultation</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Help Text */}
        <Text style={styles.helpText}>
          The video call will open in your browser or Jitsi Meet app
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: '#fff', 
    marginTop: spacing.lg, 
    ...typography.bodyMedium 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: spacing.xl 
  },
  errorIcon: { fontSize: 64, marginBottom: spacing.lg },
  errorTitle: { 
    ...typography.headlineMedium, 
    color: '#fff', 
    marginBottom: spacing.sm 
  },
  errorMessage: { 
    ...typography.bodyMedium, 
    color: '#94a3b8', 
    textAlign: 'center', 
    marginBottom: spacing.xl 
  },
  retryButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  retryButtonText: { 
    color: '#fff', 
    ...typography.labelLarge, 
    fontWeight: '600' 
  },
  backButton: { padding: spacing.md },
  backButtonText: { color: '#94a3b8', ...typography.labelMedium },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#fff', fontSize: 18 },
  headerTitle: { 
    ...typography.headlineSmall, 
    color: '#fff', 
    fontWeight: '600' 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: { 
    color: '#fff', 
    ...typography.labelSmall 
  },
  participantCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  participantName: {
    ...typography.headlineMedium,
    color: '#fff',
    marginTop: spacing.lg,
    fontWeight: '700',
  },
  participantInfo: {
    ...typography.bodyMedium,
    color: '#94a3b8',
    marginTop: spacing.xs,
  },
  patientStatusBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  patientStatusText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  appointmentInfo: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: { fontSize: 16, marginRight: spacing.xs },
  infoText: { color: '#e2e8f0', ...typography.bodySmall },
  reasonCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    width: '100%',
  },
  reasonLabel: {
    ...typography.labelSmall,
    color: '#94a3b8',
    marginBottom: spacing.xs,
  },
  reasonText: {
    ...typography.bodyMedium,
    color: '#fff',
  },
  controlsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  controlsTitle: {
    ...typography.labelLarge,
    color: '#fff',
    marginBottom: spacing.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  startButtonIcon: { fontSize: 24, marginRight: spacing.sm },
  startButtonText: {
    color: '#fff',
    ...typography.headlineSmall,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 24, marginBottom: spacing.xs },
  actionText: {
    color: '#fff',
    ...typography.labelSmall,
  },
  endButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  endButtonText: {
    color: '#EF4444',
    ...typography.labelMedium,
    fontWeight: '600',
  },
  helpText: {
    color: '#64748b',
    ...typography.labelSmall,
    textAlign: 'center',
    paddingBottom: spacing.xxl,
  },
});

export default DoctorVideoConsultationScreen;
