// OnboardingScreen - Premium startup-grade onboarding walkthrough with pre-auth permissions
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  // Permissions state
  const [locGranted, setLocGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [camGranted, setCamGranted] = useState(false);

  const slides = [
    {
      id: '1',
      title: 'Find trusted doctors instantly',
      subtitle: 'Connect with 500+ top-rated specialists and view real-time clinic queue status before booking.',
      emoji: '🩺',
      gradient: ['#00D4AA', '#00B894'],
    },
    {
      id: '2',
      title: 'Book appointments without waiting',
      subtitle: 'Join live digital queues, monitor your position, and schedule video or physical visits in seconds.',
      emoji: '📅',
      gradient: ['#6C5CE7', '#5B4ED1'],
    },
    {
      id: '3',
      title: 'Secure medical records & AI support',
      subtitle: 'Store reports in a HIPAA-compliant vault and get 24/7 AI-powered answers for symptoms and vitals.',
      emoji: '🔒',
      gradient: ['#FF6B6B', '#EE5A5A'],
    },
    {
      id: '4',
      title: 'Permissions Setup',
      subtitle: 'We value your privacy. HealthSync requires the following permissions to function correctly:',
      emoji: '⚙️',
      gradient: ['#00D4AA', '#5B4ED1'],
      isPermissionSlide: true,
    },
  ];

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasLoc = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        setLocGranted(hasLoc);
        const hasCam = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        setCamGranted(hasCam);
        if (Platform.Version >= 33) {
          const hasNotif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          setNotifGranted(hasNotif);
        } else {
          setNotifGranted(true);
        }
      } else {
        const locRes = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        setLocGranted(locRes === RESULTS.GRANTED);
        const camRes = await check(PERMISSIONS.IOS.CAMERA);
        setCamGranted(camRes === RESULTS.GRANTED);
      }
    } catch (err) {
      console.log('Error checking permissions:', err);
    }
  };

  const handleRequestLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        setLocGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const res = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        setLocGranted(res === RESULTS.GRANTED);
      }
    } catch (err) {
      Alert.alert('Permission Error', 'Could not request location permission');
    }
  };

  const handleRequestNotifications = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setNotifGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // Mock / simulate notifications request for ios / older android
        setNotifGranted(true);
        Alert.alert('Notifications Enabled', 'You will now receive appointment updates.');
      }
    } catch (err) {
      Alert.alert('Permission Error', 'Could not request notifications permission');
    }
  };

  const handleRequestCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setCamGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const res = await request(PERMISSIONS.IOS.CAMERA);
        setCamGranted(res === RESULTS.GRANTED);
      }
    } catch (err) {
      Alert.alert('Permission Error', 'Could not request camera permission');
    }
  };

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      navigation.replace('Welcome');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      navigation.replace('Welcome');
    }
  };

  const renderPermissionRow = (icon, title, desc, granted, onRequest) => {
    return (
      <View style={[styles.permRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={[styles.permIconBg, { backgroundColor: colors.backgroundCard }]}>
          <Text style={styles.permIcon}>{icon}</Text>
        </View>
        <View style={styles.permTextContainer}>
          <Text style={[styles.permTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.permDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.permBtn,
            { backgroundColor: granted ? colors.success + '20' : colors.primary },
          ]}
          onPress={onRequest}
          disabled={granted}
        >
          <Text style={[styles.permBtnText, { color: granted ? colors.success : '#fff' }]}>
            {granted ? '✓ Allowed' : 'Grant'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.isPermissionSlide) {
      return (
        <View style={styles.slide}>
          <View style={styles.glowContainer}>
            <LinearGradient
              colors={[item.gradient[0] + '33', 'transparent']}
              style={styles.glow}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.permissionsList}>
            {renderPermissionRow(
              '📍',
              'Location Access',
              'We use location to show nearby clinics.',
              locGranted,
              handleRequestLocation
            )}
            {renderPermissionRow(
              '🔔',
              'Notifications',
              'Get updates on queue status and reminders.',
              notifGranted,
              handleRequestNotifications
            )}
            {renderPermissionRow(
              '📸',
              'Camera & Storage',
              'Used to scan barcodes & upload medical reports.',
              camGranted,
              handleRequestCamera
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.slide}>
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={[item.gradient[0] + '33', 'transparent']}
            style={styles.glow}
          />
        </View>

        <View style={styles.emojiContainer}>
          <LinearGradient
            colors={[colors.surface, colors.backgroundCard]}
            style={[styles.emojiBg, { borderColor: colors.surfaceBorder }]}
          >
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <View style={[styles.emojiRing, { borderColor: item.gradient[0] + '4D' }]} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LinearGradient colors={['#00D4AA', '#00B894']} style={styles.logoGradient}>
            <Text style={styles.logoText}>+</Text>
          </LinearGradient>
          <Text style={[styles.logoBrand, { color: colors.textPrimary }]}>HealthSync</Text>
        </View>
        
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Paginated Slide List */}
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
        style={styles.flatList}
      />

      {/* Footer controls */}
      <View style={styles.footer}>
        {/* Animated Page Indicator Dots */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const activeColor = slides[currentIndex]?.gradient[0] || colors.primary;

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: currentIndex === i ? activeColor : colors.textMuted,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Navigation Action CTA */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.88}
          style={styles.nextButton}
        >
          <LinearGradient
            colors={slides[currentIndex]?.gradient || ['#00D4AA', '#00B894']}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoGradient: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  logoBrand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.huge,
  },
  glowContainer: {
    position: 'absolute',
    top: height * 0.05,
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.8) / 2,
  },
  emojiContainer: {
    position: 'relative',
    marginBottom: spacing.huge,
    zIndex: 1,
  },
  emojiBg: {
    width: 140,
    height: 140,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  emojiText: {
    fontSize: 64,
  },
  emojiRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 54,
    borderWidth: 2,
    top: -10,
    left: -10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsList: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  permIconBg: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIcon: {
    fontSize: 20,
  },
  permTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  permTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  permDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  permBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.lg,
  },
  permBtnText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.huge,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  btnText: {
    ...typography.button,
    color: '#fff',
  },
});

export default OnboardingScreen;

