/**
 * Video Consultation Screen
 * Handles video call interface for telemedicine appointments
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import videoService from '../../services/videoConsultationService';

const VideoConsultationScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  
  const { appointment, doctor, userType = 'patient' } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [meetLink, setMeetLink] = useState(null);
  const [consultationStatus, setConsultationStatus] = useState('waiting');
  const [error, setError] = useState(null);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeaveConsultation();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Initialize consultation
  useEffect(() => {
    initializeConsultation();
  }, []);

  const initializeConsultation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const appointmentId = appointment?._id || appointment?.id;
      if (!appointmentId) {
        throw new Error('Appointment ID not found');
      }

      // Get or generate meeting link
      const result = await videoService.getMeetingLink(appointmentId);
      
      if (result.success) {
        setMeetLink(result.meetLink);
        setConsultationStatus('ready');
      } else {
        throw new Error(result.error || 'Failed to get meeting link');
      }
    } catch (err) {
      console.error('Error initializing consultation:', err);
      setError(err.message);
      setConsultationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCall = async () => {
    if (!meetLink) {
      Alert.alert('Error', 'Meeting link not available. Please try again.');
      return;
    }

    try {
      setConsultationStatus('joining');
      
      // Notify backend that user is joining
      const appointmentId = appointment?._id || appointment?.id;
      await videoService.notifyJoined(appointmentId, userType);
      
      // Open meeting link
      const canOpen = await Linking.canOpenURL(meetLink);
      if (canOpen) {
        await Linking.openURL(meetLink);
        setConsultationStatus('in-call');
      } else {
        Alert.alert('Error', 'Cannot open video call. Please install a browser or Jitsi Meet app.');
      }
    } catch (err) {
      console.error('Error joining call:', err);
      Alert.alert('Error', 'Failed to join video call. Please try again.');
      setConsultationStatus('ready');
    }
  };

  const handleLeaveConsultation = () => {
    Alert.alert(
      'Leave Consultation',
      'Are you sure you want to leave this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
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

  const handleRetry = () => {
    initializeConsultation();
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
          <Text style={styles.loadingText}>Setting up your consultation...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
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
            onPress={handleLeaveConsultation}
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

        {/* Doctor/Patient Info */}
        <View style={styles.participantCard}>
          <Avatar 
            name={doctor?.name || appointment?.doctorId?.name || 'Doctor'} 
            size="xlarge" 
            imageUrl={doctor?.profilePhoto}
          />
          <Text style={styles.participantName}>
            {userType === 'patient' 
              ? `Dr. ${doctor?.name || appointment?.doctorId?.name || 'Doctor'}`
              : appointment?.userId?.name || 'Patient'
            }
          </Text>
          <Text style={styles.participantSpecialty}>
            {doctor?.specialization || doctor?.specialty || 'Specialist'}
          </Text>
          
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
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Before You Join</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.instructionText}>Ensure stable internet connection</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.instructionText}>Find a quiet, well-lit space</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.instructionText}>Keep your medical documents ready</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.instructionText}>Allow camera & microphone access</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={handleJoinCall}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={['#6C5CE7', '#a29bfe']} 
              style={styles.joinButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.joinButtonIcon}>📹</Text>
              <Text style={styles.joinButtonText}>
                {consultationStatus === 'in-call' ? 'Rejoin Call' : 'Join Video Call'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonIcon}>💬</Text>
              <Text style={styles.secondaryButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonIcon}>📞</Text>
              <Text style={styles.secondaryButtonText}>Audio Only</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
              <Text style={styles.secondaryButtonIcon}>🔄</Text>
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Having trouble? Contact support at support@healthsync.com
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
    paddingVertical: spacing.xxl,
  },
  participantName: {
    ...typography.headlineMedium,
    color: '#fff',
    marginTop: spacing.lg,
    fontWeight: '700',
  },
  participantSpecialty: {
    ...typography.bodyMedium,
    color: '#94a3b8',
    marginTop: spacing.xs,
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
  instructionsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    ...typography.labelLarge,
    color: '#fff',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkIcon: {
    color: '#10B981',
    fontSize: 14,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  instructionText: {
    color: '#cbd5e1',
    ...typography.bodySmall,
  },
  actionsContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  joinButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  joinButtonIcon: { fontSize: 24, marginRight: spacing.sm },
  joinButtonText: {
    color: '#fff',
    ...typography.headlineSmall,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  secondaryButtonIcon: { fontSize: 24, marginBottom: spacing.xs },
  secondaryButtonText: {
    color: '#94a3b8',
    ...typography.labelSmall,
  },
  helpText: {
    color: '#64748b',
    ...typography.labelSmall,
    textAlign: 'center',
    paddingBottom: spacing.xxl,
  },
});

export default VideoConsultationScreen;
