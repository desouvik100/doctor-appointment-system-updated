/**
 * Animation Library - Reusable animation presets
 * Usage: import { fadeIn, slideUp, scaleIn } from '../utils/animations';
 */

import { Animated, Easing } from 'react-native';

/**
 * Fade In Animation
 * @param {Animated.Value} animatedValue - The animated value to control
 * @param {number} duration - Animation duration in ms (default: 300)
 * @param {number} delay - Delay before animation starts (default: 0)
 */
export const fadeIn = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade Out Animation
 */
export const fadeOut = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide Up Animation
 * @param {Animated.Value} animatedValue - The animated value to control
 * @param {number} fromValue - Starting position (default: 50)
 * @param {number} toValue - Ending position (default: 0)
 * @param {number} duration - Animation duration in ms (default: 400)
 */
export const slideUp = (animatedValue, fromValue = 50, toValue = 0, duration = 400) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Slide Down Animation
 */
export const slideDown = (animatedValue, fromValue = 0, toValue = 50, duration = 400) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide In From Left
 */
export const slideInLeft = (animatedValue, fromValue = -100, toValue = 0) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Slide In From Right
 */
export const slideInRight = (animatedValue, fromValue = 100, toValue = 0) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Scale In Animation (Zoom In)
 */
export const scaleIn = (animatedValue, duration = 300, delay = 0) => {
  animatedValue.setValue(0);
  return Animated.spring(animatedValue, {
    toValue: 1,
    tension: 50,
    friction: 7,
    delay,
    useNativeDriver: true,
  });
};

/**
 * Scale Out Animation (Zoom Out)
 */
export const scaleOut = (animatedValue, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Bounce Animation
 */
export const bounce = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.2,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Pulse Animation (Heartbeat effect)
 */
export const pulse = (animatedValue, minScale = 0.95, maxScale = 1.05) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Shake Animation (Error feedback)
 */
export const shake = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

/**
 * Rotate Animation (360 degrees)
 */
export const rotate360 = (animatedValue, duration = 1000) => {
  animatedValue.setValue(0);
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Stagger Animation - Animate multiple items with delay
 * @param {Array} animatedValues - Array of animated values
 * @param {Function} animationFn - Animation function to apply
 * @param {number} staggerDelay - Delay between each item (default: 100ms)
 */
export const stagger = (animatedValues, animationFn, staggerDelay = 100) => {
  return Animated.stagger(
    staggerDelay,
    animatedValues.map((value) => animationFn(value))
  );
};

/**
 * Parallel Animation - Run multiple animations simultaneously
 */
export const parallel = (...animations) => {
  return Animated.parallel(animations);
};

/**
 * Sequence Animation - Run animations one after another
 */
export const sequence = (...animations) => {
  return Animated.sequence(animations);
};

/**
 * Press Animation - Scale down and back up (button press effect)
 */
export const pressAnimation = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 80,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Interpolate rotation for rotate360
 */
export const interpolateRotation = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

/**
 * Success Animation - Scale + Fade combo
 */
export const successAnimation = (scaleValue, opacityValue) => {
  return Animated.parallel([
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }),
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Loading Dots Animation - Three dots bouncing
 */
export const loadingDotsAnimation = (dot1, dot2, dot3) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(dot1, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dot2, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dot3, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
    ])
  );
};

/**
 * Card Flip Animation
 */
export const flipCard = (animatedValue) => {
  return Animated.spring(animatedValue, {
    toValue: animatedValue._value === 0 ? 180 : 0,
    friction: 8,
    tension: 10,
    useNativeDriver: true,
  });
};

/**
 * Interpolate for card flip
 */
export const interpolateFlip = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
};

/**
 * Swipe Animation - For swipeable cards
 */
export const swipeAnimation = (animatedValue, direction = 'left', threshold = 300) => {
  const toValue = direction === 'left' ? -threshold : threshold;
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Reset Animation - Return to original position
 */
export const resetAnimation = (animatedValue, toValue = 0) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

/**
 * Elastic Animation - Bouncy effect
 */
export const elastic = (animatedValue, toValue = 1) => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Smooth Scroll Animation
 */
export const smoothScroll = (animatedValue, toValue, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    useNativeDriver: true,
  });
};

// Export all animations as default object
export default {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  scaleOut,
  bounce,
  pulse,
  shake,
  rotate360,
  stagger,
  parallel,
  sequence,
  pressAnimation,
  interpolateRotation,
  successAnimation,
  loadingDotsAnimation,
  flipCard,
  interpolateFlip,
  swipeAnimation,
  resetAnimation,
  elastic,
  smoothScroll,
};
