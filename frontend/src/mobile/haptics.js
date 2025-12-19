/**
 * Haptic Feedback Utility for Native Android Feel
 * Provides subtle vibration feedback for user interactions
 */

import { Capacitor } from '@capacitor/core';

// Haptic feedback types
export const HapticType = {
  LIGHT: 'light',      // Button tap
  MEDIUM: 'medium',    // Selection change
  HEAVY: 'heavy',      // Important action
  SUCCESS: 'success',  // Booking confirmed, payment success
  WARNING: 'warning',  // Alert
  ERROR: 'error',      // Error occurred
  SELECTION: 'selection' // List item selection
};

// Vibration patterns (in milliseconds)
const PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10, 50, 30],
  warning: [30, 100, 30],
  error: [50, 100, 50, 100, 50],
  selection: [5]
};

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback
 */
export const triggerHaptic = async (type = HapticType.LIGHT) => {
  // Only on native platform
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Try Capacitor Haptics plugin first
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    
    switch (type) {
      case HapticType.LIGHT:
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case HapticType.MEDIUM:
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case HapticType.HEAVY:
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case HapticType.SUCCESS:
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case HapticType.WARNING:
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case HapticType.ERROR:
        await Haptics.notification({ type: NotificationType.Error });
        break;
      case HapticType.SELECTION:
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
        break;
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch (e) {
    // Fallback to Web Vibration API
    if ('vibrate' in navigator) {
      const pattern = PATTERNS[type] || PATTERNS.light;
      navigator.vibrate(pattern);
    }
  }
};

/**
 * Vibrate with custom pattern
 * @param {number[]} pattern - Array of vibration durations
 */
export const vibratePattern = (pattern) => {
  if (!Capacitor.isNativePlatform()) return;
  
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Quick tap feedback - use for button presses
 */
export const tapFeedback = () => triggerHaptic(HapticType.LIGHT);

/**
 * Success feedback - use for successful actions
 */
export const successFeedback = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Error feedback - use for errors
 */
export const errorFeedback = () => triggerHaptic(HapticType.ERROR);

/**
 * Selection feedback - use for list selections
 */
export const selectionFeedback = () => triggerHaptic(HapticType.SELECTION);

export default {
  triggerHaptic,
  vibratePattern,
  tapFeedback,
  successFeedback,
  errorFeedback,
  selectionFeedback,
  HapticType
};
