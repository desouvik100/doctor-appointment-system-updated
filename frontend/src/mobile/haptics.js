/**
 * Haptic Feedback Utility for Native Android Feel
 * Provides MINIMAL vibration feedback for important actions only
 * Reduced haptics for better user experience
 */

import { Capacitor } from '@capacitor/core';

// Global haptic settings - can be disabled by user
let hapticsEnabled = true;

// Haptic feedback types
export const HapticType = {
  LIGHT: 'light',      // Button tap - DISABLED (too frequent)
  MEDIUM: 'medium',    // Selection change - DISABLED
  HEAVY: 'heavy',      // Important action
  SUCCESS: 'success',  // Booking confirmed, payment success
  WARNING: 'warning',  // Alert - DISABLED
  ERROR: 'error',      // Error occurred
  SELECTION: 'selection' // List item selection - DISABLED
};

// Vibration patterns (in milliseconds) - REDUCED
const PATTERNS = {
  light: [5],      // Reduced from 10
  medium: [10],    // Reduced from 20
  heavy: [15],     // Reduced from 30
  success: [10, 30, 10],  // Simplified pattern
  warning: [15],   // Simplified
  error: [20, 50, 20],    // Simplified
  selection: [3]   // Reduced from 5
};

// Types that should trigger haptics (only important ones)
const ENABLED_TYPES = ['success', 'error', 'heavy'];

/**
 * Enable or disable haptics globally
 */
export const setHapticsEnabled = (enabled) => {
  hapticsEnabled = enabled;
};

/**
 * Check if haptics are enabled
 */
export const isHapticsEnabled = () => hapticsEnabled;

/**
 * Trigger haptic feedback - ONLY for important actions
 * @param {string} type - Type of haptic feedback
 */
export const triggerHaptic = async (type = HapticType.LIGHT) => {
  // Skip if haptics disabled or not on native platform
  if (!hapticsEnabled || !Capacitor.isNativePlatform()) return;
  
  // Only trigger for important feedback types
  if (!ENABLED_TYPES.includes(type)) return;

  try {
    // Try Capacitor Haptics plugin first
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    
    switch (type) {
      case HapticType.HEAVY:
        await Haptics.impact({ style: ImpactStyle.Light }); // Downgraded from Heavy
        break;
      case HapticType.SUCCESS:
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case HapticType.ERROR:
        await Haptics.notification({ type: NotificationType.Error });
        break;
      default:
        // Skip other types
        break;
    }
  } catch (e) {
    // Fallback to Web Vibration API - minimal
    if ('vibrate' in navigator && ENABLED_TYPES.includes(type)) {
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
 * Quick tap feedback - DISABLED to reduce haptic overuse
 */
export const tapFeedback = () => {
  // Disabled - too frequent, annoying users
  // triggerHaptic(HapticType.LIGHT);
};

/**
 * Success feedback - use for successful actions (ENABLED)
 */
export const successFeedback = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Error feedback - use for errors (ENABLED)
 */
export const errorFeedback = () => triggerHaptic(HapticType.ERROR);

/**
 * Selection feedback - DISABLED to reduce haptic overuse
 */
export const selectionFeedback = () => {
  // Disabled - too frequent
  // triggerHaptic(HapticType.SELECTION);
};

export default {
  triggerHaptic,
  vibratePattern,
  tapFeedback,
  successFeedback,
  errorFeedback,
  selectionFeedback,
  setHapticsEnabled,
  isHapticsEnabled,
  HapticType
};
