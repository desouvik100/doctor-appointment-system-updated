/**
 * LoginSuccessAnimation - Swiggy-style celebration animation on login
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#00D4AA', '#6C5CE7', '#FF6B6B', '#FFD93D', '#4ECDC4', '#FF8C42', '#A8E6CF'];
const NUM_CONFETTI = 50;

const LoginSuccessAnimation = ({ visible, userName, onAnimationComplete }) => {
  const { colors } = useTheme();
  
  // Main animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  
  // Confetti animations
  const confettiAnims = useRef(
    Array.from({ length: NUM_CONFETTI }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Sparkle animations
  const sparkles = useRef(
    Array.from({ length: 8 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      startAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Reset all animations
    backdropOpacity.setValue(0);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    ringScale.setValue(0.5);
    ringOpacity.setValue(0);
    ring2Scale.setValue(0.5);
    ring2Opacity.setValue(0);
    textOpacity.setValue(0);
    textTranslateY.setValue(30);
    subtitleOpacity.setValue(0);
    subtitleTranslateY.setValue(20);
    logoScale.setValue(0);
    logoRotate.setValue(0);

    // Sequence of animations
    Animated.sequence([
      // 1. Fade in backdrop
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      
      // 2. Logo bounce in with rotation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // 3. Checkmark with rings
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Ring 1
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 2,
              duration: 600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(ringOpacity, {
                toValue: 0.6,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]),

      // 4. Ring 2 (delayed)
      Animated.parallel([
        Animated.timing(ring2Scale, {
          toValue: 2.5,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(ring2Opacity, {
            toValue: 0.4,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Start confetti with delay
    setTimeout(() => startConfetti(), 400);
    
    // Start sparkles
    setTimeout(() => startSparkles(), 300);

    // Text animations
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Subtitle animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Complete after animation
    setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2500);
  };

  const startConfetti = () => {
    confettiAnims.forEach((anim, index) => {
      const startX = Math.random() * width - width / 2;
      const endX = startX + (Math.random() - 0.5) * 200;
      
      anim.translateX.setValue(startX);
      anim.translateY.setValue(-50);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);
      anim.scale.setValue(0.5 + Math.random() * 0.5);

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: height + 50,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
          delay: index * 30,
        }),
        Animated.timing(anim.translateX, {
          toValue: endX,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          delay: index * 30,
        }),
        Animated.timing(anim.rotate, {
          toValue: 5 + Math.random() * 5,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
          delay: index * 30,
        }),
        Animated.sequence([
          Animated.delay(1500 + index * 30),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const startSparkles = () => {
    sparkles.forEach((sparkle, index) => {
      const delay = index * 100;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(sparkle.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(sparkle.scale, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
        { iterations: 3 }
      ).start();
    });
  };

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const sparklePositions = [
    { top: '25%', left: '15%' },
    { top: '20%', right: '15%' },
    { top: '35%', left: '10%' },
    { top: '30%', right: '10%' },
    { top: '55%', left: '12%' },
    { top: '50%', right: '12%' },
    { top: '65%', left: '18%' },
    { top: '60%', right: '18%' },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.container, { opacity: backdropOpacity }]}>
        <LinearGradient
          colors={[colors.background, colors.background]}
          style={styles.gradient}
        >
          {/* Confetti */}
          {confettiAnims.map((anim, index) => {
            const confettiRotate = anim.rotate.interpolate({
              inputRange: [0, 10],
              outputRange: ['0deg', '3600deg'],
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                    width: 8 + Math.random() * 6,
                    height: 8 + Math.random() * 6,
                    borderRadius: Math.random() > 0.5 ? 100 : 2,
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      { rotate: confettiRotate },
                      { scale: anim.scale },
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              />
            );
          })}

          {/* Sparkles */}
          {sparkles.map((sparkle, index) => (
            <Animated.Text
              key={`sparkle-${index}`}
              style={[
                styles.sparkle,
                sparklePositions[index],
                {
                  transform: [{ scale: sparkle.scale }],
                  opacity: sparkle.opacity,
                },
              ]}
            >
              ✨
            </Animated.Text>
          ))}

          {/* Main content */}
          <View style={styles.content}>
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [
                    { scale: logoScale },
                    { rotate: logoSpin },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.logo}
              >
                <Text style={styles.logoText}>+</Text>
              </LinearGradient>
            </Animated.View>

            {/* Checkmark with rings */}
            <View style={styles.checkContainer}>
              {/* Ring 1 */}
              <Animated.View
                style={[
                  styles.ring,
                  {
                    borderColor: colors.primary,
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  },
                ]}
              />
              
              {/* Ring 2 */}
              <Animated.View
                style={[
                  styles.ring,
                  {
                    borderColor: colors.secondary,
                    transform: [{ scale: ring2Scale }],
                    opacity: ring2Opacity,
                  },
                ]}
              />

              {/* Checkmark circle */}
              <Animated.View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: colors.success,
                    transform: [{ scale: checkScale }],
                    opacity: checkOpacity,
                  },
                ]}
              >
                <Text style={styles.checkIcon}>✓</Text>
              </Animated.View>
            </View>

            {/* Welcome text */}
            <Animated.Text
              style={[
                styles.welcomeText,
                {
                  color: colors.textPrimary,
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              Welcome back! 🎉
            </Animated.Text>

            <Animated.Text
              style={[
                styles.userName,
                {
                  color: colors.primary,
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              {userName}
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslateY }],
                },
              ]}
            >
              Let's take care of your health today
            </Animated.Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: width / 2,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  checkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  welcomeText: {
    ...typography.displaySmall,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  userName: {
    ...typography.headlineLarge,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
});

export default LoginSuccessAnimation;
