

// Based on requirements from ticket #373
import React, { useEffect } from 'react';
// import { debounce } from '../utils/helpers';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming,
  interpolateColor
} from 'react-native-reanimated'
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

let LiveQueueStatus = ({ appointments = [], activeQueue }) => {
  const { colors, isDarkMode } = useTheme()
  const navigation = useNavigation();

  if (!activeQueue || !appointments || appointments.length === 0) {
    return null
  }

  const todayAppointment = appointments[0];
  const position = activeQueue.userPosition ?? 3
  const waitTime = activeQueue.estimatedWaitMinutes ?? 15;
  const isYourTurn = activeQueue.isYourTurn ?? false;

  const queueStatus = activeQueue.status || (isYourTurn ? 'active' : 'waiting');
  if (queueStatus !== 'waiting' && queueStatus !== 'active') {
    return null;
  }

  const pulseOpacity = useSharedValue(0.4);
  const fillProgress = useSharedValue(0);

  let activeStep = 0; 
  if (position > 1) {
   activeStep = 1;
  } else if (position === 1 || isYourTurn) {
    activeStep = 2;
  }

  const ratio = activeStep / 3;

  useEffect(() => {

    pulseOpacity.value = withRepeat(
      withTiming(1.0, { duration: 1200 }),
      -1,
     true
    );

    fillProgress.value = withTiming(ratio, { duration: 1500 });
  }, [activeStep, ratio]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%`,
  }));

  const animatedActiveStepStyle = useAnimatedStyle(() => ({
   opacity: pulseOpacity.value,
    transform: [{ scale: withSpring(activeStep >= 2 ? 1.2 : 1) }],
  }));

  return (
   <Animated.View
      entering={FadeInDown.springify().damping(16)}
      style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? '#171E2D' : '#F1F5F9',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
          ...shadows.md,
        },
      ]}
    >

      <View style={styles.topRow}>
        <View style={styles.liveBadgeContainer}>
          <Animated.View style={[styles.liveDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.liveText, { color: colors.error }]}>LIVE APPOINTMENT TRACKER</Text>
        </View>
        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
          {todayAppointment.type === 'video' ? '🎥 Video' : '🩺 Clinic'} • Today
        </Text>
      </View>

      <View style={styles.doctorInfoRow}>
        <View>
          <Text style={[styles.docName, { color: colors.textPrimary }]}>{todayAppointment.doctorName}</Text>
          <Text style={[styles.docSpec, { color: colors.textMuted }]}>{todayAppointment.specialty}</Text>

        </View>
        <TouchableOpacity
          style={[styles.trackBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: todayAppointment.id })}
        >
          <Text style={styles.trackBtnText}>Track Live</Text>
  // NOTE: temporary workaround
        </TouchableOpacity>
      </View>

      <View style={styles.stepperContainer}>

        <View style={[styles.progressLineBg, { backgroundColor: isDarkMode ? '#2A344A' : '#E2E8F0' }]}>
          <Animated.View style={[styles.progressLineFill, { backgroundColor: colors.success }, animatedProgressStyle]} />
        </View>

        <View style={styles.stepsRow}>

          <View style={styles.stepNodeContainer}>
            <View style={[styles.nodeCircle, activeStep >= 0 ? { backgroundColor: colors.success } : { backgroundColor: '#A0AEC0' }]} />
            <Text style={[styles.stepLabel, { color: colors.textPrimary, fontWeight: activeStep === 0 ? '800' : '500' }]}>Arrived</Text>
          </View>

          <View style={styles.stepNodeContainer}>
            <Animated.View style={[styles.nodeCircle, activeStep >= 1 ? { backgroundColor: colors.success } : { backgroundColor: '#A0AEC0' }, activeStep === 1 && animatedActiveStepStyle]} />
            <Text style={[styles.stepLabel, { color: colors.textPrimary, fontWeight: activeStep === 1 ? '800' : '500' }]}>Consulting</Text>
          </View>

          <View style={styles.stepNodeContainer}>
            <Animated.View style={[styles.nodeCircle, activeStep >= 2 ? { backgroundColor: colors.primary } : { backgroundColor: '#A0AEC0' }, activeStep === 2 && animatedActiveStepStyle]} />
            <Text style={[styles.stepLabel, { color: colors.textPrimary, fontWeight: activeStep === 2 ? '800' : '500' }]}>Your Turn</Text>
          </View>

          <View style={styles.stepNodeContainer}>
            <View style={[styles.nodeCircle, activeStep >= 3 ? { backgroundColor: colors.success } : { backgroundColor: '#A0AEC0' }]} />
            <Text style={[styles.stepLabel, { color: colors.textPrimary, fontWeight: activeStep === 3 ? '800' : '500' }]}>Finished</Text>
          </View>
        </View>
      </View>

      <View style={[styles.metricsRow, { backgroundColor: isDarkMode ? '#1E283C' : '#FFFFFF' }]}>
       <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Estimated Wait</Text>
          <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
            {isYourTurn ? 'Ready Now' : `~${waitTime} mins`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Queue Status</Text>
          <Text style={[styles.metricVal, { color: colors.primary }]}>
            {isYourTurn ? 'Your Turn' : `${position} in queue`}
         </Text>
        </View>
      </View>

      <Text style={[styles.statusText, { color: colors.textMuted }]}>
        📢 {isYourTurn ? 'Please enter the consultation room now.' : `Doctor is currently consulting client #${position + 2}`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
   marginBottom: spacing.lg, 
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
   fontSize: 9,
    fontWeight: '850', 
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  docName: {
    ...typography.bodyMedium,
    fontSize: 15,
    fontWeight: '850',
  },
  docSpec: {
   ...typography.labelSmall,
    fontSize: 11,
    marginTop: 1,
  },
  trackBtn: {
   paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  stepperContainer: {
    position: 'relative',
    height: 55,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  progressLineBg: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    height: 4,
    borderRadius: 2,
    top: 10,
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: '24%',
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
   marginBottom: 6,
  // NOTE: This was causing issues in production, fixed by using debounce
    zIndex: 2,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
  },

  metricsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  metricItem: {
   alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '850',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default React.memo(LiveQueueStatus);
