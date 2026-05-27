/**
 * OnboardingScreen - Premium startup-grade onboarding walkthrough
 * Horizontal paginated slides with smooth indicators, micro-interactions, and gradient buttons
 */

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Find Verified Doctors',
    subtitle: 'Connect with 500+ top-rated specialists and view real-time clinic queue status before you book.',
    emoji: '🩺',
    gradient: ['#00D4AA', '#00B894'],
  },
  {
    id: '2',
    title: 'AI Health Assistant',
    subtitle: 'Get 24/7 answers to health questions, symptom analysis, and personalized diet tips powered by Gemini AI.',
    emoji: '🤖',
    gradient: ['#6C5CE7', '#5B4ED1'],
  },
  {
    id: '3',
    title: 'Secure Health Vault',
    subtitle: 'Store your medical reports, vitals history, and prescriptions in a 100% private, secure environment.',
    emoji: '🔒',
    gradient: ['#FF6B6B', '#EE5A5A'],
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

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

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        {/* Glow effect matching the theme */}
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={[item.gradient[0] + '33', 'transparent']}
            style={styles.glow}
          />
        </View>

        {/* Emoji Illustration */}
        <View style={styles.emojiContainer}>
          <LinearGradient
            colors={[colors.surface, colors.backgroundCard]}
            style={[styles.emojiBg, { borderColor: colors.surfaceBorder }]}
          >
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </LinearGradient>
          <View style={[styles.emojiRing, { borderColor: item.gradient[0] + '4D' }]} />
        </View>

        {/* Text Details */}
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
    fontSize: 28,
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
